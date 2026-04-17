import api from './axiosInstance';
import type { Order } from '@/types';

export const ordersApi = {
  /** Get all orders for current user */
  getMyOrders: () =>
    api.get<Order[]>('/api/orders').then(r => r.data),
  
  /** Get order by ID */
  getOrderById: (orderId: string) =>
    api.get<Order>(`/api/orders/${orderId}`).then(r => r.data),
};