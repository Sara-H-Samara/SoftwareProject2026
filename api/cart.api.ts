import api from './axiosInstance';
import type { CheckoutRequest, CheckoutResponse } from '@/types';

export const cartApi = {
  /** Create checkout session */
  checkout: (data: CheckoutRequest) =>
    api.post<CheckoutResponse>('/api/orders/checkout', data).then(r => r.data),
  
  /** Get user orders */
  getOrders: () =>
    api.get('/api/orders').then(r => r.data),
  
  /** Get order by ID */
  getOrderById: (orderId: string) =>
    api.get(`/api/orders/${orderId}`).then(r => r.data),
};