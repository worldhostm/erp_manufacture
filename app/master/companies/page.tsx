'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Edit, Trash2, Building2, Download } from 'lucide-react';
import { downloadExcel, ExcelColumn } from '@/lib/excel';
import { useAuth } from '@/lib/auth-service';

interface Company {
  _id: string;
  name: string;
  businessNumber: string;
  address: string;
  phone: string;
  email: string;
  ceo: string;
  type: 'SUPPLIER' | 'CUSTOMER' | 'BOTH';
  isActive: boolean;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { makeAuthenticatedRequest, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        const response = await makeAuthenticatedRequest('/api/companies');
        
        if (response.ok) {
          const data = await response.json();
          setCompanies(data.data.companies);
        } else {
          throw new Error('회사 데이터를 불러오는데 실패했습니다.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, [isAuthenticated]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'SUPPLIER' | 'CUSTOMER'>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.businessNumber.includes(searchTerm);
    const matchesFilter = filterType === 'ALL' || company.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      try {
        const response = await makeAuthenticatedRequest(`/api/companies/${id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          setCompanies(companies.filter(company => company._id !== id));
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
    setEditingCompany(null);
  };

  const handleExcelDownload = () => {
    const columns: ExcelColumn[] = [
      { key: 'name', label: '회사명', width: 25 },
      { key: 'businessNumber', label: '사업자번호', width: 15 },
      { key: 'ceo', label: '대표자', width: 15 },
      { key: 'phone', label: '전화번호', width: 15 },
      { key: 'email', label: '이메일', width: 25 },
      { key: 'address', label: '주소', width: 40 },
      { key: 'type', label: '구분', width: 12 },
      { key: 'isActive', label: '상태', width: 10 }
    ];

    const success = downloadExcel(filteredCompanies, columns, '협력회사목록');
    if (!success) {
      alert('엑셀 다운로드에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">협력회사 관리</h1>
          <p className="text-gray-600">공급업체와 고객사 정보를 관리합니다.</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleExcelDownload}
            disabled={filteredCompanies.length === 0}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4 mr-2" />
            엑셀 다운로드
          </button>
          <Link
            href="/master/companies/register"
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            신규 등록
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="회사명 또는 사업자번호로 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'ALL' | 'SUPPLIER' | 'CUSTOMER')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="ALL">전체</option>
              <option value="SUPPLIER">공급업체</option>
              <option value="CUSTOMER">고객사</option>
            </select>
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
                    회사명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사업자번호
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    대표자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    연락처
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이메일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    구분
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
                {filteredCompanies.map((company) => (
                  <tr key={company._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building2 className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {company.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {company.address}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {company.businessNumber || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {company.ceo || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {company.phone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {company.email || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        company.type === 'SUPPLIER' 
                          ? 'bg-blue-100 text-blue-800' 
                          : company.type === 'CUSTOMER'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {company.type === 'SUPPLIER' ? '공급업체' : company.type === 'CUSTOMER' ? '고객사' : '혼합'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        company.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {company.isActive ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(company)}
                        className="text-primary-600 hover:text-primary-900 mr-3"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(company._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredCompanies.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                      등록된 회사가 없습니다.
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
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-screen overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {editingCompany ? '협력회사 수정' : '신규 협력회사 등록'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    회사명 *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    defaultValue={editingCompany?.name}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    사업자번호 *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="123-45-67890"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    defaultValue={editingCompany?.businessNumber}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    대표자 *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    defaultValue={editingCompany?.ceo}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    구분 *
                  </label>
                  <select 
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    defaultValue={editingCompany?.type}
                  >
                    <option value="">선택하세요</option>
                    <option value="SUPPLIER">공급업체</option>
                    <option value="CUSTOMER">고객사</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    전화번호
                  </label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    defaultValue={editingCompany?.phone}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    이메일
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    defaultValue={editingCompany?.email}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  주소
                </label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  defaultValue={editingCompany?.address}
                />
              </div>
              
              <div className="flex items-center">
                <input
                  id="isActive"
                  type="checkbox"
                  defaultChecked={editingCompany?.isActive !== false}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  활성 상태
                </label>
              </div>
              
              <div className="flex justify-end space-x-4 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCompany(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                >
                  {editingCompany ? '수정' : '등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}