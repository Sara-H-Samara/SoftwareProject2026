import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { likesApi } from '@/api/likes.api';
import Toast from 'react-native-toast-message';

export const likeKeys = {
  artwork: (artworkId: string) => ['likes', 'artwork', artworkId],
};

export function useLikeStatus(artworkId: string) {
  return useQuery({
    queryKey: likeKeys.artwork(artworkId),
    queryFn: () => likesApi.getLikeStatus(artworkId),
    enabled: !!artworkId,
  });
}

export function useToggleLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (artworkId: string) => likesApi.toggleLike(artworkId),
    onSuccess: (data, artworkId) => {
      // Update like status cache
      queryClient.setQueryData(likeKeys.artwork(artworkId), data);
      queryClient.invalidateQueries({ queryKey: likeKeys.artwork(artworkId) });
      
      // Invalidate artist stats and gallery data
      queryClient.invalidateQueries({ queryKey: ['artist-stats'] });
      queryClient.invalidateQueries({ queryKey: ['galleries'] });
      queryClient.invalidateQueries({ queryKey: ['artist-artworks'] });
      
      // ✅ CRITICAL: invalidate analytics summary
      queryClient.invalidateQueries({ queryKey: ['analytics-summary'] });
      
      Toast.show({ type: 'success', text1: data.isLiked ? 'Liked!' : 'Unliked' });
    },
    onError: (error: any) => {
      console.log('Toggle like error:', error?.response?.status, error?.response?.data);
      Toast.show({ type: 'error', text1: 'Failed to update like' });
    },
  });
}