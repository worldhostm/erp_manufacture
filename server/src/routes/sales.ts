import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { SalesOrder } from '../models/SalesOrder';
import { AppError } from '../middleware/errorHandler';
import { protect, restrictTo, AuthRequest } from '../middleware/auth';

const router = express.Router();
router.use(protect);

// @desc    Get all sales orders
// @route   GET /api/sales/orders
// @access  Private
router.get('/orders', [
  query('status').optional().isIn(['DRAFT', 'CONFIRMED', 'IN_PRODUCTION', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'CANCELLED']).withMessage('Invalid status'),
  query('customerId').optional().isMongoId().withMessage('Invalid customer ID'),
  query('paymentStatus').optional().isIn(['PENDING', 'PARTIAL', 'PAID', 'OVERDUE']).withMessage('Invalid payment status'),
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
      customerId,
      paymentStatus,
      page = 1,
      limit = 20,
      sort = '-orderDate'
    } = req.query;

    const filter: any = { isActive: true };
    
    if (status) filter.status = status;
    if (customerId) filter.customerId = customerId;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const skip = (Number(page) - 1) * Number(limit);

    const [salesOrders, total] = await Promise.all([
      SalesOrder.find(filter)
        .populate('customerId', 'name type businessNumber email')
        .populate('createdBy', 'name email')
        .populate('approvedBy', 'name email')
        .sort(sort as string)
        .skip(skip)
        .limit(Number(limit)),
      SalesOrder.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    res.status(200).json({
      status: 'success',
      data: {
        orders: salesOrders,
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

// @desc    Get single sales order
// @route   GET /api/sales/orders/:id
// @access  Private
router.get('/orders/:id', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const salesOrder = await SalesOrder.findById(req.params.id)
      .populate('customerId', 'name type businessNumber email phone address')
      .populate({
        path: 'items.itemId',
        select: 'code name unit category price'
      })
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email');
    
    if (!salesOrder) {
      return next(new AppError('No sales order found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { order: salesOrder }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new sales order
// @route   POST /api/sales/orders
// @access  Private (Sales/Manager/Admin)
router.post('/orders', restrictTo('ADMIN', 'MANAGER', 'SALES'), [
  body('customerId').isMongoId().withMessage('Invalid customer ID'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.itemId').isMongoId().withMessage('Invalid item ID'),
  body('items.*.quantity').isFloat({ gt: 0 }).withMessage('Item quantity must be positive'),
  body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Unit price cannot be negative'),
  body('requestedDeliveryDate').optional().isISO8601().withMessage('Invalid delivery date'),
  body('taxAmount').optional().isFloat({ min: 0 }).withMessage('Tax amount cannot be negative'),
  body('discountAmount').optional().isFloat({ min: 0 }).withMessage('Discount amount cannot be negative'),
], async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    // Calculate item totals
    const items = req.body.items.map((item: any) => ({
      ...item,
      totalPrice: item.quantity * item.unitPrice
    }));

    const salesOrderData = {
      ...req.body,
      items,
      createdBy: req.user!._id
    };

    const newSalesOrder = await SalesOrder.create(salesOrderData);
    await newSalesOrder.populate([
      { path: 'customerId', select: 'name type businessNumber' },
      { path: 'items.itemId', select: 'code name unit' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.status(201).json({
      status: 'success',
      data: { order: newSalesOrder }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update sales order
// @route   PATCH /api/sales/orders/:id
// @access  Private (Sales/Manager/Admin)
router.patch('/orders/:id', restrictTo('ADMIN', 'MANAGER', 'SALES'), [
  body('items').optional().isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.itemId').optional().isMongoId().withMessage('Invalid item ID'),
  body('items.*.quantity').optional().isFloat({ gt: 0 }).withMessage('Item quantity must be positive'),
  body('items.*.unitPrice').optional().isFloat({ min: 0 }).withMessage('Unit price cannot be negative'),
  body('requestedDeliveryDate').optional().isISO8601().withMessage('Invalid delivery date'),
  body('taxAmount').optional().isFloat({ min: 0 }).withMessage('Tax amount cannot be negative'),
  body('discountAmount').optional().isFloat({ min: 0 }).withMessage('Discount amount cannot be negative'),
], async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const salesOrder = await SalesOrder.findById(req.params.id);
    if (!salesOrder) {
      return next(new AppError('No sales order found with that ID', 404));
    }

    // Only allow updates for DRAFT orders
    if (salesOrder.status !== 'DRAFT') {
      return next(new AppError('Only draft orders can be updated', 400));
    }

    let updateData = { ...req.body };

    // Recalculate item totals if items are updated
    if (req.body.items) {
      updateData.items = req.body.items.map((item: any) => ({
        ...item,
        totalPrice: item.quantity * item.unitPrice
      }));
    }

    const updatedSalesOrder = await SalesOrder.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'customerId', select: 'name type businessNumber' },
      { path: 'items.itemId', select: 'code name unit' }
    ]);

    res.status(200).json({
      status: 'success',
      data: { order: updatedSalesOrder }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Confirm sales order
// @route   POST /api/sales/orders/:id/confirm
// @access  Private (Manager/Admin)
router.post('/orders/:id/confirm', restrictTo('ADMIN', 'MANAGER'), async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const salesOrder = await SalesOrder.findById(req.params.id);
    if (!salesOrder) {
      return next(new AppError('No sales order found with that ID', 404));
    }

    try {
      salesOrder.confirm(req.user!._id);
      await salesOrder.save();

      res.status(200).json({
        status: 'success',
        data: { order: salesOrder }
      });
    } catch (error) {
      return next(new AppError((error as Error).message, 400));
    }
  } catch (error) {
    next(error);
  }
});

// @desc    Cancel sales order
// @route   POST /api/sales/orders/:id/cancel
// @access  Private (Manager/Admin)
router.post('/orders/:id/cancel', restrictTo('ADMIN', 'MANAGER'), async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const salesOrder = await SalesOrder.findById(req.params.id);
    if (!salesOrder) {
      return next(new AppError('No sales order found with that ID', 404));
    }

    try {
      salesOrder.cancel(req.body.reason);
      await salesOrder.save();

      res.status(200).json({
        status: 'success',
        data: { order: salesOrder }
      });
    } catch (error) {
      return next(new AppError((error as Error).message, 400));
    }
  } catch (error) {
    next(error);
  }
});

// @desc    Ship sales order
// @route   POST /api/sales/orders/:id/ship
// @access  Private (Shipping/Manager/Admin)
router.post('/orders/:id/ship', restrictTo('ADMIN', 'MANAGER', 'SHIPPING'), [
  body('actualDeliveryDate').optional().isISO8601().withMessage('Invalid delivery date'),
], async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const salesOrder = await SalesOrder.findById(req.params.id);
    if (!salesOrder) {
      return next(new AppError('No sales order found with that ID', 404));
    }

    try {
      salesOrder.ship(req.body.actualDeliveryDate);
      await salesOrder.save();

      res.status(200).json({
        status: 'success',
        data: { order: salesOrder }
      });
    } catch (error) {
      return next(new AppError((error as Error).message, 400));
    }
  } catch (error) {
    next(error);
  }
});

// @desc    Update payment status
// @route   PATCH /api/sales/orders/:id/payment
// @access  Private (Accounting/Manager/Admin)
router.patch('/orders/:id/payment', restrictTo('ADMIN', 'MANAGER', 'ACCOUNTING'), [
  body('paymentStatus').isIn(['PENDING', 'PARTIAL', 'PAID', 'OVERDUE']).withMessage('Invalid payment status'),
], async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const updatedSalesOrder = await SalesOrder.findByIdAndUpdate(
      req.params.id,
      { paymentStatus: req.body.paymentStatus },
      { new: true, runValidators: true }
    );

    if (!updatedSalesOrder) {
      return next(new AppError('No sales order found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { order: updatedSalesOrder }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get sales statistics
// @route   GET /api/sales/statistics
// @access  Private
router.get('/statistics', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const statistics = await SalesOrder.getStatistics();
    const overdue = await SalesOrder.findOverdue();

    // Get current month revenue
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    const monthlyRevenue = await SalesOrder.getRevenueByPeriod(startOfMonth, endOfMonth);

    res.status(200).json({
      status: 'success',
      data: {
        statistics,
        overdueCount: overdue.length,
        monthlyRevenue
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get revenue by period
// @route   GET /api/sales/revenue
// @access  Private
router.get('/revenue', [
  query('startDate').isISO8601().withMessage('Invalid start date'),
  query('endDate').isISO8601().withMessage('Invalid end date'),
], async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const { startDate, endDate } = req.query;
    
    const revenue = await SalesOrder.getRevenueByPeriod(
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.status(200).json({
      status: 'success',
      data: { revenue }
    });
  } catch (error) {
    next(error);
  }
});

export default router;