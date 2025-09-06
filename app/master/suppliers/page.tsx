'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Plus, Search, Edit, Trash2, Phone, Mail, Download } from 'lucide-react';
import { downloadExcel, ExcelColumn } from '@/lib/excel';
import { useAuth } from '@/lib/auth-service';

interface Supplier {
  _id: string;
  name: string;
  businessNumber?: string;
  ceo?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  type: string;
  isActive: boolean;
  createdAt: string;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { makeAuthenticatedRequest, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchSuppliers = async () => {
      try {
        setLoading(true);
        // 공급업체만 필터링해서 가져오기
        const response = await makeAuthenticatedRequest('/api/companies?type=SUPPLIER');
        
        if (!response.ok) {
          throw new Error('협력회사 목록을 불러오는데 실패했습니다.');
        }
        
        const data = await response.json();
        setSuppliers(data.data?.companies || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSuppliers();
  }, [isAuthenticated]);

  const refetchSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await makeAuthenticatedRequest('/api/companies?type=SUPPLIER');
      
      if (!response.ok) {
        throw new Error('협력회사 목록을 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      setSuppliers(data.data?.companies || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.businessNumber && supplier.businessNumber.includes(searchTerm)) ||
    (supplier.ceo && supplier.ceo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`'${name}' 협력회사를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await makeAuthenticatedRequest(`/api/companies/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('협력회사 삭제에 실패했습니다.');
      }

      setSuppliers(suppliers.filter(supplier => supplier._id !== id));
      alert('협력회사가 삭제되었습니다.');
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.');
    }
  };

  const handleExcelDownload = () => {
    const columns: ExcelColumn[] = [
      { key: 'name', label: '협력회사명', width: 20 },
      { key: 'businessNumber', label: '사업자번호', width: 15 },
      { key: 'ceo', label: '대표자', width: 15 },
      { key: 'phone', label: '전화번호', width: 15 },
      { key: 'email', label: '이메일', width: 25 },
      { key: 'contactPerson', label: '담당자', width: 15 },
      { key: 'contactPhone', label: '담당자연락처', width: 15 },
      { key: 'isActive', label: '상태', width: 10 },
      { key: 'createdAt', label: '등록일', width: 15 }
    ];

    const success = downloadExcel(filteredSuppliers, columns, '협력회사목록');
    if (!success) {
      alert('엑셀 다운로드에 실패했습니다.');
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">협력회사 관리</h1>
          <p className="mt-1 text-sm text-gray-500">협력회사 정보를 관리합니다</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleExcelDownload}
            disabled={filteredSuppliers.length === 0}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4 mr-2" />
            엑셀 다운로드
          </button>
          <Link
            href="/master/suppliers/register"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            협력회사 등록
          </Link>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="협력회사명, 사업자번호로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <p className="text-red-800">{error}</p>
              <button 
                onClick={refetchSuppliers} 
                className="mt-2 text-red-600 hover:text-red-800 underline"
              >
                다시 시도
              </button>
            </div>
          )}

          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    협력회사명
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
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/6 mx-auto mt-2"></div>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">협력회사 목록을 불러오는 중...</p>
                    </td>
                  </tr>
                ) : filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <Users className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        {searchTerm ? '검색 결과가 없습니다' : '등록된 협력회사가 없습니다'}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {searchTerm ? '다른 검색어를 시도해보세요.' : '새로운 협력회사를 등록해보세요.'}
                      </p>
                      {!searchTerm && (
                        <div className="mt-6">
                          <Link
                            href="/master/suppliers/register"
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            협력회사 등록
                          </Link>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <tr key={supplier._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                        {supplier.contactPerson && (
                          <div className="text-sm text-gray-500">담당자: {supplier.contactPerson}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {supplier.businessNumber || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {supplier.ceo || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="space-y-1">
                          {supplier.phone && (
                            <div className="flex items-center">
                              <Phone className="h-3 w-3 text-gray-400 mr-1" />
                              {supplier.phone}
                            </div>
                          )}
                          {supplier.email && (
                            <div className="flex items-center">
                              <Mail className="h-3 w-3 text-gray-400 mr-1" />
                              {supplier.email}
                            </div>
                          )}
                          {!supplier.phone && !supplier.email && '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          supplier.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {supplier.isActive ? '활성' : '비활성'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleDelete(supplier._id, supplier.name)}
                          className="text-red-600 hover:text-red-900"
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}