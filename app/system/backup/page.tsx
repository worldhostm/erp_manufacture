'use client';

import React from 'react';
import { Database } from 'lucide-react';

export default function BackupPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">백업/복원</h1>
          <p className="mt-1 text-sm text-gray-500">데이터 백업 및 복원을 관리합니다</p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="text-center py-12">
            <Database className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">준비 중입니다</h3>
            <p className="mt-1 text-sm text-gray-500">이 기능은 현재 개발 중입니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
