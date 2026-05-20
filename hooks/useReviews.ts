import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Toast from 'react-native-toast-message'
import { reviewsApi } from '@/api/reviews.api'
import type { CreateReviewRequest, UpdateReviewRequest, CreateCommentRequest } from '@/types'

export const reviewKeys = {
  all: ['reviews'] as const,
  artwork: (artworkId: string) => [...reviewKeys.all, 'artwork', artworkId] as const,
}

export function useArtworkReviews(artworkId: string, page: number = 1, pageSize: number = 10) {
  return useQuery({
    queryKey: [...reviewKeys.artwork(artworkId), page, pageSize],
    queryFn: () => reviewsApi.getArtworkReviews(artworkId, page, pageSize),
    enabled: Boolean(artworkId),
    staleTime: 0, // Always refetch when invalidated
  })
}

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReviewRequest) => reviewsApi.createReview(data),
    onSuccess: (_, variables) => {
      // Invalidate reviews for this artwork
      queryClient.invalidateQueries({ queryKey: reviewKeys.artwork(variables.artworkId) });
      
      // Invalidate artist stats
      queryClient.invalidateQueries({ queryKey: ['artist-stats'] });
      
      // ✅ INVALIDATE ANALYTICS SUMMARY
      queryClient.invalidateQueries({ queryKey: ['analytics-summary'] });
      
      Toast.show({ type: 'success', text1: '✨ Review submitted successfully!' });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to submit review';
      Toast.show({ type: 'error', text1: message });
    },
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ reviewId, data }: { reviewId: string; data: UpdateReviewRequest }) =>
      reviewsApi.updateReview(reviewId, data),
    onSuccess: (updatedReview) => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.artwork(updatedReview.artworkId) })
      Toast.show({ type: 'success', text1: 'Review updated!' })
    },
    onError: () => Toast.show({ type: 'error', text1: 'Failed to update review' }),
  })
}

export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (_reviewId: string) => reviewsApi.deleteReview(_reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
      Toast.show({ type: 'success', text1: 'Review deleted' });
    },
    onError: () => Toast.show({ type: 'error', text1: 'Failed to delete review' }),
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCommentRequest) => reviewsApi.createComment(data),
    onSuccess: (_, variables) => {
      if (variables.artworkId) {
        queryClient.invalidateQueries({ queryKey: reviewKeys.artwork(variables.artworkId) })
      }
      if (variables.reviewId) {
        queryClient.invalidateQueries({ queryKey: reviewKeys.all })
      }
      Toast.show({ type: 'success', text1: '💬 Comment added!' })
    },
    onError: () => Toast.show({ type: 'error', text1: 'Failed to add comment' }),
  })
}

export function useDeleteComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (commentId: string) => reviewsApi.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.all })
      Toast.show({ type: 'success', text1: 'Comment deleted' })
    },
    onError: () => Toast.show({ type: 'error', text1: 'Failed to delete comment' }),
  })
}

