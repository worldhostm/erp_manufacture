'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth, User } from '@/lib/auth';
import { 
  Building2, 
  Package, 
  ShoppingCart, 
  Factory, 
  Warehouse, 
  CheckCircle, 
  TrendingUp, 
  Calculator, 
  Users, 
  BarChart3, 
  Settings,
  LogOut,
  Home,
  FileText
} from 'lucide-react';

const menuItems = [
  {
    title: '대시보드',
    href: '/dashboard',
    icon: Home
  },
  {
    title: '기준정보 관리',
    icon: Building2,
    children: [
      { title: '회사정보 관리', href: '/master/companies' },
      { title: '품목/BOM 관리', href: '/master/items' },
      { title: '협력회사 관리', href: '/master/suppliers' },
      { title: '사용자/부서 관리', href: '/master/users' }
    ]
  },
  {
    title: '구매관리',
    icon: ShoppingCart,
    children: [
      { title: '구매요청 관리', href: '/purchase/requests' },
      { title: '구매주문 관리', href: '/purchase/orders' },
      { title: '입고 관리', href: '/purchase/receipts' },
      { title: '구매현황 분석', href: '/purchase/analysis' }
    ]
  },
  {
    title: '생산관리',
    icon: Factory,
    children: [
      { title: '생산계획 관리', href: '/production/plans' },
      { title: '작업지시 관리', href: '/production/work-orders' },
      { title: '생산실적 관리', href: '/production/results' },
      { title: '공정 관리', href: '/production/processes' },
      { title: '설비 관리', href: '/production/equipment' },
      { title: '작업자 관리', href: '/production/workers' }
    ]
  },
  {
    title: '재고관리',
    icon: Warehouse,
    children: [
      { title: '재고현황 조회', href: '/inventory/status' },
      { title: '출고 관리', href: '/inventory/shipments' },
      { title: '재고조정 관리', href: '/inventory/adjustments' },
      { title: '안전재고 관리', href: '/inventory/safety-stock' }
    ]
  },
  {
    title: '품질관리',
    icon: CheckCircle,
    children: [
      { title: '품질검사 관리', href: '/quality/inspections' },
      { title: '불량품 관리', href: '/quality/defects' },
      { title: '품질분석 리포트', href: '/quality/reports' }
    ]
  },
  {
    title: '판매관리',
    icon: TrendingUp,
    children: [
      { title: '수주 관리', href: '/sales/orders' },
      { title: '출하 관리', href: '/sales/shipments' },
      { title: '매출 관리', href: '/sales/revenue' },
      { title: '고객 관리', href: '/sales/customers' }
    ]
  },
  {
    title: '회계관리',
    icon: Calculator,
    children: [
      { title: '매입/매출 전표', href: '/accounting/vouchers' },
      { title: '원가 관리', href: '/accounting/costs' },
      { title: '손익 분석', href: '/accounting/profit-loss' }
    ]
  },
  {
    title: '인사관리',
    icon: Users,
    children: [
      { title: '직원 관리', href: '/hr/employees' },
      { title: '근태 관리', href: '/hr/attendance' },
      { title: '급여 관리', href: '/hr/payroll' }
    ]
  },
  {
    title: '보고서 및 분석',
    icon: BarChart3,
    children: [
      { title: '매출 분석', href: '/reports/sales' },
      { title: '생산 분석', href: '/reports/production' },
      { title: '재고 분석', href: '/reports/inventory' },
      { title: '원가 분석', href: '/reports/costs' }
    ]
  },
  {
    title: '시스템 관리',
    icon: Settings,
    children: [
      { title: '시스템 설정', href: '/system/settings' },
      { title: '백업/복원', href: '/system/backup' },
      { title: '로그 관리', href: '/system/logs' }
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const { getCurrentUser, logout } = useAuth();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    };
    loadUser();
  }, [getCurrentUser]);

  return (
    <div className="flex h-full w-64 flex-col overflow-y-auto bg-white border-r border-gray-200">
      <div className="flex items-center justify-between h-16 flex-shrink-0 px-4 bg-primary-600">
        <h1 className="text-xl font-semibold text-white">ERP System</h1>
        <button
          onClick={logout}
          className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors"
          title="로그아웃"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
      
      <div className="flex-1 px-4 py-4">
        <nav className="space-y-2">
          {menuItems.map((item) => {
            if (item.children) {
              return (
                <div key={item.title} className="space-y-1">
                  <div className="flex items-center px-2 py-2 text-sm font-medium text-gray-700">
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.title}
                  </div>
                  <div className="ml-8 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`block px-2 py-2 text-sm rounded-md transition-colors ${
                          pathname === child.href
                            ? 'bg-primary-100 text-primary-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        {child.title}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                  pathname === item.href
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex-shrink-0 p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name || 'Guest'}
            </p>
            <p className="text-sm text-gray-500 truncate">
              {user?.department} / {user?.position}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}