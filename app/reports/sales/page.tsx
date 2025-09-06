'use client';

import { useState } from 'react';
import { Calendar, Download, TrendingUp, TrendingDown, DollarSign, Users, Package, Globe } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface SalesData {
  month: string;
  domestic: number;
  export: number;
  total: number;
}

interface CustomerData {
  name: string;
  amount: number;
  percentage: number;
}

interface ProductData {
  name: string;
  quantity: number;
  amount: number;
}

export default function SalesReportsPage() {
  const [dateRange, setDateRange] = useState('2024');
  
  const salesData: SalesData[] = [
    { month: '1월', domestic: 45000000, export: 12000000, total: 57000000 },
    { month: '2월', domestic: 52000000, export: 15000000, total: 67000000 },
    { month: '3월', domestic: 48000000, export: 18000000, total: 66000000 },
    { month: '4월', domestic: 55000000, export: 20000000, total: 75000000 },
    { month: '5월', domestic: 58000000, export: 22000000, total: 80000000 },
    { month: '6월', domestic: 62000000, export: 25000000, total: 87000000 }
  ];

  const customerData: CustomerData[] = [
    { name: '글로벌전자㈜', amount: 85000000, percentage: 35 },
    { name: '대한제조㈜', amount: 60000000, percentage: 25 },
    { name: 'Global Tech Inc.', amount: 45000000, percentage: 18 },
    { name: '신성산업㈜', amount: 30000000, percentage: 12 },
    { name: '기타', amount: 25000000, percentage: 10 }
  ];

  const productData: ProductData[] = [
    { name: '제품A', quantity: 1250, amount: 62500000 },
    { name: '제품B', quantity: 2100, amount: 105000000 },
    { name: '제품C', quantity: 850, amount: 42500000 },
    { name: '제품D', quantity: 650, amount: 32500000 },
    { name: '제품E', quantity: 450, amount: 22500000 }
  ];

  const regionData = [
    { name: '국내', value: 65, color: '#3B82F6' },
    { name: '북미', value: 20, color: '#10B981' },
    { name: '유럽', value: 10, color: '#F59E0B' },
    { name: '아시아', value: 5, color: '#EF4444' }
  ];

  const totalSales = salesData.reduce((sum, item) => sum + item.total, 0);
  const currentMonthSales = salesData[salesData.length - 1]?.total || 0;
  const previousMonthSales = salesData[salesData.length - 2]?.total || 0;
  const growthRate = previousMonthSales > 0 ? 
    ((currentMonthSales - previousMonthSales) / previousMonthSales * 100) : 0;

  const averageMonthlySales = Math.round(totalSales / salesData.length);
  const totalCustomers = customerData.length;
  const topCustomer = customerData[0];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">매출 분석</h1>
          <p className="text-gray-600">매출 현황과 추이를 분석합니다.</p>
        </div>
        <div className="flex space-x-2">
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="2024">2024년</option>
            <option value="2023">2023년</option>
            <option value="Q1-2024">2024년 1분기</option>
            <option value="Q2-2024">2024년 2분기</option>
          </select>
          <button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
            <Download className="h-4 w-4 mr-2" />
            엑셀 다운로드
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-600">누적 매출</p>
              <p className="text-2xl font-semibold text-gray-900">
                ₩{(totalSales / 100000000).toFixed(1)}억
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-600">월평균 매출</p>
              <p className="text-2xl font-semibold text-blue-600">
                ₩{(averageMonthlySales / 10000000).toFixed(0)}천만
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-600">전월 대비 증감</p>
              <p className={`text-2xl font-semibold ${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1)}%
              </p>
            </div>
            {growthRate >= 0 ? 
              <TrendingUp className="h-8 w-8 text-green-500" /> :
              <TrendingDown className="h-8 w-8 text-red-500" />
            }
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-600">주요 고객</p>
              <p className="text-lg font-semibold text-gray-900">{topCustomer.name}</p>
              <p className="text-sm text-gray-500">{topCustomer.percentage}% 비중</p>
            </div>
            <Users className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">월별 매출 추이</h3>
            <p className="text-sm text-gray-500">내수 및 수출 매출 현황</p>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${(value / 10000000).toFixed(0)}천만`} />
                <Tooltip 
                  formatter={(value: number) => [`₩${value.toLocaleString()}`, '']}
                  labelFormatter={(label) => `${label} 매출`}
                />
                <Bar dataKey="domestic" fill="#3B82F6" name="내수" />
                <Bar dataKey="export" fill="#10B981" name="수출" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">매출 성장률</h3>
            <p className="text-sm text-gray-500">월별 매출 성장 추이</p>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData.map((item, index) => ({
                ...item,
                growth: index === 0 ? 0 : ((item.total - salesData[index - 1].total) / salesData[index - 1].total * 100)
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${value.toFixed(0)}%`} />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(1)}%`, '성장률']}
                  labelFormatter={(label) => `${label} 성장률`}
                />
                <Line type="monotone" dataKey="growth" stroke="#8B5CF6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">주요 고객별 매출</h3>
            <p className="text-sm text-gray-500">상위 고객 매출 현황</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {customerData.map((customer, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{customer.name}</span>
                      <span className="text-sm text-gray-500">{customer.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full" 
                        style={{ width: `${customer.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <div className="text-sm font-medium text-gray-900">
                      ₩{(customer.amount / 10000000).toFixed(0)}천만
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">지역별 매출 비중</h3>
            <p className="text-sm text-gray-500">판매 지역 분포</p>
          </div>
          <div className="p-6">
            <div className="flex justify-center mb-4">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={regionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {regionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value}%`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {regionData.map((region, index) => (
                <div key={index} className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: region.color }}
                  />
                  <span className="text-sm text-gray-700">{region.name}</span>
                  <span className="text-sm text-gray-500 ml-auto">{region.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">제품별 매출 현황</h3>
          <p className="text-sm text-gray-500">주요 제품의 매출 및 판매량</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  순위
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  제품명
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  판매량
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  매출액
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  비중
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  트렌드
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productData.map((product, index) => {
                const percentage = (product.amount / totalSales) * 100;
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Package className="h-5 w-5 text-gray-400 mr-3" />
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {product.quantity.toLocaleString()} 개
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      ₩{product.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm text-gray-900">{percentage.toFixed(1)}%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {index < 2 ? (
                        <TrendingUp className="h-4 w-4 text-green-500 mx-auto" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500 mx-auto" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}