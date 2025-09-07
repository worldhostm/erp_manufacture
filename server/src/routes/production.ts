import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { WorkOrder } from '../models/WorkOrder';
import { AppError } from '../middleware/errorHandler';
import { protect, restrictTo, AuthRequest } from '../middleware/auth';

const router = express.Router();
router.use(protect);

// @desc    Get all work orders
// @route   GET /api/production/work-orders
// @access  Private
router.get('/work-orders', [
  query('status').optional().isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'PAUSED', 'CANCELLED']).withMessage('Invalid status'),
  query('workCenter').optional().trim().isLength({ max: 100 }).withMessage('Work center name too long'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
], async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const {
      status,
      workCenter,
      page = 1,
      limit = 20,
      sort = '-createdAt'
    } = req.query;

    const filter: any = { isActive: true };
    
    if (status) filter.status = status;
    if (workCenter) filter.workCenter = { $regex: workCenter, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);

    const [workOrders, total] = await Promise.all([
      WorkOrder.find(filter)
        .populate('itemId', 'code name unit')
        .populate('supervisorId', 'name employeeNumber')
        .populate('createdBy', 'name email')
        .sort(sort as string)
        .skip(skip)
        .limit(Number(limit)),
      WorkOrder.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    res.status(200).json({
      status: 'success',
      data: {
        workOrders,
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalCount: total,
          hasNext: Number(page) < totalPages,
          hasPrev: Number(page) > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single work order
// @route   GET /api/production/work-orders/:id
// @access  Private
router.get('/work-orders/:id', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const workOrder = await WorkOrder.findById(req.params.id)
      .populate('itemId', 'code name unit specification')
      .populate('supervisorId', 'name employeeNumber department')
      .populate({
        path: 'materials.itemId',
        select: 'code name unit'
      })
      .populate('createdBy', 'name email');
    
    if (!workOrder) {
      return next(new AppError('No work order found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { workOrder }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new work order
// @route   POST /api/production/work-orders
// @access  Private (Manager/Admin)
router.post('/work-orders', restrictTo('ADMIN', 'MANAGER'), [
  body('itemId').isMongoId().withMessage('Invalid item ID'),
  body('quantity').isFloat({ gt: 0 }).withMessage('Quantity must be positive'),
  body('unit').notEmpty().trim().withMessage('Unit is required'),
  body('workCenter').notEmpty().trim().withMessage('Work center is required'),
  body('startDate').isISO8601().withMessage('Invalid start date'),
  body('endDate').isISO8601().withMessage('Invalid end date'),
  body('priority').optional().isIn(['LOW', 'NORMAL', 'HIGH', 'URGENT']).withMessage('Invalid priority'),
], async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    // Validate dates
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);
    
    if (endDate <= startDate) {
      return next(new AppError('End date must be after start date', 400));
    }

    const workOrderData = {
      ...req.body,
      createdBy: req.user!._id
    };

    const newWorkOrder = await WorkOrder.create(workOrderData);
    await newWorkOrder.populate([
      { path: 'itemId', select: 'code name unit' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.status(201).json({
      status: 'success',
      data: { workOrder: newWorkOrder }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update work order
// @route   PATCH /api/production/work-orders/:id
// @access  Private (Manager/Admin)
router.patch('/work-orders/:id', restrictTo('ADMIN', 'MANAGER'), [
  body('quantity').optional().isFloat({ gt: 0 }).withMessage('Quantity must be positive'),
  body('workCenter').optional().notEmpty().trim().withMessage('Work center cannot be empty'),
  body('startDate').optional().isISO8601().withMessage('Invalid start date'),
  body('endDate').optional().isISO8601().withMessage('Invalid end date'),
  body('priority').optional().isIn(['LOW', 'NORMAL', 'HIGH', 'URGENT']).withMessage('Invalid priority'),
  body('completedQuantity').optional().isFloat({ min: 0 }).withMessage('Completed quantity cannot be negative'),
  body('defectQuantity').optional().isFloat({ min: 0 }).withMessage('Defect quantity cannot be negative'),
], async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const workOrder = await WorkOrder.findById(req.params.id);
    if (!workOrder) {
      return next(new AppError('No work order found with that ID', 404));
    }

    // Validate dates if provided
    const startDate = req.body.startDate ? new Date(req.body.startDate) : workOrder.startDate;
    const endDate = req.body.endDate ? new Date(req.body.endDate) : workOrder.endDate;
    
    if (endDate <= startDate) {
      return next(new AppError('End date must be after start date', 400));
    }

    const updatedWorkOrder = await WorkOrder.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user!._id },
      { new: true, runValidators: true }
    ).populate([
      { path: 'itemId', select: 'code name unit' },
      { path: 'supervisorId', select: 'name employeeNumber' }
    ]);

    res.status(200).json({
      status: 'success',
      data: { workOrder: updatedWorkOrder }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Start work order
// @route   POST /api/production/work-orders/:id/start
// @access  Private
router.post('/work-orders/:id/start', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const workOrder = await WorkOrder.findById(req.params.id);
    if (!workOrder) {
      return next(new AppError('No work order found with that ID', 404));
    }

    try {
      workOrder.start(req.body.actualStartDate);
      workOrder.updatedBy = req.user!._id;
      await workOrder.save();

      res.status(200).json({
        status: 'success',
        data: { workOrder }
      });
    } catch (error) {
      return next(new AppError((error as Error).message, 400));
    }
  } catch (error) {
    next(error);
  }
});

// @desc    Complete work order
// @route   POST /api/production/work-orders/:id/complete
// @access  Private
router.post('/work-orders/:id/complete', [
  body('completedQuantity').isFloat({ gt: 0 }).withMessage('Completed quantity must be positive'),
  body('defectQuantity').optional().isFloat({ min: 0 }).withMessage('Defect quantity cannot be negative'),
], async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const workOrder = await WorkOrder.findById(req.params.id);
    if (!workOrder) {
      return next(new AppError('No work order found with that ID', 404));
    }

    try {
      workOrder.complete(req.body.completedQuantity, req.body.actualEndDate);
      if (req.body.defectQuantity) {
        workOrder.defectQuantity = req.body.defectQuantity;
      }
      workOrder.updatedBy = req.user!._id;
      await workOrder.save();

      res.status(200).json({
        status: 'success',
        data: { workOrder }
      });
    } catch (error) {
      return next(new AppError((error as Error).message, 400));
    }
  } catch (error) {
    next(error);
  }
});

// @desc    Pause work order
// @route   POST /api/production/work-orders/:id/pause
// @access  Private
router.post('/work-orders/:id/pause', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const workOrder = await WorkOrder.findById(req.params.id);
    if (!workOrder) {
      return next(new AppError('No work order found with that ID', 404));
    }

    try {
      workOrder.pause(req.body.reason);
      workOrder.updatedBy = req.user!._id;
      await workOrder.save();

      res.status(200).json({
        status: 'success',
        data: { workOrder }
      });
    } catch (error) {
      return next(new AppError((error as Error).message, 400));
    }
  } catch (error) {
    next(error);
  }
});

// @desc    Resume work order
// @route   POST /api/production/work-orders/:id/resume
// @access  Private
router.post('/work-orders/:id/resume', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const workOrder = await WorkOrder.findById(req.params.id);
    if (!workOrder) {
      return next(new AppError('No work order found with that ID', 404));
    }

    try {
      workOrder.resume();
      workOrder.updatedBy = req.user!._id;
      await workOrder.save();

      res.status(200).json({
        status: 'success',
        data: { workOrder }
      });
    } catch (error) {
      return next(new AppError((error as Error).message, 400));
    }
  } catch (error) {
    next(error);
  }
});

// @desc    Get work order statistics
// @route   GET /api/production/statistics
// @access  Private
router.get('/statistics', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const statistics = await WorkOrder.getStatistics();
    const overdue = await WorkOrder.findOverdue();

    res.status(200).json({
      status: 'success',
      data: {
        statistics,
        overdueCount: overdue.length
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;