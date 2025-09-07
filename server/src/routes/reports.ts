import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { protect, AuthRequest } from '../middleware/auth';
import { SalesOrder } from '../models/SalesOrder';
import { WorkOrder } from '../models/WorkOrder';
import { QualityInspection } from '../models/QualityInspection';
import { PurchaseOrder } from '../models/Purchase';
import { InventoryStock } from '../models/InventoryStock';
import { AppError } from '../middleware/errorHandler';

const router = express.Router();
router.use(protect);

// @desc    Get sales report
// @route   GET /api/reports/sales
// @access  Private
router.get('/sales', [
  query('startDate').isISO8601().withMessage('Invalid start date'),
  query('endDate').isISO8601().withMessage('Invalid end date'),
  query('groupBy').optional().isIn(['day', 'week', 'month']).withMessage('Invalid group by value')
], async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const { startDate, endDate, groupBy = 'day' } = req.query;
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Revenue report
    const revenueData = await SalesOrder.getRevenueByPeriod(start, end);
    
    // Sales by status
    const salesByStatus = await SalesOrder.aggregate([
      {
        $match: {
          orderDate: { $gte: start, $lte: end },
          isActive: true
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Top customers
    const topCustomers = await SalesOrder.aggregate([
      {
        $match: {
          orderDate: { $gte: start, $lte: end },
          status: { $ne: 'CANCELLED' },
          isActive: true
        }
      },
      {
        $group: {
          _id: '$customerId',
          orderCount: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'companies',
          localField: '_id',
          foreignField: '_id',
          as: 'customer'
        }
      },
      { $unwind: '$customer' }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        revenue: revenueData,
        salesByStatus,
        topCustomers
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get production report
// @route   GET /api/reports/production
// @access  Private
router.get('/production', [
  query('startDate').isISO8601().withMessage('Invalid start date'),
  query('endDate').isISO8601().withMessage('Invalid end date')
], async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const { startDate, endDate } = req.query;
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Work orders by status
    const workOrdersByStatus = await WorkOrder.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          isActive: true
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          completedQuantity: { $sum: '$completedQuantity' }
        }
      }
    ]);

    // Production efficiency
    const efficiencyData = await WorkOrder.aggregate([
      {
        $match: {
          status: 'COMPLETED',
          createdAt: { $gte: start, $lte: end },
          isActive: true
        }
      },
      {
        $group: {
          _id: null,
          totalPlanned: { $sum: '$quantity' },
          totalCompleted: { $sum: '$completedQuantity' },
          totalDefects: { $sum: '$defectQuantity' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $addFields: {
          efficiency: {
            $multiply: [
              { $divide: ['$totalCompleted', '$totalPlanned'] },
              100
            ]
          },
          defectRate: {
            $multiply: [
              { $divide: ['$totalDefects', '$totalCompleted'] },
              100
            ]
          }
        }
      }
    ]);

    // Production by work center
    const productionByWorkCenter = await WorkOrder.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          isActive: true
        }
      },
      {
        $group: {
          _id: '$workCenter',
          orderCount: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          completedQuantity: { $sum: '$completedQuantity' }
        }
      },
      { $sort: { completedQuantity: -1 } }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        workOrdersByStatus,
        efficiency: efficiencyData[0] || {
          totalPlanned: 0,
          totalCompleted: 0,
          totalDefects: 0,
          orderCount: 0,
          efficiency: 0,
          defectRate: 0
        },
        productionByWorkCenter
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get quality report
// @route   GET /api/reports/quality
// @access  Private
router.get('/quality', [
  query('startDate').isISO8601().withMessage('Invalid start date'),
  query('endDate').isISO8601().withMessage('Invalid end date')
], async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const { startDate, endDate } = req.query;
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Pass rate statistics
    const passRateStats = await QualityInspection.getPassRateByPeriod(start, end);

    // Inspections by result
    const inspectionsByResult = await QualityInspection.aggregate([
      {
        $match: {
          inspectionDate: { $gte: start, $lte: end },
          isActive: true
        }
      },
      {
        $group: {
          _id: '$result',
          count: { $sum: 1 },
          totalInspected: { $sum: '$inspectedQuantity' },
          totalPassed: { $sum: '$passedQuantity' },
          totalFailed: { $sum: '$failedQuantity' }
        }
      }
    ]);

    // Defect analysis
    const defectAnalysis = await QualityInspection.aggregate([
      {
        $match: {
          inspectionDate: { $gte: start, $lte: end },
          result: 'FAIL',
          defectTypes: { $exists: true, $ne: [] },
          isActive: true
        }
      },
      { $unwind: '$defectTypes' },
      {
        $group: {
          _id: '$defectTypes',
          count: { $sum: 1 },
          totalFailed: { $sum: '$failedQuantity' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Inspections by source
    const inspectionsBySource = await QualityInspection.aggregate([
      {
        $match: {
          inspectionDate: { $gte: start, $lte: end },
          isActive: true
        }
      },
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 },
          passedCount: {
            $sum: {
              $cond: [{ $eq: ['$result', 'PASS'] }, 1, 0]
            }
          }
        }
      },
      {
        $addFields: {
          passRate: {
            $multiply: [
              { $divide: ['$passedCount', '$count'] },
              100
            ]
          }
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        passRateStats,
        inspectionsByResult,
        defectAnalysis,
        inspectionsBySource
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get inventory report
// @route   GET /api/reports/inventory
// @access  Private
router.get('/inventory', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    // Low stock items
    const lowStockItems = await InventoryStock.aggregate([
      {
        $match: {
          isActive: true,
          $expr: { $lte: ['$quantity', '$reorderPoint'] }
        }
      },
      {
        $lookup: {
          from: 'items',
          localField: 'itemId',
          foreignField: '_id',
          as: 'item'
        }
      },
      { $unwind: '$item' },
      {
        $project: {
          itemCode: '$item.code',
          itemName: '$item.name',
          quantity: 1,
          reorderPoint: 1,
          location: 1
        }
      },
      { $sort: { quantity: 1 } }
    ]);

    // Stock value by category
    const stockValueByCategory = await InventoryStock.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $lookup: {
          from: 'items',
          localField: 'itemId',
          foreignField: '_id',
          as: 'item'
        }
      },
      { $unwind: '$item' },
      {
        $group: {
          _id: '$item.category',
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: { $multiply: ['$quantity', '$unitCost'] } },
          itemCount: { $sum: 1 }
        }
      },
      { $sort: { totalValue: -1 } }
    ]);

    // Stock movement summary (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    res.status(200).json({
      status: 'success',
      data: {
        lowStockItems,
        stockValueByCategory
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get purchase report
// @route   GET /api/reports/purchase
// @access  Private
router.get('/purchase', [
  query('startDate').isISO8601().withMessage('Invalid start date'),
  query('endDate').isISO8601().withMessage('Invalid end date')
], async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const { startDate, endDate } = req.query;
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Purchase orders by status
    const purchasesByStatus = await PurchaseOrder.aggregate([
      {
        $match: {
          orderDate: { $gte: start, $lte: end },
          isActive: true
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Top suppliers
    const topSuppliers = await PurchaseOrder.aggregate([
      {
        $match: {
          orderDate: { $gte: start, $lte: end },
          status: { $ne: 'CANCELLED' },
          isActive: true
        }
      },
      {
        $group: {
          _id: '$supplierId',
          orderCount: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'companies',
          localField: '_id',
          foreignField: '_id',
          as: 'supplier'
        }
      },
      { $unwind: '$supplier' }
    ]);

    // Purchase trends
    const purchaseTrends = await PurchaseOrder.aggregate([
      {
        $match: {
          orderDate: { $gte: start, $lte: end },
          isActive: true
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$orderDate' },
            month: { $month: '$orderDate' }
          },
          orderCount: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        purchasesByStatus,
        topSuppliers,
        purchaseTrends
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get dashboard summary report
// @route   GET /api/reports/dashboard
// @access  Private
router.get('/dashboard', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Get current month data
    const [salesSummary, productionSummary, qualitySummary] = await Promise.all([
      SalesOrder.getRevenueByPeriod(startOfMonth, endOfMonth),
      WorkOrder.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfMonth, $lte: endOfMonth },
            isActive: true
          }
        },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            completedOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] }
            }
          }
        }
      ]),
      QualityInspection.getPassRateByPeriod(startOfMonth, endOfMonth)
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        salesSummary,
        productionSummary: productionSummary[0] || { totalOrders: 0, completedOrders: 0 },
        qualitySummary
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;