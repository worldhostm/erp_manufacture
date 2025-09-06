'use client';

import React from 'react';
import Link from 'next/link';
import { Users, Plus, Search, Shield, User } from 'lucide-react';

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">사용자/부서 관리</h1>
          <p className="mt-1 text-sm text-gray-500">시스템 사용자 및 부서 정보를 관리합니다</p>
        </div>
        <div className="flex space-x-3">
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
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <select className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500">
              <option value="">모든 역할</option>
              <option value="ADMIN">관리자</option>
              <option value="MANAGER">매니저</option>
              <option value="USER">일반 사용자</option>
            </select>
            <select className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500">
              <option value="">모든 부서</option>
              <option value="production">생산팀</option>
              <option value="sales">영업팀</option>
              <option value="purchase">구매팀</option>
              <option value="quality">품질팀</option>
            </select>
          </div>

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
                    마지막 로그인
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <User className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">등록된 사용자가 없습니다</h3>
                    <p className="mt-1 text-sm text-gray-500">새로운 사용자를 등록해보세요.</p>
                    <div className="mt-6">
                      <Link
                        href="/master/users/register"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        사용자 등록
                      </Link>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}