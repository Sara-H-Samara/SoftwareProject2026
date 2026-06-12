import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Toast from 'react-native-toast-message'
import { avatarApi } from '@/api/avatar.api'
import type { Avatar, UpdateAvatarRequest } from '@/types'

export const avatarKeys = {
  mine: ['avatar', 'me'] as const,
  user: (userId: string) => ['avatar', 'user', userId] as const,
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`[${label}] timed out after ${ms}ms`)), ms)
    p.then(v => { clearTimeout(t); resolve(v) }, e => { clearTimeout(t); reject(e) })
  })
}

export function useMyAvatar() {
  return useQuery({
    queryKey: avatarKeys.mine,
    queryFn: () => withTimeout(avatarApi.getMine(), 6_000, 'avatar.getMine'),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}

export function useUpdateAvatar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateAvatarRequest) =>
      withTimeout(avatarApi.upsertMine(data), 8_000, 'avatar.upsertMine'),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: avatarKeys.mine })
      const previous = queryClient.getQueryData<Avatar>(avatarKeys.mine)
      if (previous) queryClient.setQueryData<Avatar>(avatarKeys.mine, { ...previous, ...data })
      return { previous }
    },
    onError: (_err, _data, context) => {
      if (context?.previous) queryClient.setQueryData(avatarKeys.mine, context.previous)
      Toast.show({ type: 'error', text1: 'Failed to update avatar' })
    },
    onSuccess: (data) => queryClient.setQueryData(avatarKeys.mine, data),
  })
}

export function useUserAvatar(userId: string | undefined) {
  return useQuery({
    queryKey: avatarKeys.user(userId ?? ''),
    queryFn: () => withTimeout(avatarApi.getByUser(userId!), 6_000, 'avatar.getByUser'),
    enabled: !!userId,
    staleTime: 1000 * 60 * 10,
    retry: 1,
  })
}
