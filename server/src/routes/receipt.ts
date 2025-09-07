import express from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import { Receipt } from '../models/Receipt';
import { InventoryStock } from '../models/InventoryStock';
import { InventoryTransaction } from '../models/InventoryTransaction';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Validation middleware
const validateReceipt = [
  body('supplierId').isMongoId().withMessage('유효한 공급업체 ID가 필요합니다.'),
  body('supplierName').notEmpty().withMessage('공급업체명은 필수입니다.'),
  body('warehouseId').isMongoId().withMessage('유효한 창고 ID가 필요합니다.'),
  body('warehouseName').notEmpty().withMessage('창고명은 필수입니다.'),
  body('items').isArray({ min: 1 }).withMessage('최소 1개 이상의 품목이 필요합니다.'),
  body('items.*.itemId').isMongoId().withMessage('유효한 품목 ID가 필요합니다.'),
  body('items.*.itemName').notEmpty().withMessage('품목명은 필수입니다.'),
  body('items.*.orderedQuantity').isFloat({ gt: 0 }).withMessage('주문 수량은 0보다 큰 값이어야 합니다.'),
  body('items.*.receivedQuantity').isFloat({ gte: 0 }).withMessage('입고 수량은 0 이상이어야 합니다.'),
  body('items.*.unitPrice').isFloat({ gte: 0 }).withMessage('단가는 0 이상이어야 합니다.'),
];

