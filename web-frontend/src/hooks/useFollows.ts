// web-frontend/src/hooks/useFollows.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { followsApi } from '@/api/follows.api'
import api from '@/api/axiosInstance'
import type { ArtistStats } from '@/types'

export const followKeys = {
  all: ['follows'] as const,
  artist: (artistId: string) => [...followKeys.all, 'artist', artistId] as const,
  followers: (userId: string) => [...followKeys.all, 'followers', userId] as const,
  following: (userId: string) => [...followKeys.all, 'following', userId] as const,
}

export const statsKeys = {
  artist: (artistId: string) => ['artist-stats', artistId] as const,
}

// ── Queries ───────────────────────────────────────────────────────────────────

export function useFollowStatus(artistId: string) {
  return useQuery({
    queryKey: followKeys.artist(artistId),
    queryFn: () => followsApi.getFollowStatus(artistId),
    enabled: Boolean(artistId),
    staleTime: 0,
    retry: (failureCount, error: any) => {
      // ✅ لا تعيد المحاولة على 404
      if (error?.response?.status === 404) return false
      return failureCount < 2
    },
  })
}

export function useFollowers(userId: string, page: number = 1, pageSize: number = 20) {
  return useQuery({
    queryKey: [...followKeys.followers(userId), page, pageSize],
    queryFn: () => followsApi.getFollowers(userId, page, pageSize),
    enabled: Boolean(userId),
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 404) return false
      return failureCount < 2
    },
  })
}

export function useFollowing(userId: string, page: number = 1, pageSize: number = 20) {
  return useQuery({
    queryKey: [...followKeys.following(userId), page, pageSize],
    queryFn: () => followsApi.getFollowing(userId, page, pageSize),
    enabled: Boolean(userId),
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 404) return false
      return failureCount < 2
    },
  })
}

// ── Artist Stats ──────────────────────────────────────────────────────────────

export function useArtistStats(artistId: string) {
  return useQuery({
    queryKey: statsKeys.artist(artistId),
    queryFn: async () => {
      try {
        const response = await api.get<ArtistStats>(`/api/reviews/artist/${artistId}/stats`)
        return response.data
      } catch (error: any) {
        // ✅ إذا كان 404، أرجع null ولا تعتبره خطأ
        if (error?.response?.status === 404) {
          return null
        }
        throw error
      }
    },
    enabled: Boolean(artistId),
    staleTime: 0,
    retry: (failureCount, error: any) => {
      // ✅ لا تعيد المحاولة مطلقاً على 404
      if (error?.response?.status === 404) return false
      return failureCount < 2
    },
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useToggleFollow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (artistId: string) => followsApi.toggleFollow(artistId),
    onSuccess: (data, artistId) => {
      queryClient.setQueryData(followKeys.artist(artistId), data)
      queryClient.invalidateQueries({ queryKey: statsKeys.artist(artistId) })
      queryClient.invalidateQueries({ queryKey: followKeys.followers(artistId) })
      toast.success(data.isFollowing ? '✅ Following!' : '👋 Unfollowed')
    },
    onError: () => toast.error('Failed to update follow'),
  })
}