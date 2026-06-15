import api from './axiosInstance';
import type { Notification, UnreadCount } from '@/types';

export const notificationsApi = {
 
  getNotifications: (page: number = 1, pageSize: number = 20) =>
    api.get<Notification[]>(`/api/notifications?page=${page}&pageSize=${pageSize}`).then(r => r.data),
  

  getUnreadCount: () =>
    api.get<UnreadCount>('/api/notifications/unread-count').then(r => r.data),
  
 
  markAsRead: (notificationId: string) =>
    api.post(`/api/notifications/${notificationId}/read`),
  
 
  markAllAsRead: () =>
    api.post('/api/notifications/mark-all-read'),
  

  deleteNotification: (notificationId: string) =>
    api.delete(`/api/notifications/${notificationId}`),
};