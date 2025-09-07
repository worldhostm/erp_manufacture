import express from 'express';
import { body, query, validationResult } from 'express-validator';
import ProductionPlan from '../models/ProductionPlan';
import Item from '../models/Item';
import { protect, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import * as ExcelJS from 'exceljs';

const router = express.Router();
router.use(protect);

// @desc    Get all production plans
// @route   GET /api/production-plans
// @access  Private
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['DRAFT', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).withMessage('Invalid status'),
  query('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority'),
  query('search').optional().isString().trim()
], async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {
      companyId: req.user!.companyId,
      isActive: true
    };

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.priority) {
      query.priority = req.query.priority;
    }

    if (req.query.search) {
      const searchTerm = req.query.search as string;
      query.$or = [
        { planNumber: { $regex: searchTerm, $options: 'i' } },
        { itemName: { $regex: searchTerm, $options: 'i' } },
        { itemCode: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      query.startDate = {};
      if (req.query.startDate) {
        query.startDate.$gte = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        query.startDate.$lte = new Date(req.query.endDate as string);
      }
    }

    const [plans, totalCount] = await Promise.all([
      ProductionPlan.find(query)
        .populate('itemId', 'name code category unit')
        .populate('createdBy', 'name email')
        .populate('approvedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ProductionPlan.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      success: true,
      data: {
        plans,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get production plan by ID
// @route   GET /api/production-plans/:id
// @access  Private
router.get('/:id', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const plan = await ProductionPlan.findOne({
      _id: req.params.id,
      companyId: req.user!.companyId,
      isActive: true
    })
      .populate('itemId', 'name code category unit description')
      .populate('createdBy', 'name email department position')
      .populate('approvedBy', 'name email department position');

    if (!plan) {
      return next(new AppError('Production plan not found', 404));
    }

    res.status(200).json({
      success: true,
      data: plan
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new production plan
// @route   POST /api/production-plans
// @access  Private
router.post('/', [
  body('itemId').notEmpty().withMessage('Item ID is required'),
  body('plannedQuantity').isInt({ min: 1 }).withMessage('Planned quantity must be at least 1'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('notes').optional().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters')
], async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const { itemId, plannedQuantity, startDate, endDate, priority, description, notes } = req.body;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      return next(new AppError('End date must be after start date', 400));
    }

    // Check if item exists
    const item = await Item.findOne({
      _id: itemId,
      companyId: req.user!.companyId,
      isActive: true
    });

    if (!item) {
      return next(new AppError('Item not found', 404));
    }

    // Create production plan
    const productionPlan = await ProductionPlan.create({
      itemId,
      itemName: item.name,
      itemCode: item.code,
      plannedQuantity,
      startDate: start,
      endDate: end,
      priority: priority || 'MEDIUM',
      description,
      notes,
      createdBy: req.user!._id,
      companyId: req.user!.companyId
    });

    // Populate the created plan
    await productionPlan.populate('itemId', 'name code category unit');
    await productionPlan.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: productionPlan
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update production plan
// @route   PUT /api/production-plans/:id
// @access  Private
router.put('/:id', [
  body('plannedQuantity').optional().isInt({ min: 1 }).withMessage('Planned quantity must be at least 1'),
  body('startDate').optional().isISO8601().withMessage('Valid start date is required'),
  body('endDate').optional().isISO8601().withMessage('Valid end date is required'),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority'),
  body('status').optional().isIn(['DRAFT', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).withMessage('Invalid status'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('notes').optional().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters')
], async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const plan = await ProductionPlan.findOne({
      _id: req.params.id,
      companyId: req.user!.companyId,
      isActive: true
    });

    if (!plan) {
      return next(new AppError('Production plan not found', 404));
    }

    // Check if plan can be updated
    if (plan.status === 'COMPLETED' || plan.status === 'CANCELLED') {
      return next(new AppError('Cannot update completed or cancelled production plan', 400));
    }

    const updateData = req.body;

    // Validate dates if provided
    if (updateData.startDate || updateData.endDate) {
      const start = new Date(updateData.startDate || plan.startDate);
      const end = new Date(updateData.endDate || plan.endDate);
      if (end <= start) {
        return next(new AppError('End date must be after start date', 400));
      }
    }

    // Update the plan
    Object.assign(plan, updateData);
    await plan.save();

    // Populate the updated plan
    await plan.populate('itemId', 'name code category unit');
    await plan.populate('createdBy', 'name email');
    await plan.populate('approvedBy', 'name email');

    res.status(200).json({
      success: true,
      data: plan
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Approve production plan
// @route   PATCH /api/production-plans/:id/approve
// @access  Private
router.patch('/:id/approve', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const plan = await ProductionPlan.findOne({
      _id: req.params.id,
      companyId: req.user!.companyId,
      isActive: true
    });

    if (!plan) {
      return next(new AppError('Production plan not found', 404));
    }

    if (plan.status !== 'DRAFT') {
      return next(new AppError('Only draft plans can be approved', 400));
    }

    plan.status = 'APPROVED';
    plan.approvedBy = req.user!._id;
    plan.approvedAt = new Date();
    await plan.save();

    await plan.populate('approvedBy', 'name email');

    res.status(200).json({
      success: true,
      data: plan,
      message: 'Production plan approved successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Start production plan
// @route   PATCH /api/production-plans/:id/start
// @access  Private
router.patch('/:id/start', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const plan = await ProductionPlan.findOne({
      _id: req.params.id,
      companyId: req.user!.companyId,
      isActive: true
    });

    if (!plan) {
      return next(new AppError('Production plan not found', 404));
    }

    if (plan.status !== 'APPROVED') {
      return next(new AppError('Only approved plans can be started', 400));
    }

    plan.status = 'IN_PROGRESS';
    await plan.save();

    res.status(200).json({
      success: true,
      data: plan,
      message: 'Production plan started successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update production quantity
// @route   PATCH /api/production-plans/:id/production
// @access  Private
router.patch('/:id/production', [
  body('producedQuantity').isInt({ min: 0 }).withMessage('Produced quantity must be non-negative')
], async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const { producedQuantity } = req.body;

    const plan = await ProductionPlan.findOne({
      _id: req.params.id,
      companyId: req.user!.companyId,
      isActive: true
    });

    if (!plan) {
      return next(new AppError('Production plan not found', 404));
    }

    if (plan.status !== 'IN_PROGRESS') {
      return next(new AppError('Can only update production for in-progress plans', 400));
    }

    plan.producedQuantity = producedQuantity;

    // Auto-complete if target reached
    if (producedQuantity >= plan.plannedQuantity) {
      plan.status = 'COMPLETED';
    }

    await plan.save();

    res.status(200).json({
      success: true,
      data: plan,
      message: 'Production quantity updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete production plan (soft delete)
// @route   DELETE /api/production-plans/:id
// @access  Private
router.delete('/:id', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const plan = await ProductionPlan.findOne({
      _id: req.params.id,
      companyId: req.user!.companyId,
      isActive: true
    });

    if (!plan) {
      return next(new AppError('Production plan not found', 404));
    }

    if (plan.status === 'IN_PROGRESS') {
      return next(new AppError('Cannot delete in-progress production plan', 400));
    }

    plan.isActive = false;
    await plan.save();

    res.status(200).json({
      success: true,
      message: 'Production plan deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Export production plans to Excel
// @route   GET /api/production-plans/export/excel
// @access  Private
router.get('/export/excel', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    // Build query (similar to GET all)
    const query: any = {
      companyId: req.user!.companyId,
      isActive: true
    };

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.priority) {
      query.priority = req.query.priority;
    }

    if (req.query.search) {
      const searchTerm = req.query.search as string;
      query.$or = [
        { planNumber: { $regex: searchTerm, $options: 'i' } },
        { itemName: { $regex: searchTerm, $options: 'i' } },
        { itemCode: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    const plans = await ProductionPlan.find(query)
      .populate('itemId', 'name code category unit')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('생산계획');

    // Set columns
    worksheet.columns = [
      { header: '계획번호', key: 'planNumber', width: 15 },
      { header: '품목코드', key: 'itemCode', width: 15 },
      { header: '품목명', key: 'itemName', width: 20 },
      { header: '계획수량', key: 'plannedQuantity', width: 12 },
      { header: '생산수량', key: 'producedQuantity', width: 12 },
      { header: '완료율(%)', key: 'completionRate', width: 12 },
      { header: '시작일', key: 'startDate', width: 12 },
      { header: '완료일', key: 'endDate', width: 12 },
      { header: '우선순위', key: 'priority', width: 12 },
      { header: '상태', key: 'status', width: 12 },
      { header: '작성자', key: 'createdBy', width: 15 },
      { header: '승인자', key: 'approvedBy', width: 15 },
      { header: '설명', key: 'description', width: 30 },
      { header: '작성일', key: 'createdAt', width: 12 }
    ];

    // Style the header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6F3FF' }
    };

    // Priority and Status mapping
    const priorityMap = { LOW: '낮음', MEDIUM: '보통', HIGH: '높음', URGENT: '긴급' };
    const statusMap = { 
      DRAFT: '작성중', 
      APPROVED: '승인됨', 
      IN_PROGRESS: '진행중', 
      COMPLETED: '완료', 
      CANCELLED: '취소' 
    };

    // Add data rows
    plans.forEach(plan => {
      const completionRate = plan.plannedQuantity > 0 
        ? Math.round((plan.producedQuantity / plan.plannedQuantity) * 100) 
        : 0;

      worksheet.addRow({
        planNumber: plan.planNumber,
        itemCode: plan.itemCode,
        itemName: plan.itemName,
        plannedQuantity: plan.plannedQuantity,
        producedQuantity: plan.producedQuantity,
        completionRate,
        startDate: new Date(plan.startDate).toLocaleDateString('ko-KR'),
        endDate: new Date(plan.endDate).toLocaleDateString('ko-KR'),
        priority: priorityMap[plan.priority] || plan.priority,
        status: statusMap[plan.status] || plan.status,
        createdBy: (plan.createdBy as any)?.name || '',
        approvedBy: (plan.approvedBy as any)?.name || '',
        description: plan.description || '',
        createdAt: new Date(plan.createdAt).toLocaleDateString('ko-KR')
      });
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      if (column.header !== '설명') {
        column.width = Math.max(column.width || 10, 12);
      }
    });

    // Set response headers
    const fileName = `생산계획_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
});

export default router;