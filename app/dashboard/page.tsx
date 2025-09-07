'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-service';
import { User } from '@/lib/store/auth-store';
import { 
  ShoppingCart, 
  Factory, 
  Warehouse, 
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Package,
  Users,
  Building2,
  CheckCircle
} from 'lucide-react';

interface DashboardStat {
  name: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
}

interface RecentOrder {
  id: string;
  supplier: string;
  item: string;
  quantity: string;
  status: string;
  date: string;
}

interface WorkOrder {
  id: string;
  item: string;
  quantity: string;
  progress: number;
  dueDate: string;
  status: string;
}

const statIcons = {
  '오늘 주문': ShoppingCart,
  '생산 중인 작업': Factory,
  '재고 알림': AlertTriangle,
  '월 매출': DollarSign
};



export default function Dashboard() {
  const { user, getCurrentUser, isAuthenticated, makeAuthenticatedRequest } = useAuth();
  const [stats, setStats] = useState<(DashboardStat & { icon: any })[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && !user) {
      getCurrentUser();
    }
  }, [getCurrentUser, user, isAuthenticated]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [statsRes, ordersRes, workRes] = await Promise.all([
        makeAuthenticatedRequest('/api/dashboard/stats'),
        makeAuthenticatedRequest('/api/dashboard/recent-orders'),
        makeAuthenticatedRequest('/api/dashboard/work-orders')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        const statsWithIcons = statsData.data.map((stat: DashboardStat) => ({
          ...stat,
          icon: statIcons[stat.name as keyof typeof statIcons] || ShoppingCart
        }));
        setStats(statsWithIcons);
      }

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setRecentOrders(ordersData.data);
      }

      if (workRes.ok) {
        const workData = await workRes.json();
        setWorkOrders(workData.data);
      }
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          안녕하세요, {user?.name}님
        </h1>
        <p className="text-gray-600">오늘의 ERP 현황을 확인하세요.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <div
              key={item.name}
              className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6"
            >
              <dt>
                <div className="absolute rounded-md bg-primary-500 p-3">
                  <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <p className="ml-16 truncate text-sm font-medium text-gray-500">
                  {item.name}
                </p>
              </dt>
              <dd className="ml-16 flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
                <p
                  className={`ml-2 flex items-baseline text-sm font-semibold ${
                    item.changeType === 'positive'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {item.change}
                </p>
              </dd>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">최근 구매 주문</h3>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between animate-pulse">
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                    <div className="ml-4">
                      <div className="h-4 bg-gray-200 rounded mb-2 w-16"></div>
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{order.id}</p>
                      <p className="text-sm text-gray-500">{order.supplier} - {order.item}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900">{order.quantity}</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.status === '승인대기' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === '주문완료' ? 'bg-blue-100 text-blue-800' :
                        order.status === '확인완료' ? 'bg-purple-100 text-purple-800' :
                        order.status === '입고완료' ? 'bg-green-100 text-green-800' :
                        order.status === '취소' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">작업 진행 현황</h3>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2 animate-pulse">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-16 ml-4"></div>
                    </div>
                    <div className="h-2 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {workOrders.map((order) => (
                  <div key={order.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{order.id}</p>
                        <p className="text-sm text-gray-500">{order.item} - {order.quantity}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.status === '완료' ? 'bg-green-100 text-green-800' :
                        order.status === '진행중' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full" 
                        style={{ width: `${order.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">빠른 실행</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <a 
              href="/master/suppliers" 
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Building2 className="h-8 w-8 text-primary-600 mb-2" />
              <span className="text-sm text-gray-700">협력회사 관리</span>
            </a>
            <a 
              href="/purchase/orders" 
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ShoppingCart className="h-8 w-8 text-primary-600 mb-2" />
              <span className="text-sm text-gray-700">구매주문 관리</span>
            </a>
            <a 
              href="/production/work-orders" 
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Factory className="h-8 w-8 text-primary-600 mb-2" />
              <span className="text-sm text-gray-700">작업지시 관리</span>
            </a>
            <a 
              href="/inventory/status" 
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Warehouse className="h-8 w-8 text-primary-600 mb-2" />
              <span className="text-sm text-gray-700">재고현황 조회</span>
            </a>
            <a 
              href="/quality/inspections" 
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <CheckCircle className="h-8 w-8 text-primary-600 mb-2" />
              <span className="text-sm text-gray-700">품질검사 관리</span>
            </a>
            <a 
              href="/sales/orders" 
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <TrendingUp className="h-8 w-8 text-primary-600 mb-2" />
              <span className="text-sm text-gray-700">수주 관리</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}