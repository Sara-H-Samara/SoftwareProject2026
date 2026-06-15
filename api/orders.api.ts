import api from './axiosInstance';
import type { Order } from '@/types';

export const ordersApi = {
  
  getMyOrders: () =>
    api.get<Order[]>('/api/orders').then(r => r.data),
  
 
  getOrderById: (orderId: string) =>
    api.get<Order>(`/api/orders/${orderId}`).then(r => r.data),
};