'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Search, Filter, Eye, Edit, Trash2, CheckCircle, Play, Download, AlertTriangle, Clock } from 'lucide-react';
import { useAuth } from '@/lib/auth-service';

interface ProductionPlan {
  _id: string;
  planNumber: string;
  itemId: {
    _id: string;
    name: string;
    code: string;
    category?: string;
    unit?: string;
  };
  itemName: string;
  itemCode: string;
  plannedQuantity: number;
  producedQuantity: number;
  startDate: string;
  endDate: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'DRAFT' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  description?: string;
  notes?: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  approvedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  completionPercentage?: number;
  remainingDays?: number;
  createdAt: string;
  updatedAt: string;
}

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800'
};

const statusLabels = {
  DRAFT: '작성중',
  APPROVED: '승인됨',
  IN_PROGRESS: '진행중',
  COMPLETED: '완료',
  CANCELLED: '취소'
};

const priorityColors = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800'
};

const priorityLabels = {
  LOW: '낮음',
  MEDIUM: '보통',
  HIGH: '높음',
  URGENT: '긴급'
};

export default function ProductionPlansPage() {
  const { makeAuthenticatedRequest } = useAuth();
  const [plans, setPlans] = useState<ProductionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ProductionPlan | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchPlans();
  }, [currentPage, statusFilter, priorityFilter, searchTerm]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      });

      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await makeAuthenticatedRequest(`/api/production-plans?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '생산계획을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setPlans(data.data.plans || []);
      setTotalPages(data.data.pagination.totalPages || 1);
      setTotalCount(data.data.pagination.totalCount || 0);
    } catch (err) {
      console.error('Error fetching production plans:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (planId: string) => {
    try {
      const response = await makeAuthenticatedRequest(`/api/production-plans/${planId}/approve`, {
        method: 'PATCH'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '승인에 실패했습니다.');
      }

      alert('생산계획이 승인되었습니다.');
      fetchPlans();
    } catch (error) {
      alert(error instanceof Error ? error.message : '승인 중 오류가 발생했습니다.');
    }
  };

  const handleStart = async (planId: string) => {
    try {
      const response = await makeAuthenticatedRequest(`/api/production-plans/${planId}/start`, {
        method: 'PATCH'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '생산 시작에 실패했습니다.');
      }

      alert('생산이 시작되었습니다.');
      fetchPlans();
    } catch (error) {
      alert(error instanceof Error ? error.message : '생산 시작 중 오류가 발생했습니다.');
    }
  };

  const handleExcelDownload = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await makeAuthenticatedRequest(`/api/production-plans/export/excel?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('엑셀 다운로드에 실패했습니다.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `생산계획_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert(error instanceof Error ? error.message : '엑셀 다운로드 중 오류가 발생했습니다.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const getRemainingDays = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const timeDiff = end.getTime() - now.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">생산계획 관리</h1>
          <p className="mt-1 text-sm text-gray-500">생산계획을 수립하고 관리합니다</p>
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
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            생산계획 등록
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
          <div className="mb-4 flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="품목명, 계획번호로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">모든 상태</option>
              <option value="DRAFT">작성중</option>
              <option value="APPROVED">승인됨</option>
              <option value="IN_PROGRESS">진행중</option>
              <option value="COMPLETED">완료</option>
              <option value="CANCELLED">취소</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">모든 우선순위</option>
              <option value="LOW">낮음</option>
              <option value="MEDIUM">보통</option>
              <option value="HIGH">높음</option>
              <option value="URGENT">긴급</option>
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-500">생산계획을 불러오는 중...</div>
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">생산계획이 없습니다</h3>
              <p className="mt-1 text-sm text-gray-500">새로운 생산계획을 등록해보세요.</p>
              <div className="mt-6">
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  생산계획 등록
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">계획번호</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">품목정보</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">계획수량</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">생산수량</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">진행률</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">기간</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">우선순위</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">상태</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">관리</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {plans.map((plan) => {
                      const completionRate = plan.plannedQuantity > 0 
                        ? Math.round((plan.producedQuantity / plan.plannedQuantity) * 100) 
                        : 0;
                      const remainingDays = getRemainingDays(plan.endDate);
                      
                      return (
                        <tr key={plan._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                              <div className="text-sm font-medium text-gray-900">
                                {plan.planNumber}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{plan.itemName}</div>
                              <div className="text-sm text-gray-500">{plan.itemCode}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                            {new Intl.NumberFormat('ko-KR').format(plan.plannedQuantity)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                            {new Intl.NumberFormat('ko-KR').format(plan.producedQuantity)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-primary-600 h-2 rounded-full" 
                                  style={{ width: `${Math.min(completionRate, 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-900">{completionRate}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>
                              <div>{formatDate(plan.startDate)} ~</div>
                              <div className="flex items-center">
                                {formatDate(plan.endDate)}
                                {remainingDays < 0 && (
                                  <AlertTriangle className="h-4 w-4 text-red-500 ml-1" title="지연" />
                                )}
                                {remainingDays <= 3 && remainingDays >= 0 && (
                                  <Clock className="h-4 w-4 text-orange-500 ml-1" title="마감 임박" />
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${priorityColors[plan.priority]}`}>
                              {priorityLabels[plan.priority]}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[plan.status]}`}>
                              {statusLabels[plan.status]}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex space-x-2 justify-end">
                              <button
                                onClick={() => {
                                  setSelectedPlan(plan);
                                  setShowDetailModal(true);
                                }}
                                className="text-primary-600 hover:text-primary-900"
                                title="상세보기"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              {plan.status === 'DRAFT' && (
                                <button 
                                  onClick={() => handleApprove(plan._id)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="승인하기"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                              )}
                              {plan.status === 'APPROVED' && (
                                <button 
                                  onClick={() => handleStart(plan._id)}
                                  className="text-green-600 hover:text-green-900"
                                  title="생산시작"
                                >
                                  <Play className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4">
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

      {/* 생산계획 등록 모달 */}
      {showCreateModal && (
        <CreatePlanModal 
          onClose={() => setShowCreateModal(false)} 
          onSuccess={() => {
            setShowCreateModal(false);
            fetchPlans();
          }}
        />
      )}

      {/* 상세보기 모달 */}
      {showDetailModal && selectedPlan && (
        <DetailModal
          plan={selectedPlan}
          onClose={() => setShowDetailModal(false)}
          onRefresh={fetchPlans}
        />
      )}
    </div>
  );
}

// 생산계획 등록 모달
function CreatePlanModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { makeAuthenticatedRequest } = useAuth();
  const [formData, setFormData] = useState({
    itemId: '',
    plannedQuantity: '',
    startDate: '',
    endDate: '',
    priority: 'MEDIUM',
    description: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/items');
      if (response.ok) {
        const data = await response.json();
        setItems(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await makeAuthenticatedRequest('/api/production-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          plannedQuantity: parseInt(formData.plannedQuantity)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '생산계획 등록에 실패했습니다.');
      }

      alert('생산계획이 성공적으로 등록되었습니다.');
      onSuccess();
    } catch (error) {
      alert(error instanceof Error ? error.message : '등록 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">생산계획 등록</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                품목 <span className="text-red-500">*</span>
              </label>
              <select
                name="itemId"
                value={formData.itemId}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">품목을 선택하세요</option>
                {items.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name} ({item.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                계획수량 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="plannedQuantity"
                value={formData.plannedQuantity}
                onChange={handleInputChange}
                required
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="1000"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  시작일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  완료예정일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                우선순위
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="LOW">낮음</option>
                <option value="MEDIUM">보통</option>
                <option value="HIGH">높음</option>
                <option value="URGENT">긴급</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                설명
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="생산계획에 대한 설명을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비고
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="특이사항이 있으면 입력하세요"
              />
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
              {loading ? '등록 중...' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 상세보기 모달
function DetailModal({ plan, onClose, onRefresh }: { 
  plan: ProductionPlan; 
  onClose: () => void; 
  onRefresh: () => void; 
}) {
  const { makeAuthenticatedRequest } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [productionQuantity, setProductionQuantity] = useState(plan.producedQuantity.toString());

  const handleUpdateProduction = async () => {
    try {
      setUpdating(true);
      const response = await makeAuthenticatedRequest(`/api/production-plans/${plan._id}/production`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          producedQuantity: parseInt(productionQuantity)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '생산수량 업데이트에 실패했습니다.');
      }

      alert('생산수량이 업데이트되었습니다.');
      onRefresh();
      onClose();
    } catch (error) {
      alert(error instanceof Error ? error.message : '업데이트 중 오류가 발생했습니다.');
    } finally {
      setUpdating(false);
    }
  };

  const completionRate = plan.plannedQuantity > 0 
    ? Math.round((plan.producedQuantity / plan.plannedQuantity) * 100) 
    : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            생산계획 상세 - {plan.planNumber}
          </h3>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">계획 정보</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">계획번호:</span>
                  <span className="text-sm text-gray-900">{plan.planNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">상태:</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[plan.status]}`}>
                    {statusLabels[plan.status]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">우선순위:</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${priorityColors[plan.priority]}`}>
                    {priorityLabels[plan.priority]}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">품목 정보</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">품목명:</span>
                  <span className="text-sm text-gray-900">{plan.itemName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">품목코드:</span>
                  <span className="text-sm text-gray-900">{plan.itemCode}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">일정</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">시작일:</span>
                  <span className="text-sm text-gray-900">
                    {new Date(plan.startDate).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">완료예정일:</span>
                  <span className="text-sm text-gray-900">
                    {new Date(plan.endDate).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">생산 현황</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-6 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {new Intl.NumberFormat('ko-KR').format(plan.plannedQuantity)}
                  </div>
                  <div className="text-sm text-gray-500">계획수량</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">
                    {new Intl.NumberFormat('ko-KR').format(plan.producedQuantity)}
                  </div>
                  <div className="text-sm text-gray-500">생산수량</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{completionRate}%</div>
                  <div className="text-sm text-gray-500">완료율</div>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-primary-600 h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(completionRate, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {plan.status === 'IN_PROGRESS' && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">생산수량 업데이트</h4>
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  value={productionQuantity}
                  onChange={(e) => setProductionQuantity(e.target.value)}
                  min="0"
                  max={plan.plannedQuantity}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="생산된 수량을 입력하세요"
                />
                <button
                  onClick={handleUpdateProduction}
                  disabled={updating}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {updating ? '업데이트 중...' : '업데이트'}
                </button>
              </div>
            </div>
          )}

          {plan.description && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">설명</h4>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                {plan.description}
              </p>
            </div>
          )}

          {plan.notes && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">비고</h4>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                {plan.notes}
              </p>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">이력</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">작성자:</span>
                <span className="text-sm text-gray-900">{plan.createdBy.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">작성일:</span>
                <span className="text-sm text-gray-900">
                  {new Date(plan.createdAt).toLocaleDateString('ko-KR')}
                </span>
              </div>
              {plan.approvedBy && (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">승인자:</span>
                    <span className="text-sm text-gray-900">{plan.approvedBy.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">승인일:</span>
                    <span className="text-sm text-gray-900">
                      {plan.approvedAt && new Date(plan.approvedAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              닫기
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              인쇄
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}