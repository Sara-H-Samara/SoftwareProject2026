import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axiosInstance';
import { useAuthStore } from '@/store/authStore';  // ← أضف هذا

export const badgeKeys = {
  all: ['badges'] as const,
  user: (userId: string) => [...badgeKeys.all, 'user', userId] as const,
};

export function useUserBadges(userId: string) {
  return useQuery({
    queryKey: badgeKeys.user(userId),
    queryFn: async () => {
      const response = await api.get<string[]>(`/api/users/${userId}/badges`);
      return response.data;
    },
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCheckBadges() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();  

  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/api/users/badges/check');
      return response.data;
    },
    onSuccess: () => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: badgeKeys.user(user.id) });
      }
    },
  });
}