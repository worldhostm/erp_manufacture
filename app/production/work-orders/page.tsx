'use client';

import { useState } from 'react';
import { Plus, Search, Play, Pause, CheckCircle, Eye, Calendar, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { downloadExcel, ExcelColumn } from '@/lib/excel';

interface WorkOrder {
  id: number;
  orderNumber: string;
  itemName: string;
  itemCode: string;
  quantity: number;
  unit: string;
  workCenter: string;
  startDate: string;
  endDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED';
  completedQuantity: number;
  assignedTo: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([
    {
      id: 1,
      orderNumber: 'WO-2024-001',
      itemName: '제품A',
      itemCode: 'PRD-001',
      quantity: 100,
      unit: '개',
      workCenter: '조립라인1',
      startDate: '2024-01-15',
      endDate: '2024-01-20',
      actualStartDate: '2024-01-15T09:00:00',
      status: 'IN_PROGRESS',
      completedQuantity: 75,
      assignedTo: '김작업',
      priority: 'HIGH'
    },
    {
      id: 2,
      orderNumber: 'WO-2024-002',
      itemName: '제품B',
      itemCode: 'PRD-002',
      quantity: 200,
      unit: '개',
      workCenter: '조립라인2',
      startDate: '2024-01-16',
      endDate: '2024-01-25',
      status: 'PENDING',
      completedQuantity: 0,
      assignedTo: '이작업',
      priority: 'NORMAL'
    },
    {
      id: 3,
      orderNumber: 'WO-2024-003',
      itemName: '제품C',
      itemCode: 'PRD-003',
      quantity: 50,
      unit: '개',
      workCenter: '가공라인1',
      startDate: '2024-01-10',
      endDate: '2024-01-15',
      actualStartDate: '2024-01-10T08:00:00',
      actualEndDate: '2024-01-15T17:00:00',
      status: 'COMPLETED',
      completedQuantity: 50,
      assignedTo: '박작업',
      priority: 'NORMAL'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);

  const filteredOrders = workOrders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.workCenter.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '대기중';
      case 'IN_PROGRESS':
        return '진행중';
      case 'COMPLETED':
        return '완료';
      case 'PAUSED':
        return '중단';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'bg-gray-100 text-gray-800';
      case 'NORMAL':
        return 'bg-blue-100 text-blue-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return '낮음';
      case 'NORMAL':
        return '보통';
      case 'HIGH':
        return '높음';
      case 'URGENT':
        return '긴급';
      default:
        return priority;
    }
  };

  const handleView = (order: WorkOrder) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handleStart = (id: number) => {
    setWorkOrders(prev => prev.map(order => 
      order.id === id 
        ? { 
            ...order, 
            status: 'IN_PROGRESS' as const, 
            actualStartDate: new Date().toISOString() 
          }
        : order
    ));
  };

  const handlePause = (id: number) => {
    setWorkOrders(prev => prev.map(order => 
      order.id === id ? { ...order, status: 'PAUSED' as const } : order
    ));
  };

  const handleComplete = (id: number) => {
    setWorkOrders(prev => prev.map(order => 
      order.id === id 
        ? { 
            ...order, 
            status: 'COMPLETED' as const, 
            actualEndDate: new Date().toISOString(),
            completedQuantity: order.quantity
          }
        : order
    ));
  };

  const getProgressPercentage = (order: WorkOrder) => {
    return Math.round((order.completedQuantity / order.quantity) * 100);
  };

  const handleExcelDownload = () => {
    const columns: ExcelColumn[] = [
      { key: 'orderNumber', label: '작업지시번호', width: 15 },
      { key: 'itemName', label: '품목명', width: 20 },
      { key: 'itemCode', label: '품목코드', width: 12 },
      { key: 'quantity', label: '생산수량', width: 12 },
      { key: 'unit', label: '단위', width: 8 },
      { key: 'workCenter', label: '작업센터', width: 15 },
      { key: 'startDate', label: '시작일', width: 12 },
      { key: 'endDate', label: '완료일', width: 12 },
      { key: 'status', label: '상태', width: 10 },
      { key: 'completedQuantity', label: '완료수량', width: 12 },
      { key: 'assignedTo', label: '담당자', width: 12 },
      { key: 'priority', label: '우선순위', width: 10 }
    ];

    const excelData = filteredOrders.map(order => ({
      ...order,
      status: getStatusText(order.status),
      priority: getPriorityText(order.priority),
      quantity: `${order.quantity.toLocaleString()} ${order.unit}`,
      completedQuantity: `${order.completedQuantity.toLocaleString()} ${order.unit}`
    }));

    const success = downloadExcel(excelData, columns, '작업지시목록');
    if (!success) {
      alert('엑셀 다운로드 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">작업지시 관리</h1>
          <p className="text-gray-600">생산 작업지시를 생성하고 진행상황을 관리합니다.</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleExcelDownload}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            엑셀 다운로드
          </button>
          <button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
            <Plus className="h-4 w-4 mr-2" />
            신규 작업지시
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="작업지시번호, 품목명 또는 작업센터로 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="ALL">전체 상태</option>
              <option value="PENDING">대기중</option>
              <option value="IN_PROGRESS">진행중</option>
              <option value="COMPLETED">완료</option>
              <option value="PAUSED">중단</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업지시번호
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  품목정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업센터
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업기간
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  진행률
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  우선순위
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  담당자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {order.orderNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.itemName}</div>
                      <div className="text-sm text-gray-500">{order.itemCode} - {order.quantity.toLocaleString()} {order.unit}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.workCenter}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {format(new Date(order.startDate), 'MM/dd', { locale: ko })} ~ {format(new Date(order.endDate), 'MM/dd', { locale: ko })}
                    </div>
                    {order.actualStartDate && (
                      <div className="text-xs text-gray-500">
                        실제: {format(new Date(order.actualStartDate), 'MM/dd HH:mm', { locale: ko })}
                        {order.actualEndDate && ` ~ ${format(new Date(order.actualEndDate), 'MM/dd HH:mm', { locale: ko })}`}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full" 
                          style={{ width: `${getProgressPercentage(order)}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-900">
                        {getProgressPercentage(order)}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {order.completedQuantity.toLocaleString()} / {order.quantity.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(order.priority)}`}>
                      {getPriorityText(order.priority)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.assignedTo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleView(order)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {order.status === 'PENDING' && (
                        <button
                          onClick={() => handleStart(order.id)}
                          className="text-green-600 hover:text-green-900"
                          title="작업 시작"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                      )}
                      {order.status === 'IN_PROGRESS' && (
                        <>
                          <button
                            onClick={() => handlePause(order.id)}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="작업 일시정지"
                          >
                            <Pause className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleComplete(order.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="작업 완료"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                작업지시서 상세 - {selectedOrder.orderNumber}
              </h3>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">작업 정보</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">작업지시번호:</span>
                      <span className="text-sm text-gray-900 font-medium">{selectedOrder.orderNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">품목명:</span>
                      <span className="text-sm text-gray-900">{selectedOrder.itemName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">품목코드:</span>
                      <span className="text-sm text-gray-900">{selectedOrder.itemCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">생산수량:</span>
                      <span className="text-sm text-gray-900">{selectedOrder.quantity.toLocaleString()} {selectedOrder.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">작업센터:</span>
                      <span className="text-sm text-gray-900">{selectedOrder.workCenter}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">담당자:</span>
                      <span className="text-sm text-gray-900">{selectedOrder.assignedTo}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">진행 현황</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">상태:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusText(selectedOrder.status)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">우선순위:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedOrder.priority)}`}>
                        {getPriorityText(selectedOrder.priority)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">완료수량:</span>
                      <span className="text-sm text-gray-900 font-medium">{selectedOrder.completedQuantity.toLocaleString()} {selectedOrder.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">진행률:</span>
                      <span className="text-sm text-gray-900 font-medium">{getProgressPercentage(selectedOrder)}%</span>
                    </div>
                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-gray-500 mb-1">
                        <span>진행 현황</span>
                        <span>{getProgressPercentage(selectedOrder)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-primary-600 h-3 rounded-full transition-all duration-300" 
                          style={{ width: `${getProgressPercentage(selectedOrder)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">일정 정보</h4>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h5 className="text-xs font-medium text-gray-700 mb-2">계획 일정</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">시작일:</span>
                        <span className="text-sm text-gray-900">{format(new Date(selectedOrder.startDate), 'yyyy-MM-dd', { locale: ko })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">완료일:</span>
                        <span className="text-sm text-gray-900">{format(new Date(selectedOrder.endDate), 'yyyy-MM-dd', { locale: ko })}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h5 className="text-xs font-medium text-gray-700 mb-2">실제 일정</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">시작일시:</span>
                        <span className="text-sm text-gray-900">
                          {selectedOrder.actualStartDate 
                            ? format(new Date(selectedOrder.actualStartDate), 'yyyy-MM-dd HH:mm', { locale: ko })
                            : '미시작'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">완료일시:</span>
                        <span className="text-sm text-gray-900">
                          {selectedOrder.actualEndDate 
                            ? format(new Date(selectedOrder.actualEndDate), 'yyyy-MM-dd HH:mm', { locale: ko })
                            : '진행중'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

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
                <button className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
                  수정
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}