'use client';

import { useState } from 'react';
import { Plus, Search, Eye, CheckCircle, Package, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { downloadExcel, ExcelColumn } from '@/lib/excel';

interface Receipt {
  id: number;
  receiptNumber: string;
  purchaseOrderNumber: string;
  supplier: string;
  receiptDate: string;
  warehouse: string;
  status: 'RECEIVED' | 'INSPECTED' | 'COMPLETED';
  totalAmount: number;
  items: Array<{
    itemName: string;
    orderedQuantity: number;
    receivedQuantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([
    {
      id: 1,
      receiptNumber: 'RCP-2024-001',
      purchaseOrderNumber: 'PO-2024-001',
      supplier: '㈜ABC소재',
      receiptDate: '2024-01-20',
      warehouse: '본사창고',
      status: 'RECEIVED',
      totalAmount: 1500000,
      items: [
        { 
          itemName: '철강 원자재 A', 
          orderedQuantity: 1000, 
          receivedQuantity: 1000, 
          unitPrice: 1500, 
          totalPrice: 1500000 
        }
      ]
    },
    {
      id: 2,
      receiptNumber: 'RCP-2024-002',
      purchaseOrderNumber: 'PO-2024-002',
      supplier: '대한부품',
      receiptDate: '2024-01-19',
      warehouse: '본사창고',
      status: 'INSPECTED',
      totalAmount: 250000,
      items: [
        { 
          itemName: '볼트 M8x20', 
          orderedQuantity: 5000, 
          receivedQuantity: 4980, 
          unitPrice: 50, 
          totalPrice: 249000 
        }
      ]
    },
    {
      id: 3,
      receiptNumber: 'RCP-2024-003',
      purchaseOrderNumber: 'PO-2024-003',
      supplier: '신영화학',
      receiptDate: '2024-01-18',
      warehouse: '본사창고',
      status: 'COMPLETED',
      totalAmount: 800000,
      items: [
        { 
          itemName: '도료', 
          orderedQuantity: 400, 
          receivedQuantity: 400, 
          unitPrice: 2000, 
          totalPrice: 800000 
        }
      ]
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  const filteredReceipts = receipts.filter(receipt => {
    const matchesSearch = receipt.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         receipt.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         receipt.purchaseOrderNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || receipt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return 'bg-blue-100 text-blue-800';
      case 'INSPECTED':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return '입고완료';
      case 'INSPECTED':
        return '검사완료';
      case 'COMPLETED':
        return '처리완료';
      default:
        return status;
    }
  };

  const handleView = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setShowModal(true);
  };

  const handleExcelDownload = () => {
    const columns: ExcelColumn[] = [
      { key: 'receiptNumber', label: '입고번호', width: 15 },
      { key: 'purchaseOrderNumber', label: '구매주문번호', width: 15 },
      { key: 'supplier', label: '공급업체', width: 20 },
      { key: 'receiptDate', label: '입고일자', width: 12 },
      { key: 'warehouse', label: '창고', width: 12 },
      { key: 'status', label: '상태', width: 10 },
      { key: 'totalAmount', label: '총 금액', width: 15 }
    ];

    const excelData = filteredReceipts.map(receipt => ({
      ...receipt,
      status: getStatusText(receipt.status),
      totalAmount: `₩${receipt.totalAmount.toLocaleString()}`
    }));

    const success = downloadExcel(excelData, columns, '구매입고목록');
    if (!success) {
      alert('엑셀 다운로드 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">입고 관리</h1>
          <p className="text-gray-600">구매한 자재의 입고 현황을 관리합니다.</p>
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
            신규 입고
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
                placeholder="입고번호, 구매주문번호 또는 공급업체명으로 검색"
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
              <option value="RECEIVED">입고완료</option>
              <option value="INSPECTED">검사완료</option>
              <option value="COMPLETED">처리완료</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  입고번호
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  구매주문번호
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  공급업체
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  입고일자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  창고
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
              {filteredReceipts.map((receipt) => (
                <tr key={receipt.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Package className="h-5 w-5 text-gray-400 mr-3" />
                      <div className="text-sm font-medium text-gray-900">
                        {receipt.receiptNumber}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {receipt.purchaseOrderNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {receipt.supplier}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(receipt.receiptDate), 'yyyy-MM-dd', { locale: ko })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {receipt.warehouse}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(receipt.status)}`}>
                      {getStatusText(receipt.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₩{receipt.totalAmount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleView(receipt)}
                      className="text-primary-600 hover:text-primary-900 mr-3"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {receipt.status === 'RECEIVED' && (
                      <button className="text-green-600 hover:text-green-900">
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && selectedReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                입고 상세 - {selectedReceipt.receiptNumber}
              </h3>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">입고 정보</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">입고번호:</span>
                      <span className="text-sm text-gray-900">{selectedReceipt.receiptNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">입고일자:</span>
                      <span className="text-sm text-gray-900">
                        {format(new Date(selectedReceipt.receiptDate), 'yyyy-MM-dd', { locale: ko })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">창고:</span>
                      <span className="text-sm text-gray-900">{selectedReceipt.warehouse}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">주문 정보</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">구매주문번호:</span>
                      <span className="text-sm text-gray-900">{selectedReceipt.purchaseOrderNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">공급업체:</span>
                      <span className="text-sm text-gray-900">{selectedReceipt.supplier}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">상태</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">처리상태:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedReceipt.status)}`}>
                        {getStatusText(selectedReceipt.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">입고 품목</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-md">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">품목명</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">주문수량</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">입고수량</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">단가</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">총액</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">입고율</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedReceipt.items.map((item, index) => {
                        const receivedRate = (item.receivedQuantity / item.orderedQuantity) * 100;
                        return (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-gray-900">{item.itemName}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 text-right">{item.orderedQuantity.toLocaleString()}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 text-right font-medium">{item.receivedQuantity.toLocaleString()}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 text-right">₩{item.unitPrice.toLocaleString()}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 text-right font-medium">₩{item.totalPrice.toLocaleString()}</td>
                            <td className="px-4 py-2 text-center">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                receivedRate === 100 ? 'bg-green-100 text-green-800' : 
                                receivedRate > 95 ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-red-100 text-red-800'
                              }`}>
                                {receivedRate.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={4} className="px-4 py-2 text-sm font-medium text-gray-900 text-right">총 입고금액:</td>
                        <td className="px-4 py-2 text-sm font-bold text-gray-900 text-right">₩{selectedReceipt.totalAmount.toLocaleString()}</td>
                        <td></td>
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
                {selectedReceipt.status === 'RECEIVED' && (
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