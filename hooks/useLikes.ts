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
      queryClient.setQueryData(likeKeys.artwork(artworkId), data);
      Toast.show({ type: 'success', text1: data.isLiked ? 'Liked!' : 'Unliked' });
    },
    onError: (error: any) => {
      console.log('Toggle like error:', error.response?.status, error.response?.data);
      Toast.show({ type: 'error', text1: 'Failed to update like' });
    },
  });
}