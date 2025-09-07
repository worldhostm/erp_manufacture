import { authService } from './auth-service';

export interface PurchaseOrderItem {
  itemId?: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CreatePurchaseOrderRequest {
  supplierId?: string;
  supplier: string;
  orderDate: string;
  expectedDate: string;
  items: PurchaseOrderItem[];
  notes?: string;
  deliveryAddress?: string;
  terms?: string;
}

export interface PurchaseOrder {
  id: number | string;
  orderNumber: string;
  supplier: string;
  orderDate: string;
  expectedDate: string;
  status: 'PENDING' | 'APPROVED' | 'RECEIVED' | 'COMPLETED';
  totalAmount: number;
  items: PurchaseOrderItem[];
}

export interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
}

class PurchaseService {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  }

  async createPurchaseOrder(orderData: CreatePurchaseOrderRequest): Promise<PurchaseOrder> {
    try {
      const response = await authService.makeAuthenticatedRequest('/api/purchase/orders', {
        method: 'POST',
        body: JSON.stringify({
          supplierId: orderData.supplierId,
          orderDate: orderData.orderDate,
          expectedDeliveryDate: orderData.expectedDate,
          items: orderData.items.map(item => ({
            itemId: item.itemId || '507f1f77bcf86cd799439011', // Temporary ObjectId for demo
            quantity: item.quantity,
            unitPrice: item.unitPrice
          })),
          notes: orderData.notes,
          deliveryAddress: orderData.deliveryAddress,
          terms: orderData.terms
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '구매주문 생성에 실패했습니다.');
      }

      const result: ApiResponse<{ order: any }> = await response.json();
      
      // Convert API response to frontend format
      return {
        id: result.data.order._id,
        orderNumber: result.data.order.orderNumber,
        supplier: orderData.supplier,
        orderDate: orderData.orderDate,
        expectedDate: orderData.expectedDate,
        status: 'PENDING',
        totalAmount: result.data.order.totalAmount,
        items: orderData.items
      };
    } catch (error) {
      console.error('Create purchase order error:', error);
      throw error;
    }
  }

  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    try {
      const response = await authService.makeAuthenticatedRequest('/api/purchase/orders');

      if (!response.ok) {
        throw new Error('구매주문 목록을 가져오는데 실패했습니다.');
      }

      const result: ApiResponse<{ orders: any[] }> = await response.json();
      
      // Convert API response to frontend format
      return result.data.orders.map(order => ({
        id: order._id,
        orderNumber: order.orderNumber,
        supplier: order.supplier?.name || 'Unknown',
        orderDate: order.orderDate.split('T')[0],
        expectedDate: order.expectedDeliveryDate?.split('T')[0] || order.orderDate.split('T')[0],
        status: this.convertStatus(order.status),
        totalAmount: order.totalAmount,
        items: order.items.map((item: any) => ({
          itemName: item.item?.name || 'Unknown Item',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        }))
      }));
    } catch (error) {
      console.error('Get purchase orders error:', error);
      throw error;
    }
  }

  async getPurchaseOrder(id: string): Promise<PurchaseOrder> {
    try {
      const response = await authService.makeAuthenticatedRequest(`/api/purchase/orders/${id}`);

      if (!response.ok) {
        throw new Error('구매주문을 찾을 수 없습니다.');
      }

      const result: ApiResponse<{ order: any }> = await response.json();
      const order = result.data.order;
      
      return {
        id: order._id,
        orderNumber: order.orderNumber,
        supplier: order.supplier?.name || 'Unknown',
        orderDate: order.orderDate.split('T')[0],
        expectedDate: order.expectedDeliveryDate?.split('T')[0] || order.orderDate.split('T')[0],
        status: this.convertStatus(order.status),
        totalAmount: order.totalAmount,
        items: order.items.map((item: any) => ({
          itemName: item.item?.name || 'Unknown Item',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        }))
      };
    } catch (error) {
      console.error('Get purchase order error:', error);
      throw error;
    }
  }

  async updatePurchaseOrder(id: string, orderData: Partial<CreatePurchaseOrderRequest>): Promise<PurchaseOrder> {
    try {
      const response = await authService.makeAuthenticatedRequest(`/api/purchase/orders/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          supplierId: orderData.supplierId,
          orderDate: orderData.orderDate,
          expectedDeliveryDate: orderData.expectedDate,
          items: orderData.items?.map(item => ({
            itemId: item.itemId || '507f1f77bcf86cd799439011',
            quantity: item.quantity,
            unitPrice: item.unitPrice
          })),
          notes: orderData.notes,
          deliveryAddress: orderData.deliveryAddress,
          terms: orderData.terms
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '구매주문 수정에 실패했습니다.');
      }

      const result: ApiResponse<{ order: any }> = await response.json();
      const order = result.data.order;
      
      return {
        id: order._id,
        orderNumber: order.orderNumber,
        supplier: orderData.supplier || order.supplier?.name || 'Unknown',
        orderDate: orderData.orderDate || order.orderDate.split('T')[0],
        expectedDate: orderData.expectedDate || order.expectedDeliveryDate?.split('T')[0] || order.orderDate.split('T')[0],
        status: this.convertStatus(order.status),
        totalAmount: order.totalAmount,
        items: orderData.items || order.items.map((item: any) => ({
          itemName: item.item?.name || 'Unknown Item',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        }))
      };
    } catch (error) {
      console.error('Update purchase order error:', error);
      throw error;
    }
  }

  async deletePurchaseOrder(id: string): Promise<void> {
    try {
      const response = await authService.makeAuthenticatedRequest(`/api/purchase/orders/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '구매주문 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Delete purchase order error:', error);
      throw error;
    }
  }

  private convertStatus(apiStatus: string): 'PENDING' | 'APPROVED' | 'RECEIVED' | 'COMPLETED' {
    switch (apiStatus) {
      case 'DRAFT':
      case 'SENT':
        return 'PENDING';
      case 'CONFIRMED':
        return 'APPROVED';
      case 'PARTIALLY_RECEIVED':
      case 'RECEIVED':
        return 'RECEIVED';
      default:
        return 'PENDING';
    }
  }
}

export const purchaseService = new PurchaseService();