'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, Plus, Search, Filter } from 'lucide-react';

export default function ProductionPlansPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">생산계획 관리</h1>
          <p className="mt-1 text-sm text-gray-500">생산계획을 수립하고 관리합니다</p>
        </div>
        <Link
          href="/production/plans/create"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          생산계획 등록
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="mb-4 flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="품목명, 계획번호로 검색..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <select className="px-3 py-2 border border-gray-300 rounded-md">
              <option value="">모든 상태</option>
              <option value="planned">계획됨</option>
              <option value="approved">승인됨</option>
              <option value="in_progress">진행중</option>
              <option value="completed">완료</option>
            </select>
          </div>

          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">계획번호</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">품목명</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">계획수량</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">시작일</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">완료일</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">액션</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">생산계획이 없습니다</h3>
                    <p className="mt-1 text-sm text-gray-500">새로운 생산계획을 등록해보세요.</p>
                    <div className="mt-6">
                      <Link href="/production/plans/create" className="btn-primary">
                        생산계획 등록
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