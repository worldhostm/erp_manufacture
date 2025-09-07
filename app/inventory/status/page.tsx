'use client';

import { useState, useEffect } from 'react';
import { Search, AlertTriangle, Package, TrendingDown, TrendingUp, Filter, Download } from 'lucide-react';
import { downloadExcel, ExcelColumn } from '@/lib/excel';

interface InventoryItem {
  id: number;
  itemCode: string;
  itemName: string;
  category: string;
  warehouse: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  unit: string;
  minStock: number;
  maxStock: number;
  averageCost: number;
  totalValue: number;
  lastMovement: string;
  movementType: 'IN' | 'OUT';
}

export default function InventoryStatusPage() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [stockFilter, setStockFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/inventory/status-list');
      
      if (response.ok) {
        const result = await response.json();
        const formattedData = result.data.map((item: any, index: number) => ({
          id: index + 1,
          itemCode: item.itemCode,
          itemName: item.itemName,
          category: item.category,
          warehouse: item.warehouse,
          currentStock: item.currentStock,
          reservedStock: item.reservedStock,
          availableStock: item.availableStock,
          unit: item.unit,
          minStock: item.minStock,
          maxStock: item.maxStock,
          averageCost: item.averageCost,
          totalValue: item.totalValue,
          lastMovement: item.lastMovement,
          movementType: item.movementType as 'IN' | 'OUT'
        }));
        setInventoryItems(formattedData);
      } else {
        console.error('Failed to fetch inventory data');
        // Keep empty array on error - will show no data message
      }
    } catch (error) {
      console.error('Error fetching inventory data:', error);
      // Keep empty array on error - will show no data message
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.itemCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWarehouse = warehouseFilter === 'ALL' || item.warehouse === warehouseFilter;
    const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
    
    let matchesStock = true;
    if (stockFilter === 'LOW') {
      matchesStock = item.currentStock <= item.minStock;
    } else if (stockFilter === 'HIGH') {
      matchesStock = item.currentStock >= item.maxStock * 0.8;
    } else if (stockFilter === 'NORMAL') {
      matchesStock = item.currentStock > item.minStock && item.currentStock < item.maxStock * 0.8;
    }
    
    return matchesSearch && matchesWarehouse && matchesCategory && matchesStock;
  });

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock <= item.minStock) {
      return { status: 'LOW', color: 'bg-red-100 text-red-800', text: '부족' };
    } else if (item.currentStock >= item.maxStock * 0.8) {
      return { status: 'HIGH', color: 'bg-blue-100 text-blue-800', text: '과다' };
    } else {
      return { status: 'NORMAL', color: 'bg-green-100 text-green-800', text: '적정' };
    }
  };

  const totalValue = filteredItems.reduce((sum, item) => sum + item.totalValue, 0);
  const lowStockItems = inventoryItems.filter(item => item.currentStock <= item.minStock).length;
  const totalItems = inventoryItems.length;

  const handleExcelDownload = () => {
    const columns: ExcelColumn[] = [
      { key: 'itemName', label: '품목명', width: 25 },
      { key: 'itemCode', label: '품목코드', width: 12 },
      { key: 'category', label: '카테고리', width: 12 },
      { key: 'warehouse', label: '창고', width: 15 },
      { key: 'currentStock', label: '현재고', width: 12 },
      { key: 'reservedStock', label: '예약재고', width: 12 },
      { key: 'availableStock', label: '가용재고', width: 12 },
      { key: 'unit', label: '단위', width: 8 },
      { key: 'minStock', label: '안전재고', width: 12 },
      { key: 'maxStock', label: '최대재고', width: 12 },
      { key: 'stockStatus', label: '재고상태', width: 10 },
      { key: 'totalValue', label: '총 가치', width: 15 },
      { key: 'lastMovement', label: '최근이동일', width: 12 },
      { key: 'movementType', label: '이동유형', width: 10 }
    ];

    const excelData = filteredItems.map(item => {
      const stockStatus = getStockStatus(item);
      return {
        ...item,
        currentStock: `${item.currentStock.toLocaleString()} ${item.unit}`,
        reservedStock: `${item.reservedStock.toLocaleString()} ${item.unit}`,
        availableStock: `${item.availableStock.toLocaleString()} ${item.unit}`,
        minStock: `${item.minStock.toLocaleString()} ${item.unit}`,
        maxStock: `${item.maxStock.toLocaleString()} ${item.unit}`,
        stockStatus: stockStatus.text,
        totalValue: `₩${item.totalValue.toLocaleString()}`,
        movementType: item.movementType === 'IN' ? '입고' : '출고'
      };
    });

    const success = downloadExcel(excelData, columns, '재고현황목록');
    if (!success) {
      alert('엑셀 다운로드 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">재고현황 조회</h1>
          <p className="text-gray-600">실시간 재고 현황을 조회하고 관리합니다.</p>
        </div>
        <button
          onClick={handleExcelDownload}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <Download className="h-4 w-4 mr-2" />
          엑셀 다운로드
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-600">총 품목 수</p>
              {loading ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mt-1"></div>
              ) : (
                <p className="text-2xl font-semibold text-gray-900">{totalItems}</p>
              )}
            </div>
            <Package className="h-8 w-8 text-primary-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-600">재고 부족 품목</p>
              {loading ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mt-1"></div>
              ) : (
                <p className="text-2xl font-semibold text-red-600">{lowStockItems}</p>
              )}
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-600">총 재고 가치</p>
              {loading ? (
                <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mt-1"></div>
              ) : (
                <p className="text-2xl font-semibold text-gray-900">₩{totalValue.toLocaleString()}</p>
              )}
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-600">가용 재고율</p>
              {loading ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mt-1"></div>
              ) : (
                <p className="text-2xl font-semibold text-blue-600">
                  {inventoryItems.length > 0 ? 
                    Math.round((inventoryItems.reduce((sum, item) => sum + item.availableStock, 0) / 
                    inventoryItems.reduce((sum, item) => sum + item.currentStock, 0)) * 100) : 0}%
                </p>
              )}
            </div>
            <TrendingDown className="h-8 w-8 text-blue-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="품목명 또는 품목코드로 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="flex space-x-2">
              <select 
                value={warehouseFilter}
                onChange={(e) => setWarehouseFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="ALL">전체 창고</option>
                <option value="본사창고">본사창고</option>
                <option value="완제품창고">완제품창고</option>
                <option value="화학물질창고">화학물질창고</option>
              </select>
              <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="ALL">전체 카테고리</option>
                <option value="원자재">원자재</option>
                <option value="부품">부품</option>
                <option value="완제품">완제품</option>
              </select>
              <select 
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="ALL">전체 재고</option>
                <option value="LOW">재고 부족</option>
                <option value="NORMAL">적정 재고</option>
                <option value="HIGH">과다 재고</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="min-w-full">
              <div className="bg-gray-50 p-6">
                <div className="grid grid-cols-10 gap-4">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              </div>
              <div className="bg-white">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-6 border-b border-gray-200">
                    <div className="grid grid-cols-10 gap-4">
                      {Array.from({ length: 10 }).map((_, j) => (
                        <div key={j} className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    품목정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    카테고리
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    창고
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    현재고
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    예약재고
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    가용재고
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    안전재고
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    재고상태
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    총 가치
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    최근이동
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => {
                  const stockStatus = getStockStatus(item);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.itemName}</div>
                          <div className="text-sm text-gray-500">{item.itemCode}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.warehouse}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                        {item.currentStock.toLocaleString()} {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {item.reservedStock.toLocaleString()} {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                        {item.availableStock.toLocaleString()} {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {item.minStock.toLocaleString()} {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                          {stockStatus.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                        ₩{item.totalValue.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center">
                          {item.movementType === 'IN' ? (
                            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                          )}
                          <span className="text-xs text-gray-500">{item.lastMovement}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        
        {!loading && filteredItems.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">검색 결과가 없습니다</h3>
            <p className="mt-1 text-sm text-gray-500">
              다른 검색 조건을 시도해보세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}