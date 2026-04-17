import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Toast from 'react-native-toast-message'
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
    staleTime: 0, // Always refetch when invalidated
  })
}

export function useFollowers(userId: string, page: number = 1, pageSize: number = 20) {
  return useQuery({
    queryKey: [...followKeys.followers(userId), page, pageSize],
    queryFn: () => followsApi.getFollowers(userId, page, pageSize),
    enabled: Boolean(userId),
  })
}

export function useFollowing(userId: string, page: number = 1, pageSize: number = 20) {
  return useQuery({
    queryKey: [...followKeys.following(userId), page, pageSize],
    queryFn: () => followsApi.getFollowing(userId, page, pageSize),
    enabled: Boolean(userId),
  })
}

// ── Artist Stats ──────────────────────────────────────────────────────────────

export function useArtistStats(artistId: string) {
  return useQuery({
    queryKey: statsKeys.artist(artistId),
    queryFn: async () => {
      const response = await api.get<ArtistStats>(`/api/reviews/artist/${artistId}/stats`)
      return response.data
    },
    enabled: Boolean(artistId),
    staleTime: 0, // Always refetch when invalidated
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useToggleFollow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (artistId: string) => followsApi.toggleFollow(artistId),
    onSuccess: (data, artistId) => {
      // Update the cache immediately
      queryClient.setQueryData(followKeys.artist(artistId), data)
      
      // Invalidate artist stats since follower count changed
      queryClient.invalidateQueries({ queryKey: statsKeys.artist(artistId) })
      
      // Invalidate followers/following lists
      queryClient.invalidateQueries({ queryKey: followKeys.followers(artistId) })
      
      Toast.show({ type: 'success', text1: data.isFollowing ? '✅ Following!' : '👋 Unfollowed' })
    },
    onError: () => Toast.show({ type: 'error', text1: 'Failed to update follow' }),
  })
}