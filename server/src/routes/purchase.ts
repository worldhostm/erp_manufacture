import express from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import { PurchaseOrder } from '../models/Purchase';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// @desc    Get all purchase orders
// @route   GET /api/purchase/orders
// @access  Private
router.get('/orders', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const orders = await PurchaseOrder.find({ isActive: true })
      .populate('supplier', 'name businessNumber')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: {
        orders
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new purchase order
// @route   POST /api/purchase/orders
// @access  Private
router.post('/orders', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const { supplierId, orderDate, expectedDeliveryDate, items, notes, deliveryAddress, terms } = req.body;

    if (!supplierId || !items || items.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: '공급업체와 주문 품목은 필수입니다.'
      });
    }

    // Generate order number
    const currentYear = new Date().getFullYear();
    const orderCount = await PurchaseOrder.countDocuments({
      orderNumber: new RegExp(`^PO-${currentYear}`)
    });
    const orderNumber = `PO-${currentYear}-${String(orderCount + 1).padStart(3, '0')}`;

    // Calculate totals
    let subtotal = 0;
    const processedItems = items.map((item: any) => {
      const totalPrice = item.quantity * item.unitPrice;
      subtotal += totalPrice;
      return {
        itemId: item.itemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice
      };
    });

    const taxAmount = subtotal * 0.1; // 10% VAT
    const totalAmount = subtotal + taxAmount;

    const newOrder = new PurchaseOrder({
      orderNumber,
      supplierId,
      orderDate: orderDate || new Date(),
      expectedDeliveryDate,
      items: processedItems,
      subtotal,
      taxAmount,
      totalAmount,
      notes,
      deliveryAddress,
      terms,
      createdBy: req.user.id
    });

    const savedOrder = await newOrder.save();
    await savedOrder.populate('supplier', 'name businessNumber');
    await savedOrder.populate('createdBy', 'name email');

    res.status(201).json({
      status: 'success',
      data: {
        order: savedOrder
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single purchase order
// @route   GET /api/purchase/orders/:id
// @access  Private
router.get('/orders/:id', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id)
      .populate('supplier', 'name businessNumber address phone email')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email');

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: '구매주문을 찾을 수 없습니다.'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        order
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update purchase order
// @route   PUT /api/purchase/orders/:id
// @access  Private
router.put('/orders/:id', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const { supplierId, orderDate, expectedDeliveryDate, items, notes, deliveryAddress, terms, status } = req.body;

    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: '구매주문을 찾을 수 없습니다.'
      });
    }

    // Only allow updates if status is DRAFT
    if (order.status !== 'DRAFT' && status !== order.status) {
      return res.status(400).json({
        status: 'error',
        message: '승인된 주문은 수정할 수 없습니다.'
      });
    }

    if (items && items.length > 0) {
      let subtotal = 0;
      const processedItems = items.map((item: any) => {
        const totalPrice = item.quantity * item.unitPrice;
        subtotal += totalPrice;
        return {
          itemId: item.itemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice
        };
      });

      const taxAmount = subtotal * 0.1;
      const totalAmount = subtotal + taxAmount;

      order.items = processedItems;
      order.subtotal = subtotal;
      order.taxAmount = taxAmount;
      order.totalAmount = totalAmount;
    }

    if (supplierId) order.supplierId = supplierId;
    if (orderDate) order.orderDate = orderDate;
    if (expectedDeliveryDate) order.expectedDeliveryDate = expectedDeliveryDate;
    if (notes !== undefined) order.notes = notes;
    if (deliveryAddress !== undefined) order.deliveryAddress = deliveryAddress;
    if (terms !== undefined) order.terms = terms;
    if (status) order.status = status;

    const updatedOrder = await order.save();
    await updatedOrder.populate('supplier', 'name businessNumber');
    await updatedOrder.populate('createdBy', 'name email');

    res.status(200).json({
      status: 'success',
      data: {
        order: updatedOrder
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete purchase order
// @route   DELETE /api/purchase/orders/:id
// @access  Private
router.delete('/orders/:id', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: '구매주문을 찾을 수 없습니다.'
      });
    }

    // Only allow deletion if status is DRAFT
    if (order.status !== 'DRAFT') {
      return res.status(400).json({
        status: 'error',
        message: '승인된 주문은 삭제할 수 없습니다.'
      });
    }

    order.isActive = false;
    await order.save();

    res.status(200).json({
      status: 'success',
      message: '구매주문이 삭제되었습니다.'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get all receipts
// @route   GET /api/purchase/receipts
// @access  Private
router.get('/receipts', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    // TODO: Implement receipts logic
    res.status(200).json({
      status: 'success',
      data: {
        receipts: []
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;