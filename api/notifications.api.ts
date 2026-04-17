import api from './axiosInstance';
import type { Notification, UnreadCount } from '@/types';

export const notificationsApi = {
  /** Get all notifications for current user */
  getNotifications: (page: number = 1, pageSize: number = 20) =>
    api.get<Notification[]>(`/api/notifications?page=${page}&pageSize=${pageSize}`).then(r => r.data),
  
  /** Get unread count */
  getUnreadCount: () =>
    api.get<UnreadCount>('/api/notifications/unread-count').then(r => r.data),
  
  /** Mark notification as read */
  markAsRead: (notificationId: string) =>
    api.post(`/api/notifications/${notificationId}/read`),
  
  /** Mark all as read */
  markAllAsRead: () =>
    api.post('/api/notifications/mark-all-read'),
  
  /** Delete notification */
  deleteNotification: (notificationId: string) =>
    api.delete(`/api/notifications/${notificationId}`),
};