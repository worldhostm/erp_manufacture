'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Eye, CheckCircle, Package, Download, Edit, Trash2 } from 'lucide-react';

interface ReceiptItem {
  itemId: string;
  itemName: string;
  itemCode?: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  qualityStatus?: 'PENDING' | 'PASSED' | 'FAILED';
  defectQuantity?: number;
  defectReason?: string;
}

interface Receipt {
  _id: string;
  receiptNumber: string;
  purchaseOrderNumber?: string;
  supplierId: string;
  supplierName: string;
  receiptDate: string;
  expectedDeliveryDate?: string;
  warehouseId: string;
  warehouseName: string;
  status: 'RECEIVED' | 'INSPECTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  items: ReceiptItem[];
  totalAmount: number;
  totalQuantity: number;
  receivedBy: {
    _id: string;
    name: string;
    email: string;
  };
  inspectedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  inspectionDate?: string;
  inspectionNotes?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

const statusColors = {
  RECEIVED: 'bg-blue-100 text-blue-800',
  INSPECTED: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-purple-100 text-purple-800'
};

const statusLabels = {
  RECEIVED: '입고완료',
  INSPECTED: '검사완료',
  APPROVED: '승인완료',
  REJECTED: '반려',
  COMPLETED: '처리완료'
};

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchReceipts();
  }, [currentPage, statusFilter, searchTerm]);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('인증이 필요합니다.');
        return;
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      });

      if (statusFilter && statusFilter !== 'ALL') {
        params.append('status', statusFilter);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/receipts?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '입고 목록을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setReceipts(data.data.receipts || []);
      setTotalPages(data.data.pagination.totalPages || 1);
      setTotalCount(data.data.pagination.totalCount || 0);
    } catch (err) {
      console.error('Error fetching receipts:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const handleView = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setShowModal(true);
  };

  const handleExcelDownload = () => {
    // TODO: Implement Excel download functionality
    alert('엑셀 다운로드 기능을 구현 중입니다.');
  };

  const handleInspect = async (receiptId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/receipts/${receiptId}/inspect`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inspectionNotes: '검사 완료'
        })
      });

      if (!response.ok) {
        throw new Error('검사 처리에 실패했습니다.');
      }

      await fetchReceipts();
      alert('검사가 완료되었습니다.');
    } catch (err) {
      alert(err instanceof Error ? err.message : '검사 처리 중 오류가 발생했습니다.');
    }
  };

  const handleApprove = async (receiptId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/receipts/${receiptId}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('승인 처리에 실패했습니다.');
      }

      await fetchReceipts();
      alert('입고가 승인되었습니다.');
    } catch (err) {
      alert(err instanceof Error ? err.message : '승인 처리 중 오류가 발생했습니다.');
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
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            신규 입고
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

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
              <option value="APPROVED">승인완료</option>
              <option value="REJECTED">반려</option>
              <option value="COMPLETED">처리완료</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">입고 목록을 불러오는 중...</div>
          </div>
        ) : receipts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">입고 내역이 없습니다</h3>
            <p className="mt-1 text-sm text-gray-500">새로운 입고 내역이 없습니다.</p>
          </div>
        ) : (
          <>
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
                  {receipts.map((receipt) => (
                    <tr key={receipt._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package className="h-5 w-5 text-gray-400 mr-3" />
                          <div className="text-sm font-medium text-gray-900">
                            {receipt.receiptNumber}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {receipt.purchaseOrderNumber || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {receipt.supplierName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(receipt.receiptDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {receipt.warehouseName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[receipt.status]}`}>
                          {statusLabels[receipt.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₩{formatCurrency(receipt.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2 justify-end">
                          <button
                            onClick={() => handleView(receipt)}
                            className="text-primary-600 hover:text-primary-900"
                            title="상세보기"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {receipt.status === 'RECEIVED' && (
                            <button 
                              onClick={() => handleInspect(receipt._id)}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="검사하기"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          {receipt.status === 'INSPECTED' && (
                            <button 
                              onClick={() => handleApprove(receipt._id)}
                              className="text-green-600 hover:text-green-900"
                              title="승인하기"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    이전
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    다음
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      전체 <span className="font-medium">{totalCount}</span>개 중{' '}
                      <span className="font-medium">{(currentPage - 1) * 20 + 1}</span>-
                      <span className="font-medium">{Math.min(currentPage * 20, totalCount)}</span>개 표시
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        이전
                      </button>
                      {Array.from({ length: Math.min(10, totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === currentPage
                                ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        다음
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
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
                        {formatDate(selectedReceipt.receiptDate)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">창고:</span>
                      <span className="text-sm text-gray-900">{selectedReceipt.warehouseName}</span>
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
                      <span className="text-sm text-gray-900">{selectedReceipt.supplierName}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">상태</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">처리상태:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[selectedReceipt.status]}`}>
                        {statusLabels[selectedReceipt.status]}
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
                            <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatCurrency(item.orderedQuantity)}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 text-right font-medium">{formatCurrency(item.receivedQuantity)}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 text-right">₩{formatCurrency(item.unitPrice)}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 text-right font-medium">₩{formatCurrency(item.totalPrice)}</td>
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
                        <td className="px-4 py-2 text-sm font-bold text-gray-900 text-right">₩{formatCurrency(selectedReceipt.totalAmount)}</td>
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

      {/* 신규 입고 모달 */}
      {showCreateModal && (
        <CreateReceiptModal 
          onClose={() => setShowCreateModal(false)} 
          onSuccess={() => {
            setShowCreateModal(false);
            fetchReceipts();
          }}
        />
      )}
    </div>
  );
}

// 신규 입고 생성 모달 컴포넌트
function CreateReceiptModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    purchaseOrderNumber: '',
    supplierId: '',
    supplierName: '',
    warehouseId: '',
    warehouseName: '',
    receiptDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    remarks: ''
  });
  const [items, setItems] = useState<Omit<ReceiptItem, 'qualityStatus' | 'defectQuantity' | 'defectReason'>[]>([
    {
      itemId: '',
      itemName: '',
      itemCode: '',
      orderedQuantity: 0,
      receivedQuantity: 0,
      unitPrice: 0,
      totalPrice: 0,
      notes: ''
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [availableItems, setAvailableItems] = useState<any[]>([]);

  useEffect(() => {
    fetchSuppliers();
    fetchWarehouses();
    fetchItems();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/suppliers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/inventory/warehouses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setWarehouses(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/items', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableItems(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSupplierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const supplierId = e.target.value;
    const supplier = suppliers.find(s => s._id === supplierId);
    setFormData(prev => ({
      ...prev,
      supplierId,
      supplierName: supplier?.name || ''
    }));
  };

  const handleWarehouseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const warehouseId = e.target.value;
    const warehouse = warehouses.find(w => w._id === warehouseId);
    setFormData(prev => ({
      ...prev,
      warehouseId,
      warehouseName: warehouse?.name || ''
    }));
  };

  const handleItemChange = (index: number, field: keyof typeof items[0], value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === 'itemId') {
      const selectedItem = availableItems.find(item => item._id === value);
      if (selectedItem) {
        newItems[index].itemName = selectedItem.name;
        newItems[index].itemCode = selectedItem.code;
      }
    }

    if (field === 'receivedQuantity' || field === 'unitPrice') {
      newItems[index].totalPrice = newItems[index].receivedQuantity * newItems[index].unitPrice;
    }

    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, {
      itemId: '',
      itemName: '',
      itemCode: '',
      orderedQuantity: 0,
      receivedQuantity: 0,
      unitPrice: 0,
      totalPrice: 0,
      notes: ''
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
      const totalQuantity = items.reduce((sum, item) => sum + item.receivedQuantity, 0);

      const response = await fetch('/api/receipts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          items: items.filter(item => item.itemId && item.receivedQuantity > 0),
          totalAmount,
          totalQuantity
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '입고 등록에 실패했습니다.');
      }

      alert('입고가 성공적으로 등록되었습니다.');
      onSuccess();
    } catch (error) {
      alert(error instanceof Error ? error.message : '입고 등록 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-screen overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">신규 입고 등록</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                구매주문번호 (선택사항)
              </label>
              <input
                type="text"
                name="purchaseOrderNumber"
                value={formData.purchaseOrderNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="PO-2025-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                입고일자 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="receiptDate"
                value={formData.receiptDate}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                공급업체 <span className="text-red-500">*</span>
              </label>
              <select
                name="supplierId"
                value={formData.supplierId}
                onChange={handleSupplierChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">공급업체를 선택하세요</option>
                {suppliers.map((supplier) => (
                  <option key={supplier._id} value={supplier._id}>
                    {supplier.name} ({supplier.businessNumber || '사업자번호 없음'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                창고 <span className="text-red-500">*</span>
              </label>
              <select
                name="warehouseId"
                value={formData.warehouseId}
                onChange={handleWarehouseChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">창고를 선택하세요</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse._id} value={warehouse._id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                예정 납기일
              </label>
              <input
                type="date"
                name="expectedDeliveryDate"
                value={formData.expectedDeliveryDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비고
              </label>
              <input
                type="text"
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="특이사항이 있으면 입력하세요"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-medium text-gray-900">입고 품목</h4>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-1" />
                품목 추가
              </button>
            </div>

            <div className="border border-gray-300 rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      품목 <span className="text-red-500">*</span>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      주문수량
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      입고수량 <span className="text-red-500">*</span>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      단가 <span className="text-red-500">*</span>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      총액
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      비고
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      삭제
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3">
                        <select
                          value={item.itemId}
                          onChange={(e) => handleItemChange(index, 'itemId', e.target.value)}
                          required
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="">품목을 선택하세요</option>
                          {availableItems.map((availableItem) => (
                            <option key={availableItem._id} value={availableItem._id}>
                              {availableItem.name} ({availableItem.code})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.orderedQuantity}
                          onChange={(e) => handleItemChange(index, 'orderedQuantity', parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right focus:ring-primary-500 focus:border-primary-500"
                          min="0"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.receivedQuantity}
                          onChange={(e) => handleItemChange(index, 'receivedQuantity', parseInt(e.target.value) || 0)}
                          required
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right focus:ring-primary-500 focus:border-primary-500"
                          min="0"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', parseInt(e.target.value) || 0)}
                          required
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right focus:ring-primary-500 focus:border-primary-500"
                          min="0"
                        />
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                        ₩{new Intl.NumberFormat('ko-KR').format(item.totalPrice)}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={item.notes}
                          onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-primary-500 focus:border-primary-500"
                          placeholder="비고"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                      총 입고금액:
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                      ₩{new Intl.NumberFormat('ko-KR').format(items.reduce((sum, item) => sum + item.totalPrice, 0))}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {loading ? '등록 중...' : '입고 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}