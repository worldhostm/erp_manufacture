'use client';

import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Eye, Calendar, Filter, Download } from 'lucide-react';

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

const transactionTypeColors = {
  IN: 'bg-green-100 text-green-800',
  OUT: 'bg-red-100 text-red-800',
  TRANSFER: 'bg-blue-100 text-blue-800',
  ADJUSTMENT: 'bg-yellow-100 text-yellow-800',
  RETURN: 'bg-purple-100 text-purple-800'
};

const transactionTypeLabels = {
  IN: '입고',
  OUT: '출고',
  TRANSFER: '이동',
  ADJUSTMENT: '조정',
  RETURN: '반품'
};

export default function InventoryIncomingPage() {
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
        transactionType: 'IN' // Only incoming transactions
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
        throw new Error(errorData.message || '입고 내역을 불러오는데 실패했습니다.');
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">재고 입고 내역</h1>
          <p className="mt-1 text-sm text-gray-500">재고 입고 거래 내역을 확인합니다</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => alert('엑셀 다운로드 기능을 구현 중입니다.')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            엑셀 다운로드
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
                placeholder="시작일"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="종료일"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-500">입고 내역을 불러오는 중...</div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">입고 내역이 없습니다</h3>
              <p className="mt-1 text-sm text-gray-500">입고 거래 내역이 없습니다.</p>
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
                        입고수량
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
                          <span className="font-medium text-green-600">+{formatCurrency(transaction.quantity)}</span>
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

      {/* Detail Modal */}
      {showModal && selectedTransaction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">입고 거래 상세정보</h3>
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
                    <label className="block text-sm font-medium text-gray-700">입고 수량</label>
                    <div className="mt-1 text-sm font-medium text-green-600">+{formatCurrency(selectedTransaction.quantity)}</div>
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