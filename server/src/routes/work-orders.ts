import express from 'express';
import { protect, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.get('/', async (req: AuthRequest, res: express.Response) => {
  try {
    // 가짜 작업지시 데이터 반환
    const fakeWorkOrders = [
      {
        _id: 'fake1',
        orderNumber: 'WO-2025-001',
        itemName: '제품A',
        itemCode: 'PRD-001',
        quantity: 100,
        unit: '개',
        workCenter: '조립라인1',
        startDate: '2025-01-15',
        endDate: '2025-01-20',
        actualStartDate: '2025-01-15T09:00:00',
        status: 'IN_PROGRESS',
        completedQuantity: 75,
        assignedTo: '김작업',
        priority: 'HIGH'
      },
      {
        _id: 'fake2',
        orderNumber: 'WO-2025-002',
        itemName: '제품B',
        itemCode: 'PRD-002',
        quantity: 200,
        unit: '개',
        workCenter: '조립라인2',
        startDate: '2025-01-16',
        endDate: '2025-01-25',
        status: 'PENDING',
        completedQuantity: 0,
        assignedTo: '이작업',
        priority: 'NORMAL'
      },
      {
        _id: 'fake3',
        orderNumber: 'WO-2025-003',
        itemName: '제품C',
        itemCode: 'PRD-003',
        quantity: 50,
        unit: '개',
        workCenter: '가공라인1',
        startDate: '2025-01-10',
        endDate: '2025-01-15',
        actualStartDate: '2025-01-10T08:00:00',
        actualEndDate: '2025-01-15T17:00:00',
        status: 'COMPLETED',
        completedQuantity: 50,
        assignedTo: '박작업',
        priority: 'NORMAL'
      },
      {
        _id: 'fake4',
        orderNumber: 'WO-2025-004',
        itemName: '제품D',
        itemCode: 'PRD-004',
        quantity: 150,
        unit: '개',
        workCenter: '가공라인2',
        startDate: '2025-01-18',
        endDate: '2025-01-28',
        status: 'PENDING',
        completedQuantity: 0,
        assignedTo: '정작업',
        priority: 'LOW'
      }
    ];

    res.status(200).json({
      status: 'success',
      data: {
        workOrders: fakeWorkOrders,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalCount: fakeWorkOrders.length,
          hasNext: false,
          hasPrev: false
        }
      }
    });
  } catch (error) {
    console.error('Work orders error:', error);
    res.status(500).json({
      status: 'error',
      message: '작업지시 목록을 불러오는데 실패했습니다.'
    });
  }
});

export default router;