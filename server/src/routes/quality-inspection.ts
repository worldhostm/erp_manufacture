import express from 'express';
import { protect, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.get('/', async (req: AuthRequest, res: express.Response) => {
  try {
    // 가짜 품질검사 데이터 반환
    const fakeInspections = [
      {
        _id: 'fake1',
        inspectionNumber: 'QI-2025-001',
        itemName: '철강 원자재 A',
        itemCode: 'ITM-001',
        inspectionDate: '2025-01-15',
        inspector: '김검사',
        result: 'PASS',
        inspectedQuantity: 1000,
        passedQuantity: 1000,
        failedQuantity: 0,
        unit: 'kg',
        source: 'RECEIPT',
        sourceNumber: 'RCP-2025-001',
        standards: [
          { dimension: '두께', tolerance: '±0.1mm', testMethod: '디지털캘리퍼' },
          { dimension: '경도', tolerance: 'HRC 50-55', testMethod: '록웰 경도계' }
        ]
      },
      {
        _id: 'fake2',
        inspectionNumber: 'QI-2025-002',
        itemName: '볼트 M8x20',
        itemCode: 'ITM-002',
        inspectionDate: '2025-01-14',
        inspector: '이품질',
        result: 'FAIL',
        inspectedQuantity: 500,
        passedQuantity: 480,
        failedQuantity: 20,
        unit: '개',
        defectTypes: ['치수불량', '표면결함'],
        source: 'RECEIPT',
        sourceNumber: 'RCP-2025-002',
        standards: [
          { dimension: '직경', tolerance: '8.0±0.05mm', testMethod: '마이크로미터' },
          { dimension: '길이', tolerance: '20±0.5mm', testMethod: '버니어캘리퍼' }
        ]
      },
      {
        _id: 'fake3',
        inspectionNumber: 'QI-2025-003',
        itemName: '제품A',
        itemCode: 'PRD-001',
        inspectionDate: '2025-01-13',
        inspector: '박검증',
        result: 'CONDITIONAL_PASS',
        inspectedQuantity: 100,
        passedQuantity: 95,
        failedQuantity: 5,
        unit: '개',
        defectTypes: ['외관불량'],
        notes: '경미한 외관 결함 5개 발견, 기능상 문제없음',
        source: 'PRODUCTION',
        sourceNumber: 'WO-2025-001',
        standards: [
          { dimension: '외관', tolerance: '결함없음', testMethod: '육안검사' },
          { dimension: '기능', tolerance: '정상동작', testMethod: '기능시험' }
        ]
      },
      {
        _id: 'fake4',
        inspectionNumber: 'QI-2025-004',
        itemName: '제품B',
        itemCode: 'PRD-002',
        inspectionDate: '2025-01-12',
        inspector: '최점검',
        result: 'PENDING',
        inspectedQuantity: 0,
        passedQuantity: 0,
        failedQuantity: 0,
        unit: '개',
        source: 'PRODUCTION',
        sourceNumber: 'WO-2025-002',
        standards: [
          { dimension: '치수', tolerance: '±0.2mm', testMethod: '측정기' },
          { dimension: '강도', tolerance: '≥300N', testMethod: '인장시험기' }
        ]
      }
    ];

    res.status(200).json({
      status: 'success',
      data: {
        inspections: fakeInspections,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalCount: fakeInspections.length,
          hasNext: false,
          hasPrev: false
        }
      }
    });
  } catch (error) {
    console.error('Quality inspections error:', error);
    res.status(500).json({
      status: 'error',
      message: '품질검사 목록을 불러오는데 실패했습니다.'
    });
  }
});

export default router;