// src/hooks/useAvatar.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { avatarApi } from '@/api/avatar.api'
import type { Avatar, UpdateAvatarRequest } from '@/types/avatar'

export const avatarKeys = {
  mine: ['avatar', 'me'] as const,
  user: (userId: string) => ['avatar', 'user', userId] as const,
}

export function useMyAvatar() {
  return useQuery({
    queryKey: avatarKeys.mine,
    queryFn: () => avatarApi.getMine(),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}

export function useUpdateAvatar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateAvatarRequest | Avatar) => avatarApi.upsertMine(data),
    onSuccess: (data) => {
      queryClient.setQueryData(avatarKeys.mine, data)
      toast.success('Avatar updated!')
    },
    onError: () => {
      toast.error('Failed to update avatar')
    },
  })
}

export function useUserAvatar(userId: string | undefined) {
  return useQuery({
    queryKey: avatarKeys.user(userId ?? ''),
    queryFn: () => avatarApi.getByUser(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 10,
    retry: 1,
  })
}