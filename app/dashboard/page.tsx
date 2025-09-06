'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { User } from '@/lib/auth';
import { 
  ShoppingCart, 
  Factory, 
  Warehouse, 
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Package,
  Users
} from 'lucide-react';

const stats = [
  {
    name: '오늘 주문',
    value: '12',
    change: '+4.75%',
    changeType: 'positive',
    icon: ShoppingCart
  },
  {
    name: '생산 중인 작업',
    value: '8',
    change: '+1.2%',
    changeType: 'positive',
    icon: Factory
  },
  {
    name: '재고 알림',
    value: '3',
    change: '-2.02%',
    changeType: 'negative',
    icon: AlertTriangle
  },
  {
    name: '월 매출',
    value: '₩45.2M',
    change: '+12.5%',
    changeType: 'positive',
    icon: DollarSign
  }
];

const recentOrders = [
  {
    id: 'PO-2024-001',
    supplier: '㈜ABC소재',
    item: '철강 원자재',
    quantity: '500kg',
    status: '승인대기',
    date: '2024-01-15'
  },
  {
    id: 'PO-2024-002',
    supplier: '대한부품',
    item: '볼트/너트',
    quantity: '1000개',
    status: '주문완료',
    date: '2024-01-14'
  },
  {
    id: 'PO-2024-003',
    supplier: '신영화학',
    item: '도료',
    quantity: '200L',
    status: '입고완료',
    date: '2024-01-13'
  }
];

const workOrders = [
  {
    id: 'WO-2024-001',
    item: '제품A',
    quantity: '100개',
    progress: 75,
    dueDate: '2024-01-20',
    status: '진행중'
  },
  {
    id: 'WO-2024-002',
    item: '제품B',
    quantity: '200개',
    progress: 25,
    dueDate: '2024-01-25',
    status: '시작'
  },
  {
    id: 'WO-2024-003',
    item: '제품C',
    quantity: '50개',
    progress: 100,
    dueDate: '2024-01-15',
    status: '완료'
  }
];

export default function Dashboard() {
  const { getCurrentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    };
    loadUser();
  }, [getCurrentUser]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          안녕하세요, {user?.name || '사용자'}님
        </h1>
        <p className="text-gray-600">오늘의 ERP 현황을 확인하세요.</p>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">최근 구매 주문</h3>
          </div>
          <div className="p-6">
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
                      'bg-green-100 text-green-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">작업 진행 현황</h3>
          </div>
          <div className="p-6">
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
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">빠른 실행</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <ShoppingCart className="h-8 w-8 text-primary-600 mb-2" />
              <span className="text-sm text-gray-700">구매 주문</span>
            </button>
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Factory className="h-8 w-8 text-primary-600 mb-2" />
              <span className="text-sm text-gray-700">작업 지시</span>
            </button>
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Package className="h-8 w-8 text-primary-600 mb-2" />
              <span className="text-sm text-gray-700">재고 조회</span>
            </button>
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <TrendingUp className="h-8 w-8 text-primary-600 mb-2" />
              <span className="text-sm text-gray-700">판매 주문</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}