// @desc    Get all receipts
// @route   GET /api/receipts
// @access  Private
router.get('/', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      supplierId, 
      warehouseId,
      startDate,
      endDate,
      sortBy = 'receiptDate',
      sortOrder = 'desc'
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    let query: any = { isActive: true };

    // Add filters
    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (supplierId) {
      query.supplierId = supplierId;
    }

    if (warehouseId) {
      query.warehouseId = warehouseId;
    }

    if (startDate || endDate) {
      query.receiptDate = {};
      if (startDate) query.receiptDate.$gte = new Date(startDate as string);
      if (endDate) query.receiptDate.$lte = new Date(endDate as string);
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    const [receipts, total] = await Promise.all([
      Receipt.find(query)
        .populate('supplierId', 'name code')
        .populate('warehouseId', 'name code')
        .populate('receivedBy', 'name email')
        .populate('inspectedBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Receipt.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    res.status(200).json({
      status: 'success',
      data: {
        receipts,
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

// @desc    Get receipt by ID
// @route   GET /api/receipts/:id
// @access  Private
router.get('/:id', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const receipt = await Receipt.findById(req.params.id)
      .populate('supplierId', 'name code address contact')
      .populate('warehouseId', 'name code address')
      .populate('receivedBy', 'name email')
      .populate('inspectedBy', 'name email')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!receipt) {
      return res.status(404).json({
        status: 'error',
        message: '입고 내역을 찾을 수 없습니다.'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        receipt
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new receipt
// @route   POST /api/receipts
// @access  Private
router.post('/', validateReceipt, async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await session.abortTransaction();
      return res.status(400).json({
        status: 'error',
        message: '입력 데이터에 오류가 있습니다.',
        errors: errors.array()
      });
    }

    // Calculate total prices for items
    const processedItems = req.body.items.map((item: any) => ({
      ...item,
      totalPrice: item.receivedQuantity * item.unitPrice
    }));

    const receiptData = {
      ...req.body,
      items: processedItems,
      receivedBy: req.user.id,
      createdBy: req.user.id
    };

    const receipt = new Receipt(receiptData);
    await receipt.save({ session });

    // Update inventory for each item
    for (const item of processedItems) {
      if (item.receivedQuantity > 0) {
        // Find or create inventory stock record
        let inventoryStock = await InventoryStock.findOne({
          itemId: item.itemId,
          warehouseId: req.body.warehouseId
        }).session(session);

        if (!inventoryStock) {
          inventoryStock = new InventoryStock({
            itemId: item.itemId,
            itemName: item.itemName,
            itemCode: item.itemCode,
            warehouseId: req.body.warehouseId,
            warehouseName: req.body.warehouseName,
            currentQuantity: 0,
            averageUnitCost: 0,
            lastUpdatedBy: req.user.id
          });
        }

        // Get previous quantity for transaction record
        const previousQuantity = inventoryStock.currentQuantity;

        // Add stock using the model method
        inventoryStock.addStock(
          item.receivedQuantity, 
          item.unitPrice,
          item.batchNumber,
          item.expirationDate
        );
        inventoryStock.lastUpdatedBy = new mongoose.Types.ObjectId(req.user.id);

        await inventoryStock.save({ session });

        // Create inventory transaction record
        const transaction = new InventoryTransaction({
          itemId: item.itemId,
          itemName: item.itemName,
          itemCode: item.itemCode,
          warehouseId: req.body.warehouseId,
          warehouseName: req.body.warehouseName,
          transactionType: 'IN',
          quantity: item.receivedQuantity,
          unitPrice: item.unitPrice,
          previousQuantity,
          currentQuantity: inventoryStock.currentQuantity,
          referenceId: receipt._id,
          referenceType: 'RECEIPT',
          referenceNumber: receipt.receiptNumber,
          transactionDate: receipt.receiptDate,
          reason: `입고 - ${receipt.receiptNumber}`,
          notes: item.notes,
          batchNumber: item.batchNumber,
          expirationDate: item.expirationDate,
          userId: req.user.id,
          userName: req.user.name
        });

        await transaction.save({ session });
      }
    }

    await session.commitTransaction();

    // Populate references for response
    await receipt.populate('supplierId', 'name code');
    await receipt.populate('warehouseId', 'name code');
    await receipt.populate('receivedBy', 'name email');

    res.status(201).json({
      status: 'success',
      data: {
        receipt
      }
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

// @desc    Update receipt
// @route   PUT /api/receipts/:id
// @access  Private
router.put('/:id', validateReceipt, async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: '입력 데이터에 오류가 있습니다.',
        errors: errors.array()
      });
    }

    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) {
      return res.status(404).json({
        status: 'error',
        message: '입고 내역을 찾을 수 없습니다.'
      });
    }

    // Only allow updates for RECEIVED status
    if (receipt.status !== 'RECEIVED') {
      return res.status(400).json({
        status: 'error',
        message: '입고 완료 상태의 내역만 수정할 수 있습니다.'
      });
    }

    // Calculate total prices for items
    const processedItems = req.body.items.map((item: any) => ({
      ...item,
      totalPrice: item.receivedQuantity * item.unitPrice
    }));

    // Update fields
    Object.assign(receipt, {
      ...req.body,
      items: processedItems,
      updatedBy: req.user.id
    });

    await receipt.save();

    // Populate references for response
    await receipt.populate('supplierId', 'name code');
    await receipt.populate('warehouseId', 'name code');
    await receipt.populate('receivedBy', 'name email');
    await receipt.populate('updatedBy', 'name email');

    res.status(200).json({
      status: 'success',
      data: {
        receipt
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Inspect receipt
// @route   PATCH /api/receipts/:id/inspect
// @access  Private
router.patch('/:id/inspect', [
  body('inspectionNotes').optional().isLength({ max: 1000 }).withMessage('검사 의견은 1000자를 초과할 수 없습니다.')
], async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: '입력 데이터에 오류가 있습니다.',
        errors: errors.array()
      });
    }

    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) {
      return res.status(404).json({
        status: 'error',
        message: '입고 내역을 찾을 수 없습니다.'
      });
    }

    if (!receipt.canBeInspected()) {
      return res.status(400).json({
        status: 'error',
        message: '이 입고 내역은 검사할 수 없습니다.'
      });
    }

    receipt.inspect(req.user.id, req.body.inspectionNotes);
    receipt.updatedBy = req.user.id;
    await receipt.save();

    res.status(200).json({
      status: 'success',
      message: '검사가 완료되었습니다.',
      data: { receipt }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Approve receipt
// @route   PATCH /api/receipts/:id/approve
// @access  Private
router.patch('/:id/approve', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) {
      return res.status(404).json({
        status: 'error',
        message: '입고 내역을 찾을 수 없습니다.'
      });
    }

    if (!receipt.canBeApproved()) {
      return res.status(400).json({
        status: 'error',
        message: '이 입고 내역은 승인할 수 없습니다.'
      });
    }

    receipt.approve();
    receipt.updatedBy = req.user.id;
    await receipt.save();

    res.status(200).json({
      status: 'success',
      message: '입고가 승인되었습니다.',
      data: { receipt }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete receipt (soft delete)
// @route   DELETE /api/receipts/:id
// @access  Private
router.delete('/:id', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) {
      return res.status(404).json({
        status: 'error',
        message: '입고 내역을 찾을 수 없습니다.'
      });
    }

    // Only allow deletion for RECEIVED status
    if (receipt.status !== 'RECEIVED') {
      return res.status(400).json({
        status: 'error',
        message: '입고 완료 상태의 내역만 삭제할 수 있습니다.'
      });
    }

    receipt.isActive = false;
    receipt.updatedBy = req.user.id;
    await receipt.save();

    res.status(200).json({
      status: 'success',
      message: '입고 내역이 삭제되었습니다.'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get pending inspection receipts
// @route   GET /api/receipts/pending/inspection
// @access  Private
router.get('/pending/inspection', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const receipts = await Receipt.findPendingInspection()
      .populate('supplierId', 'name code')
      .populate('warehouseId', 'name code')
      .populate('receivedBy', 'name email');

    res.status(200).json({
      status: 'success',
      data: {
        receipts
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get receipt statistics
// @route   GET /api/receipts/stats/overview
// @access  Private
router.get('/stats/overview', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const stats = await Receipt.getStatistics();

    res.status(200).json({
      status: 'success',
      data: {
        stats
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;