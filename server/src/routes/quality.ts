import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { QualityInspection } from '../models/QualityInspection';
import { AppError } from '../middleware/errorHandler';
import { protect, restrictTo, AuthRequest } from '../middleware/auth';

const router = express.Router();
router.use(protect);

// @desc    Get all quality inspections
// @route   GET /api/quality/inspections
// @access  Private
router.get('/inspections', [
  query('result').optional().isIn(['PENDING', 'PASS', 'FAIL', 'CONDITIONAL_PASS']).withMessage('Invalid result'),
  query('source').optional().isIn(['RECEIPT', 'PRODUCTION', 'SHIPMENT', 'RANDOM']).withMessage('Invalid source'),
  query('inspectorId').optional().isMongoId().withMessage('Invalid inspector ID'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
], async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const {
      result,
      source,
      inspectorId,
      page = 1,
      limit = 20,
      sort = '-inspectionDate'
    } = req.query;

    const filter: any = { isActive: true };
    
    if (result) filter.result = result;
    if (source) filter.source = source;
    if (inspectorId) filter.inspectorId = inspectorId;

    const skip = (Number(page) - 1) * Number(limit);

    const [inspections, total] = await Promise.all([
      QualityInspection.find(filter)
        .populate('itemId', 'code name unit category')
        .populate('inspectorId', 'name employeeNumber')
        .populate('createdBy', 'name email')
        .sort(sort as string)
        .skip(skip)
        .limit(Number(limit)),
      QualityInspection.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    res.status(200).json({
      status: 'success',
      data: {
        inspections,
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

// @desc    Get single quality inspection
// @route   GET /api/quality/inspections/:id
// @access  Private
router.get('/inspections/:id', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const inspection = await QualityInspection.findById(req.params.id)
      .populate('itemId', 'code name unit category specification')
      .populate('inspectorId', 'name employeeNumber department')
      .populate('createdBy', 'name email');
    
    if (!inspection) {
      return next(new AppError('No inspection found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { inspection }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new quality inspection
// @route   POST /api/quality/inspections
// @access  Private (Inspector/Manager/Admin)
router.post('/inspections', restrictTo('ADMIN', 'MANAGER', 'INSPECTOR'), [
  body('itemId').isMongoId().withMessage('Invalid item ID'),
  body('inspectorId').isMongoId().withMessage('Invalid inspector ID'),
  body('inspectedQuantity').isFloat({ gt: 0 }).withMessage('Inspected quantity must be positive'),
  body('unit').notEmpty().trim().withMessage('Unit is required'),
  body('source').isIn(['RECEIPT', 'PRODUCTION', 'SHIPMENT', 'RANDOM']).withMessage('Invalid source'),
  body('inspectionMethod').optional().isIn(['FULL', 'SAMPLING', 'STATISTICAL']).withMessage('Invalid inspection method'),
  body('standards').isArray({ min: 1 }).withMessage('At least one standard is required'),
  body('standards.*.dimension').notEmpty().withMessage('Standard dimension is required'),
  body('standards.*.tolerance').notEmpty().withMessage('Standard tolerance is required'),
  body('standards.*.testMethod').notEmpty().withMessage('Standard test method is required'),
], async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const inspectionData = {
      ...req.body,
      createdBy: req.user!._id
    };

    const newInspection = await QualityInspection.create(inspectionData);
    await newInspection.populate([
      { path: 'itemId', select: 'code name unit' },
      { path: 'inspectorId', select: 'name employeeNumber' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.status(201).json({
      status: 'success',
      data: { inspection: newInspection }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update quality inspection
// @route   PATCH /api/quality/inspections/:id
// @access  Private (Inspector/Manager/Admin)
router.patch('/inspections/:id', restrictTo('ADMIN', 'MANAGER', 'INSPECTOR'), [
  body('inspectedQuantity').optional().isFloat({ gt: 0 }).withMessage('Inspected quantity must be positive'),
  body('passedQuantity').optional().isFloat({ min: 0 }).withMessage('Passed quantity cannot be negative'),
  body('failedQuantity').optional().isFloat({ min: 0 }).withMessage('Failed quantity cannot be negative'),
  body('result').optional().isIn(['PENDING', 'PASS', 'FAIL', 'CONDITIONAL_PASS']).withMessage('Invalid result'),
], async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const inspection = await QualityInspection.findById(req.params.id);
    if (!inspection) {
      return next(new AppError('No inspection found with that ID', 404));
    }

    // Validate quantities if provided
    const passedQty = req.body.passedQuantity ?? inspection.passedQuantity;
    const failedQty = req.body.failedQuantity ?? inspection.failedQuantity;
    const inspectedQty = req.body.inspectedQuantity ?? inspection.inspectedQuantity;
    
    if (passedQty + failedQty > inspectedQty) {
      return next(new AppError('Passed + Failed quantity cannot exceed inspected quantity', 400));
    }

    const updatedInspection = await QualityInspection.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user!._id },
      { new: true, runValidators: true }
    ).populate([
      { path: 'itemId', select: 'code name unit' },
      { path: 'inspectorId', select: 'name employeeNumber' }
    ]);

    res.status(200).json({
      status: 'success',
      data: { inspection: updatedInspection }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Complete quality inspection
// @route   POST /api/quality/inspections/:id/complete
// @access  Private (Inspector/Manager/Admin)
router.post('/inspections/:id/complete', restrictTo('ADMIN', 'MANAGER', 'INSPECTOR'), [
  body('result').isIn(['PASS', 'FAIL', 'CONDITIONAL_PASS']).withMessage('Invalid result'),
  body('passedQuantity').isFloat({ min: 0 }).withMessage('Passed quantity cannot be negative'),
  body('failedQuantity').isFloat({ min: 0 }).withMessage('Failed quantity cannot be negative'),
  body('defectTypes').optional().isArray().withMessage('Defect types must be an array'),
], async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const inspection = await QualityInspection.findById(req.params.id);
    if (!inspection) {
      return next(new AppError('No inspection found with that ID', 404));
    }

    try {
      inspection.complete(
        req.body.result,
        req.body.passedQuantity,
        req.body.failedQuantity,
        req.body.notes
      );
      
      if (req.body.defectTypes && req.body.defectTypes.length > 0) {
        inspection.defectTypes = req.body.defectTypes;
      }
      
      inspection.updatedBy = req.user!._id;
      await inspection.save();

      res.status(200).json({
        status: 'success',
        data: { inspection }
      });
    } catch (error) {
      return next(new AppError((error as Error).message, 400));
    }
  } catch (error) {
    next(error);
  }
});

// @desc    Get pending inspections
// @route   GET /api/quality/inspections/pending
// @access  Private
router.get('/inspections/pending', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const pendingInspections = await QualityInspection.findPending()
      .populate('itemId', 'code name unit')
      .populate('inspectorId', 'name employeeNumber');

    res.status(200).json({
      status: 'success',
      data: { inspections: pendingInspections }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get quality statistics
// @route   GET /api/quality/statistics
// @access  Private
router.get('/statistics', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const statistics = await QualityInspection.getStatistics();
    
    // Get pass rate for current month
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    const monthlyStats = await QualityInspection.getPassRateByPeriod(startOfMonth, endOfMonth);

    res.status(200).json({
      status: 'success',
      data: {
        statistics,
        monthlyStats
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get pass rate by period
// @route   GET /api/quality/pass-rate
// @access  Private
router.get('/pass-rate', [
  query('startDate').isISO8601().withMessage('Invalid start date'),
  query('endDate').isISO8601().withMessage('Invalid end date'),
], async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const { startDate, endDate } = req.query;
    
    const stats = await QualityInspection.getPassRateByPeriod(
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.status(200).json({
      status: 'success',
      data: { stats }
    });
  } catch (error) {
    next(error);
  }
});

export default router;