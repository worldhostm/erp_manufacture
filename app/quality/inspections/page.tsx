'use client';

import { useState } from 'react';
import { Plus, Search, CheckCircle, XCircle, Clock, Eye, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface QualityInspection {
  id: number;
  inspectionNumber: string;
  itemName: string;
  itemCode: string;
  inspectionDate: string;
  inspector: string;
  result: 'PENDING' | 'PASS' | 'FAIL' | 'CONDITIONAL_PASS';
  inspectedQuantity: number;
  passedQuantity: number;
  failedQuantity: number;
  unit: string;
  defectTypes?: string[];
  notes?: string;
  source: 'RECEIPT' | 'PRODUCTION' | 'SHIPMENT';
  sourceNumber: string;
  standards: {
    dimension: string;
    tolerance: string;
    testMethod: string;
  }[];
}

export default function QualityInspectionsPage() {
  const [inspections, setInspections] = useState<QualityInspection[]>([
    {
      id: 1,
      inspectionNumber: 'QI-2024-001',
      itemName: '철강 원자재 A',
      itemCode: 'ITM-001',
      inspectionDate: '2024-01-20',
      inspector: '김검사',
      result: 'PASS',
      inspectedQuantity: 1000,
      passedQuantity: 1000,
      failedQuantity: 0,
      unit: 'kg',
      source: 'RECEIPT',
      sourceNumber: 'RCP-2024-001',
      standards: [
        { dimension: '두께', tolerance: '±0.1mm', testMethod: '디지털캘리퍼' },
        { dimension: '경도', tolerance: 'HRC 50-55', testMethod: '록웰 경도계' }
      ]
    },
    {
      id: 2,
      inspectionNumber: 'QI-2024-002',
      itemName: '볼트 M8x20',
      itemCode: 'ITM-002',
      inspectionDate: '2024-01-19',
      inspector: '이품질',
      result: 'FAIL',
      inspectedQuantity: 500,
      passedQuantity: 480,
      failedQuantity: 20,
      unit: '개',
      defectTypes: ['치수불량', '표면결함'],
      source: 'RECEIPT',
      sourceNumber: 'RCP-2024-002',
      standards: [
        { dimension: '직경', tolerance: '8.0±0.05mm', testMethod: '마이크로미터' },
        { dimension: '길이', tolerance: '20±0.5mm', testMethod: '버니어캘리퍼' }
      ]
    },
    {
      id: 3,
      inspectionNumber: 'QI-2024-003',
      itemName: '제품A',
      itemCode: 'PRD-001',
      inspectionDate: '2024-01-18',
      inspector: '박검증',
      result: 'CONDITIONAL_PASS',
      inspectedQuantity: 100,
      passedQuantity: 95,
      failedQuantity: 5,
      unit: '개',
      defectTypes: ['외관불량'],
      notes: '경미한 외관 결함 5개 발견, 기능상 문제없음',
      source: 'PRODUCTION',
      sourceNumber: 'WO-2024-001',
      standards: [
        { dimension: '외관', tolerance: '결함없음', testMethod: '육안검사' },
        { dimension: '기능', tolerance: '정상동작', testMethod: '기능시험' }
      ]
    },
    {
      id: 4,
      inspectionNumber: 'QI-2024-004',
      itemName: '제품B',
      itemCode: 'PRD-002',
      inspectionDate: '2024-01-17',
      inspector: '최점검',
      result: 'PENDING',
      inspectedQuantity: 50,
      passedQuantity: 0,
      failedQuantity: 0,
      unit: '개',
      source: 'PRODUCTION',
      sourceNumber: 'WO-2024-002',
      standards: [
        { dimension: '성능', tolerance: '±5%', testMethod: '성능시험기' },
        { dimension: '내구성', tolerance: '1000회 이상', testMethod: '내구성 시험' }
      ]
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [resultFilter, setResultFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<QualityInspection | null>(null);

  const filteredInspections = inspections.filter(inspection => {
    const matchesSearch = inspection.inspectionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inspection.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inspection.inspector.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesResult = resultFilter === 'ALL' || inspection.result === resultFilter;
    const matchesSource = sourceFilter === 'ALL' || inspection.source === sourceFilter;
    return matchesSearch && matchesResult && matchesSource;
  });

  const getResultColor = (result: string) => {
    switch (result) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PASS':
        return 'bg-green-100 text-green-800';
      case 'FAIL':
        return 'bg-red-100 text-red-800';
      case 'CONDITIONAL_PASS':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getResultText = (result: string) => {
    switch (result) {
      case 'PENDING':
        return '검사중';
      case 'PASS':
        return '합격';
      case 'FAIL':
        return '불합격';
      case 'CONDITIONAL_PASS':
        return '조건부 합격';
      default:
        return result;
    }
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      case 'PASS':
        return <CheckCircle className="h-4 w-4" />;
      case 'FAIL':
        return <XCircle className="h-4 w-4" />;
      case 'CONDITIONAL_PASS':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getSourceText = (source: string) => {
    switch (source) {
      case 'RECEIPT':
        return '입고검사';
      case 'PRODUCTION':
        return '생산검사';
      case 'SHIPMENT':
        return '출하검사';
      default:
        return source;
    }
  };

  const handleView = (inspection: QualityInspection) => {
    setSelectedInspection(inspection);
    setShowModal(true);
  };

  const getPassRate = (inspection: QualityInspection) => {
    if (inspection.inspectedQuantity === 0) return 0;
    return Math.round((inspection.passedQuantity / inspection.inspectedQuantity) * 100);
  };

  const totalInspections = inspections.length;
  const passedInspections = inspections.filter(i => i.result === 'PASS').length;
  const failedInspections = inspections.filter(i => i.result === 'FAIL').length;
  const pendingInspections = inspections.filter(i => i.result === 'PENDING').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">품질검사 관리</h1>
          <p className="text-gray-600">품질검사 결과를 관리하고 품질 기준을 확인합니다.</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
          <Plus className="h-4 w-4 mr-2" />
          신규 검사
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-600">총 검사 건수</p>
              <p className="text-2xl font-semibold text-gray-900">{totalInspections}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-primary-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-600">합격</p>
              <p className="text-2xl font-semibold text-green-600">{passedInspections}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-600">불합격</p>
              <p className="text-2xl font-semibold text-red-600">{failedInspections}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-600">검사중</p>
              <p className="text-2xl font-semibold text-yellow-600">{pendingInspections}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="검사번호, 품목명 또는 검사자로 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="flex space-x-2">
              <select 
                value={resultFilter}
                onChange={(e) => setResultFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="ALL">전체 결과</option>
                <option value="PENDING">검사중</option>
                <option value="PASS">합격</option>
                <option value="FAIL">불합격</option>
                <option value="CONDITIONAL_PASS">조건부 합격</option>
              </select>
              <select 
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="ALL">전체 구분</option>
                <option value="RECEIPT">입고검사</option>
                <option value="PRODUCTION">생산검사</option>
                <option value="SHIPMENT">출하검사</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  검사번호
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  품목정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  검사구분
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  검사일자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  검사자
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  검사수량
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  합격률
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  결과
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInspections.map((inspection) => (
                <tr key={inspection.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {inspection.inspectionNumber}
                    </div>
                    <div className="text-sm text-gray-500">
                      {inspection.sourceNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{inspection.itemName}</div>
                      <div className="text-sm text-gray-500">{inspection.itemCode}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {getSourceText(inspection.source)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(inspection.inspectionDate), 'yyyy-MM-dd', { locale: ko })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {inspection.inspector}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900">
                      {inspection.inspectedQuantity.toLocaleString()} {inspection.unit}
                    </div>
                    {inspection.result !== 'PENDING' && (
                      <div className="text-xs text-gray-500">
                        합격: {inspection.passedQuantity.toLocaleString()} / 
                        불량: {inspection.failedQuantity.toLocaleString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {inspection.result === 'PENDING' ? (
                      <span className="text-sm text-gray-500">-</span>
                    ) : (
                      <div className="flex items-center justify-center">
                        <div className="w-12 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className={`h-2 rounded-full ${
                              getPassRate(inspection) >= 95 ? 'bg-green-500' :
                              getPassRate(inspection) >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${getPassRate(inspection)}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-900">{getPassRate(inspection)}%</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center">
                      {getResultIcon(inspection.result)}
                      <span className={`ml-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getResultColor(inspection.result)}`}>
                        {getResultText(inspection.result)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleView(inspection)}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && selectedInspection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-screen overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                품질검사 상세 - {selectedInspection.inspectionNumber}
              </h3>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">검사 정보</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">검사번호:</span>
                      <span className="text-sm text-gray-900 font-medium">{selectedInspection.inspectionNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">검사일자:</span>
                      <span className="text-sm text-gray-900">
                        {format(new Date(selectedInspection.inspectionDate), 'yyyy-MM-dd', { locale: ko })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">검사자:</span>
                      <span className="text-sm text-gray-900">{selectedInspection.inspector}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">검사구분:</span>
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {getSourceText(selectedInspection.source)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">원본번호:</span>
                      <span className="text-sm text-gray-900">{selectedInspection.sourceNumber}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">품목 정보</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">품목명:</span>
                      <span className="text-sm text-gray-900">{selectedInspection.itemName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">품목코드:</span>
                      <span className="text-sm text-gray-900">{selectedInspection.itemCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">검사수량:</span>
                      <span className="text-sm text-gray-900 font-medium">
                        {selectedInspection.inspectedQuantity.toLocaleString()} {selectedInspection.unit}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">검사 결과</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">결과:</span>
                      <div className="flex items-center">
                        {getResultIcon(selectedInspection.result)}
                        <span className={`ml-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getResultColor(selectedInspection.result)}`}>
                          {getResultText(selectedInspection.result)}
                        </span>
                      </div>
                    </div>
                    {selectedInspection.result !== 'PENDING' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">합격수량:</span>
                          <span className="text-sm text-green-600 font-medium">
                            {selectedInspection.passedQuantity.toLocaleString()} {selectedInspection.unit}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">불량수량:</span>
                          <span className="text-sm text-red-600 font-medium">
                            {selectedInspection.failedQuantity.toLocaleString()} {selectedInspection.unit}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">합격률:</span>
                          <span className="text-sm text-gray-900 font-bold">
                            {getPassRate(selectedInspection)}%
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">품질 기준</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-md">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">항목</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">기준</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">시험방법</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedInspection.standards.map((standard, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-900">{standard.dimension}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{standard.tolerance}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{standard.testMethod}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedInspection.defectTypes && selectedInspection.defectTypes.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">불량 유형</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedInspection.defectTypes.map((defect, index) => (
                      <span key={index} className="inline-flex px-3 py-1 text-sm bg-red-100 text-red-800 rounded-full">
                        {defect}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedInspection.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">특이사항</h4>
                  <div className="bg-gray-50 rounded-md p-3">
                    <p className="text-sm text-gray-700">{selectedInspection.notes}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-4 pt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  닫기
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  인쇄
                </button>
                {selectedInspection.result === 'PENDING' && (
                  <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                    검사 완료
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}