'use client';

import { useState } from 'react';
import { Plus, Search, Edit, Eye, FileText, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { downloadExcel, ExcelColumn } from '@/lib/excel';

interface PurchaseOrder {
  id: number;
  orderNumber: string;
  supplier: string;
  orderDate: string;
  expectedDate: string;
  status: 'PENDING' | 'APPROVED' | 'RECEIVED' | 'COMPLETED';
  totalAmount: number;
  items: Array<{
    itemName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([
    {
      id: 1,
      orderNumber: 'PO-2024-001',
      supplier: '㈜ABC소재',
      orderDate: '2024-01-15',
      expectedDate: '2024-01-22',
      status: 'PENDING',
      totalAmount: 1500000,
      items: [
        { itemName: '철강 원자재 A', quantity: 1000, unitPrice: 1500, totalPrice: 1500000 }
      ]
    },
    {
      id: 2,
      orderNumber: 'PO-2024-002',
      supplier: '대한부품',
      orderDate: '2024-01-14',
      expectedDate: '2024-01-21',
      status: 'APPROVED',
      totalAmount: 250000,
      items: [
        { itemName: '볼트 M8x20', quantity: 5000, unitPrice: 50, totalPrice: 250000 }
      ]
    },
    {
      id: 3,
      orderNumber: 'PO-2024-003',
      supplier: '신영화학',
      orderDate: '2024-01-13',
      expectedDate: '2024-01-18',
      status: 'RECEIVED',
      totalAmount: 800000,
      items: [
        { itemName: '도료', quantity: 400, unitPrice: 2000, totalPrice: 800000 }
      ]
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-blue-100 text-blue-800';
      case 'RECEIVED':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '승인대기';
      case 'APPROVED':
        return '승인완료';
      case 'RECEIVED':
        return '입고완료';
      case 'COMPLETED':
        return '완료';
      default:
        return status;
    }
  };

  const handleView = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handleExcelDownload = () => {
    const columns: ExcelColumn[] = [
      { key: 'orderNumber', label: '주문번호', width: 15 },
      { key: 'supplier', label: '공급업체', width: 20 },
      { key: 'orderDate', label: '주문일자', width: 12 },
      { key: 'expectedDate', label: '납기일자', width: 12 },
      { key: 'status', label: '상태', width: 10 },
      { key: 'totalAmount', label: '총 금액', width: 15 }
    ];

    const excelData = filteredOrders.map(order => ({
      ...order,
      status: getStatusText(order.status),
      totalAmount: `₩${order.totalAmount.toLocaleString()}`
    }));

    const success = downloadExcel(excelData, columns, '구매주문목록');
    if (!success) {
      alert('엑셀 다운로드 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">구매주문 관리</h1>
          <p className="text-gray-600">구매주문서를 작성하고 관리합니다.</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleExcelDownload}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            엑셀 다운로드
          </button>
          <button
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            신규 주문
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
                placeholder="주문번호 또는 공급업체명으로 검색"
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
              <option value="PENDING">승인대기</option>
              <option value="APPROVED">승인완료</option>
              <option value="RECEIVED">입고완료</option>
              <option value="COMPLETED">완료</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  주문번호
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  공급업체
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  주문일자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  납기일자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  총 금액
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.supplier}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(order.orderDate), 'yyyy-MM-dd', { locale: ko })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(order.expectedDate), 'yyyy-MM-dd', { locale: ko })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₩{order.totalAmount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleView(order)}
                      className="text-primary-600 hover:text-primary-900 mr-3"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="text-blue-600 hover:text-blue-900 mr-3">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-900">
                      <FileText className="h-4 w-4" />
                    </button>
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
                구매주문서 상세 - {selectedOrder.orderNumber}
              </h3>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">주문 정보</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">주문번호:</span>
                      <span className="text-sm text-gray-900">{selectedOrder.orderNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">주문일자:</span>
                      <span className="text-sm text-gray-900">
                        {format(new Date(selectedOrder.orderDate), 'yyyy-MM-dd', { locale: ko })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">납기일자:</span>
                      <span className="text-sm text-gray-900">
                        {format(new Date(selectedOrder.expectedDate), 'yyyy-MM-dd', { locale: ko })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">상태:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusText(selectedOrder.status)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">공급업체 정보</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">업체명:</span>
                      <span className="text-sm text-gray-900">{selectedOrder.supplier}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">주문 품목</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-md">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">품목명</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">수량</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">단가</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">총액</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedOrder.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-900">{item.itemName}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">{item.quantity.toLocaleString()}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">₩{item.unitPrice.toLocaleString()}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 text-right font-medium">₩{item.totalPrice.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-sm font-medium text-gray-900 text-right">총 주문금액:</td>
                        <td className="px-4 py-2 text-sm font-bold text-gray-900 text-right">₩{selectedOrder.totalAmount.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
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
                {selectedOrder.status === 'PENDING' && (
                  <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                    승인
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