import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { likesApi } from '@/api/likes.api'
import { statsKeys } from './useFollows'

export const likeKeys = {
  all: ['likes'] as const,
  artwork: (artworkId: string) => [...likeKeys.all, 'artwork', artworkId] as const,
}

export function useLikeStatus(artworkId: string) {
  return useQuery({
    queryKey: likeKeys.artwork(artworkId),
    queryFn: () => likesApi.getLikeStatus(artworkId),
    enabled: Boolean(artworkId),
    staleTime: 0,
  })
}

export function useToggleLike() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (artworkId: string) => likesApi.toggleLike(artworkId),
    onSuccess: (data, artworkId) => {
      queryClient.setQueryData(likeKeys.artwork(artworkId), data)


      queryClient.invalidateQueries({ queryKey: statsKeys.artist(artworkId) })

      toast.success(data.isLiked ? '❤️ Liked!' : '💔 Unliked')
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      toast.error(error?.response?.data?.error || 'Failed to update like')
    },
  })
}