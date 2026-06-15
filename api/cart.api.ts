import api from './axiosInstance';
import type { CheckoutRequest, CheckoutResponse } from '@/types';

export const cartApi = {
  
  checkout: (data: CheckoutRequest) =>
    api.post<CheckoutResponse>('/api/orders/checkout', data).then(r => r.data),
  
 
  getOrders: () =>
    api.get('/api/orders').then(r => r.data),
  

  getOrderById: (orderId: string) =>
    api.get(`/api/orders/${orderId}`).then(r => r.data),
};