import express from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import { PurchaseRequest } from '../models/PurchaseRequest';
import { body, validationResult, query } from 'express-validator';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Validation middleware
const validatePurchaseRequest = [
  body('department').notEmpty().withMessage('부서는 필수입니다.'),
  body('purpose').notEmpty().withMessage('구매 목적은 필수입니다.'),
  body('priority').isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('유효한 우선순위를 선택해주세요.'),
  body('items').isArray({ min: 1 }).withMessage('최소 1개 이상의 품목이 필요합니다.'),
  body('items.*.itemName').notEmpty().withMessage('품목명은 필수입니다.'),
  body('items.*.quantity').isFloat({ gt: 0 }).withMessage('수량은 0보다 큰 값이어야 합니다.'),
  body('items.*.estimatedPrice').isFloat({ gte: 0 }).withMessage('예상 단가는 0 이상이어야 합니다.'),
  body('items.*.purpose').notEmpty().withMessage('품목별 용도는 필수입니다.'),
];

// @desc    Get all purchase requests
// @route   GET /api/purchase-requests
// @access  Private
router.get('/', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      department, 
      priority,
      requester,
      startDate,
      endDate,
      sortBy = 'requestDate',
      sortOrder = 'desc'
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    let query: any = { isActive: true };

    // Add filters
    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (department) {
      query.department = department;
    }

    if (priority) {
      query.priority = priority;
    }

    if (requester) {
      query.requesterId = requester;
    }

    if (startDate || endDate) {
      query.requestDate = {};
      if (startDate) query.requestDate.$gte = new Date(startDate as string);
      if (endDate) query.requestDate.$lte = new Date(endDate as string);
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    const [requests, total] = await Promise.all([
      PurchaseRequest.find(query)
        .populate('requester', 'name email department')
        .populate('createdBy', 'name email')
        .populate('approvalHistory.approvedBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      PurchaseRequest.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    res.status(200).json({
      status: 'success',
      data: {
        requests,
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

// @desc    Get purchase request by ID
// @route   GET /api/purchase-requests/:id
// @access  Private
router.get('/:id', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const request = await PurchaseRequest.findById(req.params.id)
      .populate('requester', 'name email department position')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('finalApprovedBy', 'name email')
      .populate('approvalHistory.approvedBy', 'name email')
      .populate('purchaseOrderId', 'orderNumber status');

    if (!request) {
      return res.status(404).json({
        status: 'error',
        message: '구매요청을 찾을 수 없습니다.'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        request
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new purchase request
// @route   POST /api/purchase-requests
// @access  Private
router.post('/', validatePurchaseRequest, async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: '입력 데이터에 오류가 있습니다.',
        errors: errors.array()
      });
    }

    // Calculate total prices for items
    const processedItems = req.body.items.map((item: any) => ({
      ...item,
      totalPrice: item.quantity * item.estimatedPrice
    }));

    const requestData = {
      ...req.body,
      items: processedItems,
      requesterId: req.user.id,
      createdBy: req.user.id,
      // Determine approval levels based on total amount
      maxApprovalLevel: req.body.totalAmount > 1000000 ? 2 : 1
    };

    const purchaseRequest = new PurchaseRequest(requestData);
    await purchaseRequest.save();

    // Populate references for response
    await purchaseRequest.populate('requester', 'name email department');
    await purchaseRequest.populate('createdBy', 'name email');

    res.status(201).json({
      status: 'success',
      data: {
        request: purchaseRequest
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update purchase request
// @route   PUT /api/purchase-requests/:id
// @access  Private
router.put('/:id', validatePurchaseRequest, async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: '입력 데이터에 오류가 있습니다.',
        errors: errors.array()
      });
    }

    const request = await PurchaseRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({
        status: 'error',
        message: '구매요청을 찾을 수 없습니다.'
      });
    }

    // Check if user can edit this request
    if (!request.canBeEdited()) {
      return res.status(400).json({
        status: 'error',
        message: '이 요청은 수정할 수 없습니다.'
      });
    }

    // Only allow requester or admin to edit
    if (request.requesterId.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        status: 'error',
        message: '이 요청을 수정할 권한이 없습니다.'
      });
    }

    // Calculate total prices for items
    const processedItems = req.body.items.map((item: any) => ({
      ...item,
      totalPrice: item.quantity * item.estimatedPrice
    }));

    // Update fields
    Object.assign(request, {
      ...req.body,
      items: processedItems,
      updatedBy: req.user.id
    });

    await request.save();

    // Populate references for response
    await request.populate('requester', 'name email department');
    await request.populate('createdBy', 'name email');
    await request.populate('updatedBy', 'name email');

    res.status(200).json({
      status: 'success',
      data: {
        request
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Submit purchase request for approval
// @route   PATCH /api/purchase-requests/:id/submit
// @access  Private
router.patch('/:id/submit', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const request = await PurchaseRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({
        status: 'error',
        message: '구매요청을 찾을 수 없습니다.'
      });
    }

    // Only requester can submit
    if (request.requesterId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: '이 요청을 제출할 권한이 없습니다.'
      });
    }

    if (request.status !== 'DRAFT') {
      return res.status(400).json({
        status: 'error',
        message: '임시저장 상태의 요청만 제출할 수 있습니다.'
      });
    }

    request.status = 'SUBMITTED';
    request.updatedBy = req.user.id;
    await request.save();

    res.status(200).json({
      status: 'success',
      message: '구매요청이 제출되었습니다.',
      data: { request }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Approve purchase request
// @route   PATCH /api/purchase-requests/:id/approve
// @access  Private
router.patch('/:id/approve', [
  body('comments').optional().isLength({ max: 1000 }).withMessage('코멘트는 1000자를 초과할 수 없습니다.')
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

    const request = await PurchaseRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({
        status: 'error',
        message: '구매요청을 찾을 수 없습니다.'
      });
    }

    if (!request.canBeApproved()) {
      return res.status(400).json({
        status: 'error',
        message: '이 요청은 승인할 수 없습니다.'
      });
    }

    // Check approval authority (simplified - in real app, implement proper approval workflow)
    if (req.user.role !== 'MANAGER' && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        status: 'error',
        message: '승인 권한이 없습니다.'
      });
    }

    request.approve(req.user.id, req.body.comments);
    request.updatedBy = req.user.id;
    await request.save();

    // Populate references for response
    await request.populate('approvalHistory.approvedBy', 'name email');

    res.status(200).json({
      status: 'success',
      message: '구매요청이 승인되었습니다.',
      data: { request }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Reject purchase request
// @route   PATCH /api/purchase-requests/:id/reject
// @access  Private
router.patch('/:id/reject', [
  body('comments').notEmpty().withMessage('반려 사유는 필수입니다.'),
  body('comments').isLength({ max: 1000 }).withMessage('반려 사유는 1000자를 초과할 수 없습니다.')
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

    const request = await PurchaseRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({
        status: 'error',
        message: '구매요청을 찾을 수 없습니다.'
      });
    }

    if (!request.canBeApproved()) {
      return res.status(400).json({
        status: 'error',
        message: '이 요청은 처리할 수 없습니다.'
      });
    }

    // Check approval authority
    if (req.user.role !== 'MANAGER' && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        status: 'error',
        message: '반려 권한이 없습니다.'
      });
    }

    request.reject(req.user.id, req.body.comments);
    request.updatedBy = req.user.id;
    await request.save();

    res.status(200).json({
      status: 'success',
      message: '구매요청이 반려되었습니다.',
      data: { request }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete purchase request (soft delete)
// @route   DELETE /api/purchase-requests/:id
// @access  Private
router.delete('/:id', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const request = await PurchaseRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({
        status: 'error',
        message: '구매요청을 찾을 수 없습니다.'
      });
    }

    // Only allow deletion by requester or admin, and only if draft
    if (request.requesterId.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        status: 'error',
        message: '이 요청을 삭제할 권한이 없습니다.'
      });
    }

    if (request.status !== 'DRAFT') {
      return res.status(400).json({
        status: 'error',
        message: '임시저장 상태의 요청만 삭제할 수 있습니다.'
      });
    }

    request.isActive = false;
    request.updatedBy = req.user.id;
    await request.save();

    res.status(200).json({
      status: 'success',
      message: '구매요청이 삭제되었습니다.'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get requests by current user
// @route   GET /api/purchase-requests/my/requests
// @access  Private
router.get('/my/requests', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const requests = await PurchaseRequest.findByRequester(req.user.id)
      .populate('createdBy', 'name email')
      .populate('finalApprovedBy', 'name email');

    res.status(200).json({
      status: 'success',
      data: {
        requests
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get pending approval requests
// @route   GET /api/purchase-requests/pending/approval
// @access  Private
router.get('/pending/approval', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    // Only managers and admins can see pending requests
    if (req.user.role !== 'MANAGER' && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        status: 'error',
        message: '승인 권한이 없습니다.'
      });
    }

    const requests = await PurchaseRequest.findPendingApproval()
      .populate('requester', 'name email department')
      .populate('createdBy', 'name email');

    res.status(200).json({
      status: 'success',
      data: {
        requests
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get purchase request statistics
// @route   GET /api/purchase-requests/stats/overview
// @access  Private
router.get('/stats/overview', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const stats = await PurchaseRequest.getStatistics();

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