'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Download } from 'lucide-react';
import { downloadExcel, ExcelColumn } from '@/lib/excel';
import { useAuth } from '@/lib/auth-service';

interface Item {
  _id: string;
  code: string;
  name: string;
  category: 'RAW_MATERIAL' | 'COMPONENT' | 'FINISHED_PRODUCT' | 'CONSUMABLE';
  supplierId?: {
    _id: string;
    name: string;
    businessNumber?: string;
    type: string;
  };
  unit: string;
  price: number;
  cost: number;
  minStock: number;
  maxStock: number;
  safetyStock: number;
  leadTime: number;
  specification?: string;
  description?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  isActive: boolean;
}

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { makeAuthenticatedRequest, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchItems = async () => {
      try {
        setLoading(true);
        const response = await makeAuthenticatedRequest('/api/items');
        
        if (response.ok) {
          const data = await response.json();
          setItems(data.data.items);
        } else {
          throw new Error('품목 데이터를 불러오는데 실패했습니다.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [isAuthenticated]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      try {
        const response = await makeAuthenticatedRequest(`/api/items/${id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          setItems(items.filter(item => item._id !== id));
        } else {
          alert('삭제에 실패했습니다.');
        }
      } catch (error) {
        alert('삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowModal(false);
    setEditingItem(null);
  };

  const handleExcelDownload = () => {
    const columns: ExcelColumn[] = [
      { key: 'code', label: '품목코드', width: 15 },
      { key: 'name', label: '품목명', width: 25 },
      { key: 'category', label: '카테고리', width: 15 },
      { key: 'supplierId.name', label: '협력사', width: 20 },
      { key: 'unit', label: '단위', width: 10 },
      { key: 'price', label: '판매가', width: 15 },
      { key: 'cost', label: '원가', width: 15 },
      { key: 'minStock', label: '최소재고', width: 12 },
      { key: 'maxStock', label: '최대재고', width: 12 },
      { key: 'safetyStock', label: '안전재고', width: 12 },
      { key: 'leadTime', label: '리드타임', width: 10 },
      { key: 'isActive', label: '상태', width: 10 }
    ];

    const success = downloadExcel(filteredItems, columns, '품목목록');
    if (!success) {
      alert('엑셀 다운로드에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">품목/BOM 관리</h1>
          <p className="text-gray-600">제품, 부품, 원자재 정보를 관리합니다.</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleExcelDownload}
            disabled={filteredItems.length === 0}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4 mr-2" />
            엑셀 다운로드
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            신규 등록
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
                placeholder="품목명 또는 품목코드로 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="min-w-[200px]">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">전체 카테고리</option>
                <option value="RAW_MATERIAL">원자재</option>
                <option value="COMPONENT">부품</option>
                <option value="FINISHED_PRODUCT">완제품</option>
                <option value="CONSUMABLE">소모품</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-2 text-gray-600">로딩 중...</span>
            </div>
          ) : error ? (
            <div className="text-center p-8">
              <p className="text-red-600">{error}</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    품목코드
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    품목명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    카테고리
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    협력사
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    단위
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    판매가
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    원가
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    최소재고
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
                {filteredItems.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.category === 'RAW_MATERIAL' ? 'bg-blue-100 text-blue-800' :
                        item.category === 'COMPONENT' ? 'bg-green-100 text-green-800' :
                        item.category === 'FINISHED_PRODUCT' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.category === 'RAW_MATERIAL' ? '원자재' :
                         item.category === 'COMPONENT' ? '부품' :
                         item.category === 'FINISHED_PRODUCT' ? '완제품' : '소모품'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.supplierId?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₩{item.price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₩{item.cost.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.minStock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      item.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.isActive ? '사용' : '중단'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-primary-600 hover:text-primary-900 mr-3"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-4 text-center text-gray-500">
                    등록된 품목이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {editingItem ? '품목 수정' : '신규 품목 등록'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    품목코드
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    defaultValue={editingItem?.code}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    품목명
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    defaultValue={editingItem?.name}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    카테고리
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500">
                    <option>원자재</option>
                    <option>부품</option>
                    <option>완제품</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    협력사
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500">
                    <option value="">협력사 선택</option>
                    <option value="supplier1">한국제조(주)</option>
                    <option value="supplier2">글로벌공급(주)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    단위
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    defaultValue={editingItem?.unit}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    판매가
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    defaultValue={editingItem?.price}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    원가
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    defaultValue={editingItem?.cost}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    최소재고
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    defaultValue={editingItem?.minStock}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    최대재고
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    defaultValue={editingItem?.maxStock}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                >
                  {editingItem ? '수정' : '등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}