'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Download, Users, Filter } from 'lucide-react';
import { downloadExcel, ExcelColumn } from '@/lib/excel';
import { useAuth } from '@/lib/auth-service';

interface Employee {
  _id: string;
  employeeNumber: string;
  name: string;
  nameEng?: string;
  email: string;
  phone?: string;
  department: string;
  position: string;
  rank?: string;
  hireDate: string;
  birthDate?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED';
  manager?: {
    name: string;
    employeeNumber: string;
  };
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  const { makeAuthenticatedRequest, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    loadEmployees();
    loadDepartments();
  }, [isAuthenticated, departmentFilter, statusFilter]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams({
        ...(departmentFilter && { department: departmentFilter }),
        ...(statusFilter && statusFilter !== 'ALL' && { status: statusFilter }),
        limit: '50'
      });

      const response = await makeAuthenticatedRequest(`/api/employees?${queryParams}`);
      
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.data.employees);
      } else {
        throw new Error('직원 데이터를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      console.error('Load employees error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/employees/departments/list');
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.data.departments);
      }
    } catch (error) {
      console.error('Load departments error:', error);
    }
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = searchTerm === '' || 
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.nameEng && employee.nameEng.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      try {
        const response = await makeAuthenticatedRequest(`/api/employees/${id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          await loadEmployees();
          alert('직원이 삭제되었습니다.');
        } else {
          alert('삭제에 실패했습니다.');
        }
      } catch (error) {
        alert('삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData(e.target as HTMLFormElement);
    const employeeData = {
      name: formData.get('name') as string,
      nameEng: formData.get('nameEng') as string || undefined,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string || undefined,
      department: formData.get('department') as string,
      position: formData.get('position') as string,
      rank: formData.get('rank') as string || undefined,
      hireDate: formData.get('hireDate') as string || new Date().toISOString().split('T')[0],
      birthDate: formData.get('birthDate') as string || undefined,
      gender: formData.get('gender') as string || undefined,
      status: formData.get('status') as string || 'ACTIVE',
    };

    try {
      const url = editingEmployee ? `/api/employees/${editingEmployee._id}` : '/api/employees';
      const method = editingEmployee ? 'PUT' : 'POST';
      
      const response = await makeAuthenticatedRequest(url, {
        method,
        body: JSON.stringify(employeeData)
      });

      if (response.ok) {
        await loadEmployees();
        setShowModal(false);
        setEditingEmployee(null);
        alert(editingEmployee ? '직원 정보가 수정되었습니다.' : '직원이 등록되었습니다.');
      } else {
        const errorData = await response.json();
        alert(errorData.message || '저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleExcelDownload = () => {
    const columns: ExcelColumn[] = [
      { key: 'employeeNumber', label: '사원번호', width: 15 },
      { key: 'name', label: '이름', width: 15 },
      { key: 'nameEng', label: '영문명', width: 20 },
      { key: 'department', label: '부서', width: 15 },
      { key: 'position', label: '직책', width: 15 },
      { key: 'rank', label: '직급', width: 10 },
      { key: 'email', label: '이메일', width: 25 },
      { key: 'phone', label: '전화번호', width: 15 },
      { key: 'hireDate', label: '입사일', width: 12 },
      { key: 'status', label: '상태', width: 10 }
    ];

    const success = downloadExcel(filteredEmployees, columns, '직원목록');
    if (!success) {
      alert('엑셀 다운로드에 실패했습니다.');
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '재직';
      case 'INACTIVE': return '비활성';
      case 'ON_LEAVE': return '휴직';
      case 'TERMINATED': return '퇴직';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      case 'ON_LEAVE': return 'bg-yellow-100 text-yellow-800';
      case 'TERMINATED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">직원 관리</h1>
          <p className="text-gray-600">회사 직원 정보를 관리합니다.</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleExcelDownload}
            disabled={filteredEmployees.length === 0}
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
            직원 등록
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
                placeholder="이름, 사원번호, 이메일로 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="min-w-[150px]">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">전체 부서</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div className="min-w-[120px]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="ALL">전체 상태</option>
                <option value="ACTIVE">재직</option>
                <option value="INACTIVE">비활성</option>
                <option value="ON_LEAVE">휴직</option>
                <option value="TERMINATED">퇴직</option>
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
              <button 
                onClick={loadEmployees}
                className="mt-2 text-primary-600 hover:text-primary-800"
              >
                다시 시도
              </button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사원번호
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이름
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    부서
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    직책
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이메일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    전화번호
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
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                      등록된 직원이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((employee) => (
                    <tr key={employee._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {employee.employeeNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                        {employee.nameEng && (
                          <div className="text-sm text-gray-500">{employee.nameEng}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.position}
                        {employee.rank && (
                          <div className="text-sm text-gray-500">{employee.rank}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.phone || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(employee.status)}`}>
                          {getStatusText(employee.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(employee)}
                          className="text-primary-600 hover:text-primary-900 mr-3"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(employee._id)}
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
          )}
        </div>
      </div>

      {/* 직원 등록/수정 모달 */}
      {showModal && (
        <EmployeeModal
          employee={editingEmployee}
          onClose={() => {
            setShowModal(false);
            setEditingEmployee(null);
          }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

interface EmployeeModalProps {
  employee: Employee | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

function EmployeeModal({ employee, onClose, onSubmit }: EmployeeModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {employee ? '직원 정보 수정' : '신규 직원 등록'}
          </h3>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                defaultValue={employee?.name}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                영문명
              </label>
              <input
                type="text"
                name="nameEng"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                defaultValue={employee?.nameEng}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이메일 <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                defaultValue={employee?.email}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                전화번호
              </label>
              <input
                type="tel"
                name="phone"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                defaultValue={employee?.phone}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                부서 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="department"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                defaultValue={employee?.department}
                placeholder="예: 개발팀, 영업팀, 인사팀"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                직책 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="position"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                defaultValue={employee?.position}
                placeholder="예: 개발자, 팀장, 대리"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                직급
              </label>
              <input
                type="text"
                name="rank"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                defaultValue={employee?.rank}
                placeholder="예: 주임, 대리, 과장"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                입사일
              </label>
              <input
                type="date"
                name="hireDate"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                defaultValue={employee?.hireDate ? employee.hireDate.split('T')[0] : new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                생년월일
              </label>
              <input
                type="date"
                name="birthDate"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                defaultValue={employee?.birthDate ? employee.birthDate.split('T')[0] : ''}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                성별
              </label>
              <select
                name="gender"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                defaultValue={employee?.gender || ''}
              >
                <option value="">선택하세요</option>
                <option value="MALE">남성</option>
                <option value="FEMALE">여성</option>
                <option value="OTHER">기타</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                상태
              </label>
              <select
                name="status"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                defaultValue={employee?.status || 'ACTIVE'}
              >
                <option value="ACTIVE">재직</option>
                <option value="INACTIVE">비활성</option>
                <option value="ON_LEAVE">휴직</option>
                <option value="TERMINATED">퇴직</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              {employee ? '수정' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
