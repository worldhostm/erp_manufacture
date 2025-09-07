'use client';

import React, { useState, useEffect } from 'react';
import { Eye, Check, X, MessageSquare, Calendar, User, FileText, Badge } from 'lucide-react';

interface PurchaseRequestItem {
  itemName: string;
  itemCode?: string;
  category?: string;
  quantity: number;
  unit: string;
  estimatedPrice: number;
  totalPrice: number;
  requiredDate?: string;
  purpose: string;
  specification?: string;
  notes?: string;
}

interface ApprovalHistory {
  _id: string;
  approvedBy: {
    _id: string;
    name: string;
    email: string;
  };
  approvedAt: string;
  action: 'APPROVED' | 'REJECTED' | 'RETURNED';
  comments?: string;
  level: number;
}

interface PurchaseRequest {
  _id: string;
  requestNumber: string;
  requesterId: string;
  requester: {
    _id: string;
    name: string;
    email: string;
    department?: string;
    position?: string;
  };
  department: string;
  requestDate: string;
  requiredDate?: string;
  purpose: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'PARTIALLY_APPROVED' | 'REJECTED' | 'ORDERED' | 'CANCELLED';
  items: PurchaseRequestItem[];
  totalAmount: number;
  justification?: string;
  attachments?: string[];
  approvalHistory: ApprovalHistory[];
  currentApprovalLevel: number;
  maxApprovalLevel: number;
  createdAt: string;
  updatedAt: string;
}

const priorityColors = {
  LOW: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800'
};

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  PARTIALLY_APPROVED: 'bg-orange-100 text-orange-800',
  REJECTED: 'bg-red-100 text-red-800',
  ORDERED: 'bg-purple-100 text-purple-800',
  CANCELLED: 'bg-gray-100 text-gray-800'
};

const statusLabels = {
  DRAFT: '임시저장',
  SUBMITTED: '제출됨',
  UNDER_REVIEW: '검토중',
  APPROVED: '승인됨',
  PARTIALLY_APPROVED: '부분승인',
  REJECTED: '반려됨',
  ORDERED: '주문완료',
  CANCELLED: '취소됨'
};

const priorityLabels = {
  LOW: '낮음',
  MEDIUM: '보통',
  HIGH: '높음',
  URGENT: '긴급'
};

export default function PurchaseRequestApprovePage() {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approvalComments, setApprovalComments] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [processingApproval, setProcessingApproval] = useState(false);

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('인증이 필요합니다.');
        return;
      }

      const response = await fetch('/api/purchase-requests/pending/approval', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '승인 대기중인 구매요청을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setRequests(data.data.requests || []);
    } catch (err) {
      console.error('Error fetching pending requests:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (request: PurchaseRequest) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
    setApprovalComments('');
    setActionType(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
    setApprovalComments('');
    setActionType(null);
  };

  const handleApproval = async (action: 'approve' | 'reject') => {
    if (!selectedRequest) return;
    
    if (action === 'reject' && !approvalComments.trim()) {
      alert('반려 시 사유를 입력해야 합니다.');
      return;
    }

    try {
      setProcessingApproval(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('인증이 필요합니다.');
      }

      const response = await fetch(`/api/purchase-requests/${selectedRequest._id}/${action}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comments: approvalComments.trim()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `${action === 'approve' ? '승인' : '반려'} 처리에 실패했습니다.`);
      }

      const data = await response.json();
      alert(data.message || `${action === 'approve' ? '승인' : '반려'} 처리가 완료되었습니다.`);
      
      // Refresh the list
      await fetchPendingRequests();
      closeModal();
    } catch (err) {
      console.error('Error processing approval:', err);
      alert(err instanceof Error ? err.message : '처리 중 오류가 발생했습니다.');
    } finally {
      setProcessingApproval(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">승인 대기중인 구매요청을 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">구매요청 승인</h1>
          <p className="mt-1 text-sm text-gray-500">승인 대기중인 구매요청을 검토하고 승인/반려 처리합니다</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">승인 대기중인 구매요청이 없습니다</h3>
              <p className="mt-1 text-sm text-gray-500">현재 승인이 필요한 구매요청이 없습니다.</p>
            </div>
          ) : (
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      요청번호
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      요청자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      부서
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      요청일자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      우선순위
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      총 금액
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((request) => (
                    <tr key={request._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {request.requestNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{request.requester.name}</div>
                        <div className="text-sm text-gray-500">{request.requester.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(request.requestDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${priorityColors[request.priority]}`}>
                          {priorityLabels[request.priority]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₩{formatCurrency(request.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[request.status]}`}>
                          {statusLabels[request.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openModal(request)}
                          className="text-primary-600 hover:text-primary-900 inline-flex items-center"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          검토
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Approval Modal */}
      {isModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">구매요청 승인/반려</h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Request Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">요청번호</label>
                    <div className="mt-1 text-sm text-gray-900">{selectedRequest.requestNumber}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">요청자</label>
                    <div className="mt-1 text-sm text-gray-900">
                      {selectedRequest.requester.name} ({selectedRequest.requester.department})
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">요청일자</label>
                    <div className="mt-1 text-sm text-gray-900">{formatDate(selectedRequest.requestDate)}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">우선순위</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${priorityColors[selectedRequest.priority]}`}>
                      {priorityLabels[selectedRequest.priority]}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">목적</label>
                    <div className="mt-1 text-sm text-gray-900">{selectedRequest.purpose}</div>
                  </div>
                  {selectedRequest.justification && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">요청 사유</label>
                      <div className="mt-1 text-sm text-gray-900">{selectedRequest.justification}</div>
                    </div>
                  )}
                </div>

                {/* Items List */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">요청 품목</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">품목명</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">수량</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">단위</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">단가</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">총액</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">용도</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedRequest.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 text-sm text-gray-900">{item.itemName}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{item.quantity}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{item.unit}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">₩{formatCurrency(item.estimatedPrice)}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">₩{formatCurrency(item.totalPrice)}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{item.purpose}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 text-right">
                    <span className="text-lg font-medium text-gray-900">
                      총 금액: ₩{formatCurrency(selectedRequest.totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Approval History */}
                {selectedRequest.approvalHistory.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">승인 이력</h4>
                    <div className="space-y-2">
                      {selectedRequest.approvalHistory.map((history, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-medium">{history.approvedBy.name}</span>
                              <span className="text-sm text-gray-500 ml-2">
                                {formatDate(history.approvedAt)}
                              </span>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              history.action === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {history.action === 'APPROVED' ? '승인' : '반려'}
                            </span>
                          </div>
                          {history.comments && (
                            <div className="mt-2 text-sm text-gray-700">{history.comments}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Approval Comments */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    승인/반려 의견 {actionType === 'reject' && <span className="text-red-500">*</span>}
                  </label>
                  <textarea
                    value={approvalComments}
                    onChange={(e) => setApprovalComments(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="승인/반려 사유를 입력하세요..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    disabled={processingApproval}
                  >
                    취소
                  </button>
                  <button
                    onClick={() => {
                      setActionType('reject');
                      handleApproval('reject');
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 inline-flex items-center"
                    disabled={processingApproval}
                  >
                    <X className="h-4 w-4 mr-2" />
                    {processingApproval && actionType === 'reject' ? '처리중...' : '반려'}
                  </button>
                  <button
                    onClick={() => {
                      setActionType('approve');
                      handleApproval('approve');
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 inline-flex items-center"
                    disabled={processingApproval}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {processingApproval && actionType === 'approve' ? '처리중...' : '승인'}
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