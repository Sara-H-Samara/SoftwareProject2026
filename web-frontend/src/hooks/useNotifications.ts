import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { notificationsApi } from '@/api/notifications.api';
import { useAuthStore } from '@/store/authStore';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (page: number) => [...notificationKeys.all, 'list', page] as const,
  unread: () => [...notificationKeys.all, 'unread'] as const,
};

export function useNotifications(page: number = 1) {
  const { isAuthenticated } = useAuthStore();
  
  return useQuery({
    queryKey: notificationKeys.list(page),
    queryFn: () => notificationsApi.getNotifications(page),
    enabled: isAuthenticated, 
    staleTime: 1000 * 30,
    retry: false, 
  });
}
export function useUnreadCount() {
  const { isAuthenticated } = useAuthStore();
  
  return useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: () => notificationsApi.getUnreadCount(),
    enabled: isAuthenticated, 
    staleTime: 1000 * 30,
    refetchInterval: isAuthenticated ? 10000 : false, 
    retry: false,
  });
}
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => notificationsApi.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      toast.success('All notifications marked as read');
    },
    onError: () => toast.error('Failed to mark all as read'),
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => notificationsApi.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      toast.success('Notification deleted');
    },
    onError: () => toast.error('Failed to delete notification'),
  });
}