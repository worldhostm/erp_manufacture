'use client';

import React from 'react';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Package, Calendar, Download } from 'lucide-react';

export default function PurchaseAnalysisPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">구매현황 분석</h1>
          <p className="mt-1 text-sm text-gray-500">구매 데이터를 분석하고 인사이트를 제공합니다</p>
        </div>
        <div className="flex space-x-3">
          <select className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500">
            <option value="month">월별</option>
            <option value="quarter">분기별</option>
            <option value="year">연별</option>
          </select>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Download className="h-4 w-4 mr-2" />
            리포트 다운로드
          </button>
        </div>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">총 구매금액</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">₩0</div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <TrendingUp className="self-center flex-shrink-0 h-4 w-4 text-green-500" />
                      <span className="sr-only">증가</span>
                      0%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">구매건수</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">0</div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <TrendingUp className="self-center flex-shrink-0 h-4 w-4 text-green-500" />
                      <span className="sr-only">증가</span>
                      0%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">평균 단가</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">₩0</div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-red-600">
                      <TrendingDown className="self-center flex-shrink-0 h-4 w-4 text-red-500" />
                      <span className="sr-only">감소</span>
                      0%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">평균 리드타임</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">0일</div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <TrendingDown className="self-center flex-shrink-0 h-4 w-4 text-green-500" />
                      <span className="sr-only">개선</span>
                      0%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">월별 구매금액 추이</h3>
            <div className="h-80 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-center">
                <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">차트 준비중</h3>
                <p className="mt-1 text-sm text-gray-500">구매 데이터가 수집되면 차트가 표시됩니다</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">카테고리별 구매분석</h3>
            <div className="h-80 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-center">
                <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">차트 준비중</h3>
                <p className="mt-1 text-sm text-gray-500">구매 데이터가 수집되면 차트가 표시됩니다</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg lg:col-span-2">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">주요 협력업체별 구매현황</h3>
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      업체명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      구매금액
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      구매건수
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      점유율
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      평균 리드타임
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      <p className="text-sm">구매 데이터가 없습니다</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}