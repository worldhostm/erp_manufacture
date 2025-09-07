'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Plus, Search, Shield, User, Edit, Trash2, Download } from 'lucide-react';
import { useAuth } from '@/lib/auth-service';
import { downloadExcel, ExcelColumn } from '@/lib/excel';

interface SystemUser {
  _id: string;
  name: string;
  email: string;
  role: 'USER' | 'MANAGER' | 'ADMIN';
  department?: string;
  position?: string;
  phone?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const { makeAuthenticatedRequest, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    loadUsers();
  }, [isAuthenticated]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await makeAuthenticatedRequest('/api/admin/users');
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data.users || []);
      } else {
        throw new Error('사용자 데이터를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      console.error('Load users error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.department && user.department.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = roleFilter === '' || user.role === roleFilter;
    const matchesDepartment = departmentFilter === '' || user.department === departmentFilter;
    
    return matchesSearch && matchesRole && matchesDepartment;
  });

  const handleDelete = async (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      try {
        const response = await makeAuthenticatedRequest(`/api/admin/users/${id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          await loadUsers();
          alert('사용자가 삭제되었습니다.');
        } else {
          alert('삭제에 실패했습니다.');
        }
      } catch (error) {
        alert('삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const handleExcelDownload = () => {
    const columns: ExcelColumn[] = [
      { key: 'name', label: '이름', width: 15 },
      { key: 'email', label: '이메일', width: 25 },
      { key: 'role', label: '권한', width: 10 },
      { key: 'department', label: '부서', width: 15 },
      { key: 'position', label: '직책', width: 15 },
      { key: 'phone', label: '전화번호', width: 15 },
      { key: 'isActive', label: '상태', width: 10 },
      { key: 'createdAt', label: '등록일', width: 12 }
    ];

    const excelData = filteredUsers.map(user => ({
      ...user,
      role: getRoleText(user.role),
      isActive: user.isActive ? '활성' : '비활성',
      createdAt: new Date(user.createdAt).toLocaleDateString('ko-KR')
    }));

    const success = downloadExcel(excelData, columns, '사용자목록');
    if (!success) {
      alert('엑셀 다운로드에 실패했습니다.');
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'ADMIN': return '시스템 관리자';
      case 'MANAGER': return '관리자';
      case 'USER': return '일반 사용자';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800';
      case 'MANAGER': return 'bg-green-100 text-green-800';
      case 'USER': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">사용자/부서 관리</h1>
          <p className="mt-1 text-sm text-gray-500">시스템 사용자 및 부서 정보를 관리합니다</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleExcelDownload}
            disabled={filteredUsers.length === 0}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4 mr-2" />
            엑셀 다운로드
          </button>
          <Link
            href="/master/users/departments"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Shield className="h-4 w-4 mr-2" />
            부서 관리
          </Link>
          <Link
            href="/master/users/register"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            사용자 등록
          </Link>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="mb-4 flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="사용자명, 이메일, 부서로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <select 
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">모든 역할</option>
              <option value="ADMIN">시스템 관리자</option>
              <option value="MANAGER">관리자</option>
              <option value="USER">일반 사용자</option>
            </select>
            <select 
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">모든 부서</option>
              <option value="생산팀">생산팀</option>
              <option value="영업팀">영업팀</option>
              <option value="구매팀">구매팀</option>
              <option value="품질팀">품질팀</option>
              <option value="개발팀">개발팀</option>
              <option value="인사팀">인사팀</option>
            </select>
          </div>

          {error && (
            <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <p className="text-yellow-700">{error}</p>
            </div>
          )}

          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사용자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이메일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    부서/직책
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    역할
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    등록일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        <span className="ml-2">로딩 중...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <User className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        {users.length === 0 ? '등록된 사용자가 없습니다' : '검색 결과가 없습니다'}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {users.length === 0 ? '새로운 사용자를 등록해보세요.' : '다른 검색 조건을 시도해보세요.'}
                      </p>
                      {users.length === 0 && (
                        <div className="mt-6">
                          <Link
                            href="/master/users/register"
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            사용자 등록
                          </Link>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        {user.phone && (
                          <div className="text-sm text-gray-500">{user.phone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.department && (
                          <div className="font-medium">{user.department}</div>
                        )}
                        {user.position && (
                          <div className="text-gray-500">{user.position}</div>
                        )}
                        {!user.department && !user.position && '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                          {getRoleText(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? '활성' : '비활성'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(user._id)}
                          className="text-red-600 hover:text-red-900"
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