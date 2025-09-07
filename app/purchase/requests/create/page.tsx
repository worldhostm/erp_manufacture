'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, Trash2, Calendar, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-service';

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

interface PurchaseRequestFormData {
  department: string;
  purpose: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  requiredDate?: string;
  justification?: string;
  items: PurchaseRequestItem[];
}

export default function CreatePurchaseRequestPage() {
  const router = useRouter();
  const { makeAuthenticatedRequest, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState<PurchaseRequestFormData>({
    department: user?.department || '',
    purpose: '',
    priority: 'MEDIUM',
    requiredDate: '',
    justification: '',
    items: [{
      itemName: '',
      itemCode: '',
      category: '',
      quantity: 1,
      unit: 'EA',
      estimatedPrice: 0,
      totalPrice: 0,
      requiredDate: '',
      purpose: '',
      specification: '',
      notes: ''
    }]
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'estimatedPrice') {
      newItems[index].totalPrice = Number(newItems[index].quantity) * Number(newItems[index].estimatedPrice);
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, {
        itemName: '',
        itemCode: '',
        category: '',
        quantity: 1,
        unit: 'EA',
        estimatedPrice: 0,
        totalPrice: 0,
        requiredDate: '',
        purpose: '',
        specification: '',
        notes: ''
      }]
    });
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData({ ...formData, items: newItems });
    }
  };

  const totalAmount = formData.items.reduce((sum, item) => sum + item.totalPrice, 0);

  const validateForm = () => {
    if (!formData.department) {
      setError('부서명을 입력해주세요.');
      return false;
    }
    if (!formData.purpose) {
      setError('구매 목적을 입력해주세요.');
      return false;
    }
    if (formData.items.some(item => !item.itemName || !item.purpose)) {
      setError('모든 품목의 이름과 용도를 입력해주세요.');
      return false;
    }
    if (formData.items.some(item => item.quantity <= 0)) {
      setError('수량은 0보다 커야 합니다.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault();
    setError('');

    if (!isDraft && !validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        ...formData,
        status: isDraft ? 'DRAFT' : 'SUBMITTED',
        totalAmount
      };
      
      const response = await makeAuthenticatedRequest('/api/purchase-requests', {
        method: 'POST',
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '구매요청 생성에 실패했습니다.');
      }

      const result = await response.json();
      alert(isDraft ? '임시저장되었습니다.' : '구매요청이 제출되었습니다.');
      router.push('/purchase/requests');
    } catch (error: any) {
      console.error('Submit error:', error);
      setError(error.message || '요청 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'text-red-600';
      case 'HIGH': return 'text-orange-600';
      case 'MEDIUM': return 'text-yellow-600';
      case 'LOW': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'URGENT': return '긴급';
      case 'HIGH': return '높음';
      case 'MEDIUM': return '보통';
      case 'LOW': return '낮음';
      default: return priority;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/purchase/requests"
            className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            뒤로
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">구매요청 작성</h1>
            <p className="text-gray-600">새로운 구매요청서를 작성합니다.</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <div className="text-sm text-red-700">{error}</div>
          </div>
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        {/* 기본 정보 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">기본 정보</h3>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  요청부서 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="department"
                  required
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="부서명을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  우선순위 <span className="text-red-500">*</span>
                </label>
                <select
                  name="priority"
                  required
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="LOW">낮음</option>
                  <option value="MEDIUM">보통</option>
                  <option value="HIGH">높음</option>
                  <option value="URGENT">긴급</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  구매 목적 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="purpose"
                  required
                  value={formData.purpose}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="구매 목적을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  희망납기일
                </label>
                <input
                  type="date"
                  name="requiredDate"
                  value={formData.requiredDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                구매 사유 / 정당성
              </label>
              <textarea
                name="justification"
                rows={3}
                value={formData.justification}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="구매가 필요한 사유를 자세히 설명해주세요"
              />
            </div>
          </div>
        </div>

        {/* 구매 품목 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">구매 품목</h3>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200"
              >
                <Plus className="h-4 w-4 mr-1" />
                품목 추가
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-6">
              {formData.items.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-medium text-gray-900">품목 #{index + 1}</h4>
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">품목명 *</label>
                      <input
                        type="text"
                        required
                        value={item.itemName}
                        onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        placeholder="품목명을 입력하세요"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">품목코드</label>
                      <input
                        type="text"
                        value={item.itemCode}
                        onChange={(e) => handleItemChange(index, 'itemCode', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        placeholder="품목코드"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">카테고리</label>
                      <input
                        type="text"
                        value={item.category}
                        onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        placeholder="카테고리"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">수량 *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">단위 *</label>
                      <select
                        value={item.unit}
                        onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="EA">EA</option>
                        <option value="KG">KG</option>
                        <option value="L">L</option>
                        <option value="M">M</option>
                        <option value="SET">SET</option>
                        <option value="BOX">BOX</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">예상단가</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.estimatedPrice}
                        onChange={(e) => handleItemChange(index, 'estimatedPrice', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">총액</label>
                      <div className="px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-md text-right">
                        ₩{item.totalPrice.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">필요일자</label>
                      <input
                        type="date"
                        value={item.requiredDate}
                        onChange={(e) => handleItemChange(index, 'requiredDate', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">용도 *</label>
                      <input
                        type="text"
                        required
                        value={item.purpose}
                        onChange={(e) => handleItemChange(index, 'purpose', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        placeholder="사용 목적"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">규격/사양</label>
                      <textarea
                        rows={2}
                        value={item.specification}
                        onChange={(e) => handleItemChange(index, 'specification', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        placeholder="규격 또는 사양"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">비고</label>
                      <textarea
                        rows={2}
                        value={item.notes}
                        onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        placeholder="기타 참고사항"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-500">
                    우선순위: <span className={`font-medium ${getPriorityColor(formData.priority)}`}>
                      {getPriorityText(formData.priority)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    총 품목: <span className="font-medium">{formData.items.length}개</span>
                  </div>
                </div>
                <div className="text-lg font-semibold">
                  총 예상금액: ₩{totalAmount.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 제출 버튼 */}
        <div className="flex justify-end space-x-4">
          <Link
            href="/purchase/requests"
            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            취소
          </Link>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={loading}
            className="flex items-center px-6 py-2 border border-gray-300 text-gray-700 bg-white rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? '저장 중...' : '임시저장'}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? '제출 중...' : '제출'}
          </button>
        </div>
      </form>
    </div>
  );
}