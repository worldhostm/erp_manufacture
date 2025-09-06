'use client';

import { useState } from 'react';
import { Plus, Search, Eye, Truck, FileText, Building2, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { downloadExcel, ExcelColumn } from '@/lib/excel';

interface SalesOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  customerType: 'DOMESTIC' | 'EXPORT';
  orderDate: string;
  deliveryDate: string;
  status: 'PENDING' | 'CONFIRMED' | 'PRODUCING' | 'SHIPPED' | 'COMPLETED';
  totalAmount: number;
  currency: 'KRW' | 'USD' | 'EUR';
  paymentTerms: string;
  salesRep: string;
  items: Array<{
    itemName: string;
    itemCode: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    unit: string;
  }>;
  notes?: string;
}

export default function SalesOrdersPage() {
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([
    {
      id: 1,
      orderNumber: 'SO-2024-001',
      customerName: '글로벌전자㈜',
      customerType: 'DOMESTIC',
      orderDate: '2024-01-15',
      deliveryDate: '2024-02-15',
      status: 'CONFIRMED',
      totalAmount: 2500000,
      currency: 'KRW',
      paymentTerms: '월말 결제',
      salesRep: '김영업',
      items: [
        {
          itemName: '제품A',
          itemCode: 'PRD-001',
          quantity: 100,
          unitPrice: 25000,
          totalPrice: 2500000,
          unit: '개'
        }
      ]
    },
    {
      id: 2,
      orderNumber: 'SO-2024-002',
      customerName: 'Global Tech Inc.',
      customerType: 'EXPORT',
      orderDate: '2024-01-14',
      deliveryDate: '2024-02-28',
      status: 'PRODUCING',
      totalAmount: 15000,
      currency: 'USD',
      paymentTerms: 'L/C at sight',
      salesRep: '이수출',
      items: [
        {
          itemName: '제품B',
          itemCode: 'PRD-002',
          quantity: 500,
          unitPrice: 30,
          totalPrice: 15000,
          unit: '개'
        }
      ]
    },
    {
      id: 3,
      orderNumber: 'SO-2024-003',
      customerName: '대한제조㈜',
      customerType: 'DOMESTIC',
      orderDate: '2024-01-12',
      deliveryDate: '2024-01-25',
      status: 'SHIPPED',
      totalAmount: 1800000,
      currency: 'KRW',
      paymentTerms: '선불',
      salesRep: '박판매',
      items: [
        {
          itemName: '제품C',
          itemCode: 'PRD-003',
          quantity: 50,
          unitPrice: 36000,
          totalPrice: 1800000,
          unit: '개'
        }
      ]
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);

  const filteredOrders = salesOrders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || order.customerType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800';
      case 'PRODUCING':
        return 'bg-purple-100 text-purple-800';
      case 'SHIPPED':
        return 'bg-indigo-100 text-indigo-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '수주대기';
      case 'CONFIRMED':
        return '수주확정';
      case 'PRODUCING':
        return '생산중';
      case 'SHIPPED':
        return '출하완료';
      case 'COMPLETED':
        return '완료';
      default:
        return status;
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    switch (currency) {
      case 'KRW':
        return `₩${amount.toLocaleString()}`;
      case 'USD':
        return `$${amount.toLocaleString()}`;
      case 'EUR':
        return `€${amount.toLocaleString()}`;
      default:
        return amount.toLocaleString();
    }
  };

  const handleView = (order: SalesOrder) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handleExcelDownload = () => {
    const columns: ExcelColumn[] = [
      { key: 'orderNumber', label: '수주번호', width: 15 },
      { key: 'customerName', label: '고객명', width: 20 },
      { key: 'customerType', label: '구분', width: 10 },
      { key: 'orderDate', label: '수주일자', width: 12 },
      { key: 'deliveryDate', label: '납기일자', width: 12 },
      { key: 'status', label: '상태', width: 10 },
      { key: 'totalAmount', label: '주문금액', width: 15 },
      { key: 'currency', label: '통화', width: 8 },
      { key: 'paymentTerms', label: '결제조건', width: 15 },
      { key: 'salesRep', label: '영업담당', width: 12 }
    ];

    const excelData = filteredOrders.map(order => ({
      ...order,
      customerType: order.customerType === 'DOMESTIC' ? '내수' : '수출',
      status: getStatusText(order.status),
      totalAmount: formatAmount(order.totalAmount, order.currency)
    }));

    const success = downloadExcel(excelData, columns, '수주목록');
    if (!success) {
      alert('엑셀 다운로드 중 오류가 발생했습니다.');
    }
  };

  const totalDomesticAmount = salesOrders
    .filter(order => order.customerType === 'DOMESTIC' && order.currency === 'KRW')
    .reduce((sum, order) => sum + order.totalAmount, 0);

  const totalExportAmount = salesOrders
    .filter(order => order.customerType === 'EXPORT')
    .reduce((sum, order) => sum + order.totalAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">수주 관리</h1>
          <p className="text-gray-600">고객으로부터의 주문을 접수하고 관리합니다.</p>
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
            신규 수주
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-600">내수 주문액</p>
              <p className="text-2xl font-semibold text-blue-600">₩{totalDomesticAmount.toLocaleString()}</p>
            </div>
            <Building2 className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-600">수출 주문액</p>
              <p className="text-2xl font-semibold text-green-600">${totalExportAmount.toLocaleString()}</p>
            </div>
            <Truck className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-600">총 수주 건수</p>
              <p className="text-2xl font-semibold text-gray-900">{salesOrders.length}</p>
            </div>
            <FileText className="h-8 w-8 text-gray-500" />
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
                placeholder="수주번호 또는 고객명으로 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="flex space-x-2">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="ALL">전체 상태</option>
                <option value="PENDING">수주대기</option>
                <option value="CONFIRMED">수주확정</option>
                <option value="PRODUCING">생산중</option>
                <option value="SHIPPED">출하완료</option>
                <option value="COMPLETED">완료</option>
              </select>
              <select 
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="ALL">전체 구분</option>
                <option value="DOMESTIC">내수</option>
                <option value="EXPORT">수출</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  수주번호
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  고객정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  수주일자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  납기일자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  주문금액
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  영업담당
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
                      <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                      <div className="text-sm text-gray-500">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.customerType === 'DOMESTIC' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {order.customerType === 'DOMESTIC' ? '내수' : '수출'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(order.orderDate), 'yyyy-MM-dd', { locale: ko })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(order.deliveryDate), 'yyyy-MM-dd', { locale: ko })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatAmount(order.totalAmount, order.currency)}
                    </div>
                    <div className="text-sm text-gray-500">{order.paymentTerms}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.salesRep}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleView(order)}
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

      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-screen overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                수주서 상세 - {selectedOrder.orderNumber}
              </h3>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">수주 정보</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">수주번호:</span>
                      <span className="text-sm text-gray-900 font-medium">{selectedOrder.orderNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">수주일자:</span>
                      <span className="text-sm text-gray-900">
                        {format(new Date(selectedOrder.orderDate), 'yyyy-MM-dd', { locale: ko })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">납기일자:</span>
                      <span className="text-sm text-gray-900">
                        {format(new Date(selectedOrder.deliveryDate), 'yyyy-MM-dd', { locale: ko })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">영업담당:</span>
                      <span className="text-sm text-gray-900">{selectedOrder.salesRep}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">고객 정보</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">고객명:</span>
                      <span className="text-sm text-gray-900">{selectedOrder.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">구분:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedOrder.customerType === 'DOMESTIC' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {selectedOrder.customerType === 'DOMESTIC' ? '내수' : '수출'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">결제조건:</span>
                      <span className="text-sm text-gray-900">{selectedOrder.paymentTerms}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">주문 현황</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">상태:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusText(selectedOrder.status)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">총 주문금액:</span>
                      <span className="text-sm text-gray-900 font-bold">
                        {formatAmount(selectedOrder.totalAmount, selectedOrder.currency)}
                      </span>
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
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">품목코드</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">수량</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">단가</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">총액</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedOrder.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-900">{item.itemName}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{item.itemCode}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">
                            {item.quantity.toLocaleString()} {item.unit}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">
                            {formatAmount(item.unitPrice, selectedOrder.currency)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900 text-right font-medium">
                            {formatAmount(item.totalPrice, selectedOrder.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={4} className="px-4 py-2 text-sm font-medium text-gray-900 text-right">총 주문금액:</td>
                        <td className="px-4 py-2 text-sm font-bold text-gray-900 text-right">
                          {formatAmount(selectedOrder.totalAmount, selectedOrder.currency)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">특이사항</h4>
                  <div className="bg-gray-50 rounded-md p-3">
                    <p className="text-sm text-gray-700">{selectedOrder.notes}</p>
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