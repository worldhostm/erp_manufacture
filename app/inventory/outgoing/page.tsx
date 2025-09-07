'use client';

import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Eye, Calendar, Filter, Download, ArrowUpDown } from 'lucide-react';

interface InventoryTransaction {
  _id: string;
  transactionNumber: string;
  itemId: string;
  itemName: string;
  itemCode?: string;
  warehouseId: string;
  warehouseName: string;
  transactionType: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT' | 'RETURN';
  quantity: number;
  unitPrice?: number;
  totalValue?: number;
  previousQuantity: number;
  currentQuantity: number;
  referenceId?: string;
  referenceType?: 'RECEIPT' | 'ISSUE' | 'TRANSFER' | 'ADJUSTMENT' | 'RETURN';
  referenceNumber?: string;
  transactionDate: string;
  reason?: string;
  notes?: string;
  batchNumber?: string;
  expirationDate?: string;
  location?: string;
  userId: string;
  userName: string;
  createdAt: string;
  updatedAt: string;
}

interface IssueItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice?: number;
  batchNumber?: string;
  notes?: string;
}

interface IssueFormData {
  items: IssueItem[];
  warehouseId: string;
  reason: string;
  notes?: string;
  referenceNumber?: string;
}

export default function InventoryOutgoingPage() {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedTransaction, setSelectedTransaction] = useState<InventoryTransaction | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueForm, setIssueForm] = useState<IssueFormData>({
    items: [{ itemId: '', itemName: '', quantity: 0 }],
    warehouseId: '',
    reason: ''
  });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, warehouseFilter, startDate, endDate, searchTerm]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('인증이 필요합니다.');
        return;
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        transactionType: 'OUT' // Only outgoing transactions
      });

      if (warehouseFilter) {
        params.append('warehouseId', warehouseFilter);
      }
      if (startDate) {
        params.append('startDate', startDate);
      }
      if (endDate) {
        params.append('endDate', endDate);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/inventory/transactions?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '출고 내역을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setTransactions(data.data.transactions || []);
      setTotalPages(data.data.pagination.totalPages || 1);
      setTotalCount(data.data.pagination.totalCount || 0);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleIssue = async () => {
    try {
      setProcessing(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/inventory/issue', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(issueForm)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '출고 처리에 실패했습니다.');
      }

      await fetchTransactions();
      setShowIssueModal(false);
      setIssueForm({
        items: [{ itemId: '', itemName: '', quantity: 0 }],
        warehouseId: '',
        reason: ''
      });
      alert('출고 처리가 완료되었습니다.');
    } catch (err) {
      alert(err instanceof Error ? err.message : '출고 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const openModal = (transaction: InventoryTransaction) => {
    setSelectedTransaction(transaction);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTransaction(null);
  };

  const addIssueItem = () => {
    setIssueForm(prev => ({
      ...prev,
      items: [...prev.items, { itemId: '', itemName: '', quantity: 0 }]
    }));
  };

  const removeIssueItem = (index: number) => {
    setIssueForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateIssueItem = (index: number, field: keyof IssueItem, value: any) => {
    setIssueForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">재고 출고 관리</h1>
          <p className="mt-1 text-sm text-gray-500">재고 출고 내역을 관리하고 새로운 출고를 처리합니다</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => alert('엑셀 다운로드 기능을 구현 중입니다.')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            엑셀 다운로드
          </button>
          <button
            onClick={() => setShowIssueModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            신규 출고
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="mb-4 flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="품목명, 참조번호로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select 
                value={warehouseFilter}
                onChange={(e) => setWarehouseFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">모든 창고</option>
                {/* TODO: Load warehouses dynamically */}
              </select>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-500">출고 내역을 불러오는 중...</div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <ArrowUpDown className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">출고 내역이 없습니다</h3>
              <p className="mt-1 text-sm text-gray-500">출고 거래 내역이 없습니다.</p>
            </div>
          ) : (
            <>
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        거래번호
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        품목명
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        창고
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        출고수량
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        단가
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        총액
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        거래일시
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        처리자
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        액션
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {transaction.transactionNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{transaction.itemName}</div>
                          <div className="text-sm text-gray-500">{transaction.itemCode || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.warehouseName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="font-medium text-red-600">{formatCurrency(Math.abs(transaction.quantity))}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.unitPrice ? `₩${formatCurrency(transaction.unitPrice)}` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.totalValue ? `₩${formatCurrency(transaction.totalValue)}` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDateTime(transaction.transactionDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.userName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => openModal(transaction)}
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
      </div>

      {/* Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">신규 출고 처리</h3>
                <button
                  onClick={() => setShowIssueModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">창고 *</label>
                    <select
                      value={issueForm.warehouseId}
                      onChange={(e) => setIssueForm(prev => ({ ...prev, warehouseId: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      required
                    >
                      <option value="">창고를 선택하세요</option>
                      {/* TODO: Load warehouses dynamically */}
                      <option value="warehouse1">본사창고</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">출고 사유 *</label>
                    <input
                      type="text"
                      value={issueForm.reason}
                      onChange={(e) => setIssueForm(prev => ({ ...prev, reason: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      placeholder="출고 사유를 입력하세요"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">참조번호</label>
                  <input
                    type="text"
                    value={issueForm.referenceNumber || ''}
                    onChange={(e) => setIssueForm(prev => ({ ...prev, referenceNumber: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="참조번호 (선택사항)"
                  />
                </div>

                {/* Items */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-gray-700">출고 품목 *</label>
                    <button
                      type="button"
                      onClick={addIssueItem}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      품목 추가
                    </button>
                  </div>

                  <div className="space-y-3">
                    {issueForm.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-3">
                          <label className="block text-xs font-medium text-gray-700">품목명</label>
                          <input
                            type="text"
                            value={item.itemName}
                            onChange={(e) => updateIssueItem(index, 'itemName', e.target.value)}
                            className="mt-1 w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            placeholder="품목명"
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-700">수량</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateIssueItem(index, 'quantity', Number(e.target.value))}
                            className="mt-1 w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            min="1"
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-700">단가</label>
                          <input
                            type="number"
                            value={item.unitPrice || ''}
                            onChange={(e) => updateIssueItem(index, 'unitPrice', e.target.value ? Number(e.target.value) : undefined)}
                            className="mt-1 w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            min="0"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-700">배치번호</label>
                          <input
                            type="text"
                            value={item.batchNumber || ''}
                            onChange={(e) => updateIssueItem(index, 'batchNumber', e.target.value)}
                            className="mt-1 w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            placeholder="배치번호"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-700">비고</label>
                          <input
                            type="text"
                            value={item.notes || ''}
                            onChange={(e) => updateIssueItem(index, 'notes', e.target.value)}
                            className="mt-1 w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            placeholder="비고"
                          />
                        </div>
                        <div className="col-span-1">
                          <button
                            type="button"
                            onClick={() => removeIssueItem(index)}
                            disabled={issueForm.items.length <= 1}
                            className="w-full px-2 py-1 text-sm font-medium text-red-600 hover:text-red-800 disabled:text-gray-400"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">비고</label>
                  <textarea
                    value={issueForm.notes || ''}
                    onChange={(e) => setIssueForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="추가 비고사항"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => setShowIssueModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    disabled={processing}
                  >
                    취소
                  </button>
                  <button
                    onClick={handleIssue}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
                    disabled={processing || !issueForm.warehouseId || !issueForm.reason || issueForm.items.some(item => !item.itemName || !item.quantity)}
                  >
                    {processing ? '처리중...' : '출고 처리'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showModal && selectedTransaction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">출고 거래 상세정보</h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">거래번호</label>
                    <div className="mt-1 text-sm text-gray-900">{selectedTransaction.transactionNumber}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">거래일시</label>
                    <div className="mt-1 text-sm text-gray-900">{formatDateTime(selectedTransaction.transactionDate)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">품목명</label>
                    <div className="mt-1 text-sm text-gray-900">{selectedTransaction.itemName}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">품목코드</label>
                    <div className="mt-1 text-sm text-gray-900">{selectedTransaction.itemCode || '-'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">창고</label>
                    <div className="mt-1 text-sm text-gray-900">{selectedTransaction.warehouseName}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">위치</label>
                    <div className="mt-1 text-sm text-gray-900">{selectedTransaction.location || '-'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">출고 수량</label>
                    <div className="mt-1 text-sm font-medium text-red-600">{formatCurrency(Math.abs(selectedTransaction.quantity))}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">단가</label>
                    <div className="mt-1 text-sm text-gray-900">
                      {selectedTransaction.unitPrice ? `₩${formatCurrency(selectedTransaction.unitPrice)}` : '-'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">총액</label>
                    <div className="mt-1 text-sm text-gray-900">
                      {selectedTransaction.totalValue ? `₩${formatCurrency(selectedTransaction.totalValue)}` : '-'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">이전 재고</label>
                    <div className="mt-1 text-sm text-gray-900">{formatCurrency(selectedTransaction.previousQuantity)}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">현재 재고</label>
                    <div className="mt-1 text-sm text-gray-900">{formatCurrency(selectedTransaction.currentQuantity)}</div>
                  </div>
                </div>

                {selectedTransaction.batchNumber && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">배치번호</label>
                      <div className="mt-1 text-sm text-gray-900">{selectedTransaction.batchNumber}</div>
                    </div>
                    {selectedTransaction.expirationDate && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">만료일</label>
                        <div className="mt-1 text-sm text-gray-900">{formatDate(selectedTransaction.expirationDate)}</div>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">참조번호</label>
                    <div className="mt-1 text-sm text-gray-900">{selectedTransaction.referenceNumber || '-'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">처리자</label>
                    <div className="mt-1 text-sm text-gray-900">{selectedTransaction.userName}</div>
                  </div>
                </div>

                {selectedTransaction.reason && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">사유</label>
                    <div className="mt-1 text-sm text-gray-900">{selectedTransaction.reason}</div>
                  </div>
                )}

                {selectedTransaction.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">비고</label>
                    <div className="mt-1 text-sm text-gray-900">{selectedTransaction.notes}</div>
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}