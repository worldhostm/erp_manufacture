import express from 'express';
import { PurchaseOrder } from '../models/Purchase';
import { InventoryStock } from '../models/InventoryStock';
import { protect, AuthRequest } from '../middleware/auth';

const router = express.Router();
router.use(protect);

router.get('/stats', async (_req: AuthRequest, res: express.Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // 오늘 주문 수
    const todayOrdersCount = await PurchaseOrder.countDocuments({
      orderDate: { $gte: today, $lt: tomorrow },
      isActive: true
    });

    // 어제 주문 수 (가짜 데이터)
    const yesterdayOrdersCount = Math.floor(Math.random() * 8) + 8; // 8-15
    const orderChangePercent = yesterdayOrdersCount > 0 ? 
      (((todayOrdersCount - yesterdayOrdersCount) / yesterdayOrdersCount) * 100).toFixed(2) : '0.00';

    // 생산 중인 작업 (가짜 데이터)
    const workInProgress = Math.floor(Math.random() * 5) + 6; // 6-10
    const workChangePercent = '+1.2';

    // 재고 알림 (안전재고 이하인 아이템 수)
    let lowStockCount = 0;
    try {
      lowStockCount = await InventoryStock.countDocuments({
        $expr: { $lte: ['$currentQuantity', '$safetyStock'] },
        isActive: true
      });
    } catch (error) {
      // 재고 테이블이 없으면 가짜 데이터
      lowStockCount = Math.floor(Math.random() * 3) + 2; // 2-4
    }
    const stockChangePercent = '-2.02';

    // 월 매출 (가짜 데이터)
    const monthlySales = '₩45.2M';
    const salesChangePercent = '+12.5';

    const stats = [
      {
        name: '오늘 주문',
        value: todayOrdersCount.toString(),
        change: `${orderChangePercent.startsWith('-') ? '' : '+'}${orderChangePercent}%`,
        changeType: orderChangePercent.startsWith('-') ? 'negative' : 'positive'
      },
      {
        name: '생산 중인 작업',
        value: workInProgress.toString(),
        change: workChangePercent,
        changeType: 'positive'
      },
      {
        name: '재고 알림',
        value: lowStockCount.toString(),
        change: stockChangePercent,
        changeType: 'negative'
      },
      {
        name: '월 매출',
        value: monthlySales,
        change: salesChangePercent,
        changeType: 'positive'
      }
    ];

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: '대시보드 통계를 불러오는데 실패했습니다.' });
  }
});

router.get('/recent-orders', async (_req: AuthRequest, res: express.Response) => {
  try {
    const recentOrders = await PurchaseOrder.find({ isActive: true })
      .populate('supplierId', 'name businessNumber')
      .populate({
        path: 'items.itemId',
        select: 'name code'
      })
      .sort({ orderDate: -1 })
      .limit(3)
      .lean();

    const formattedOrders = recentOrders.map(order => ({
      id: order.orderNumber,
      supplier: (order.supplierId as any)?.name || '미확인 공급업체',
      item: (order.items[0]?.item as any)?.name || (order.items[0]?.itemId as any)?.name || '품목 정보 없음',
      quantity: `${order.items[0]?.quantity || 0}${(order.items[0]?.item as any)?.unit || '개'}`,
      status: order.status === 'DRAFT' ? '승인대기' :
              order.status === 'SENT' ? '주문완료' :
              order.status === 'CONFIRMED' ? '확인완료' :
              order.status === 'RECEIVED' ? '입고완료' :
              order.status === 'CANCELLED' ? '취소' : '진행중',
      date: order.orderDate.toISOString().split('T')[0]
    }));

    res.json({ success: true, data: formattedOrders });
  } catch (error) {
    console.error('Recent orders error:', error);
    // 에러 시 가짜 데이터 반환
    // const fakeOrders = [
    //   {
    //     id: 'PO-2025-001',
    //     supplier: '㈜ABC소재',
    //     item: '철강 원자재',
    //     quantity: '500kg',
    //     status: '승인대기',
    //     date: '2025-01-15'
    //   },
    //   {
    //     id: 'PO-2025-002',
    //     supplier: '대한부품',
    //     item: '볼트/너트',
    //     quantity: '1000개',
    //     status: '주문완료',
    //     date: '2025-01-14'
    //   },
    //   {
    //     id: 'PO-2025-003',
    //     supplier: '신영화학',
    //     item: '도료',
    //     quantity: '200L',
    //     status: '입고완료',
    //     date: '2025-01-13'
    //   }
    // ];
    res.json({ success: false, data: []});
  }
});

router.get('/work-orders', async (_req: AuthRequest, res: express.Response) => {
  try {
    // 가짜 작업지시 데이터 (작업지시 모델이 없으므로)
    const workOrders = [
      {
        id: 'WO-2025-001',
        item: '제품A',
        quantity: '100개',
        progress: Math.floor(Math.random() * 100),
        dueDate: '2025-01-20',
        status: '진행중'
      },
      {
        id: 'WO-2025-002',
        item: '제품B',
        quantity: '200개',
        progress: Math.floor(Math.random() * 100),
        dueDate: '2025-01-25',
        status: '시작'
      },
      {
        id: 'WO-2025-003',
        item: '제품C',
        quantity: '50개',
        progress: 100,
        dueDate: '2025-01-15',
        status: '완료'
      }
    ];

    res.json({ success: true, data: workOrders });
  } catch (error) {
    console.error('Work orders error:', error);
    res.status(500).json({ success: false, message: '작업지시 현황을 불러오는데 실패했습니다.' });
  }
});

export default router;