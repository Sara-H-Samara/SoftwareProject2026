import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
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
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateReviewRequest) => reviewsApi.createReview(data),
    onSuccess: (_, variables) => {
      // Invalidate reviews for this artwork to refresh the list
      queryClient.invalidateQueries({ queryKey: reviewKeys.artwork(variables.artworkId) })
      
      // Also invalidate artist stats since rating changed
      queryClient.invalidateQueries({ queryKey: ['artist-stats'] })
      
      toast.success('✨ Review submitted successfully!')
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to submit review'
      toast.error(message)
    },
  })
}

export function useUpdateReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ reviewId, data }: { reviewId: string; data: UpdateReviewRequest }) =>
      reviewsApi.updateReview(reviewId, data),
    onSuccess: (updatedReview) => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.artwork(updatedReview.artworkId) })
      toast.success('Review updated!')
    },
    onError: () => toast.error('Failed to update review'),
  })
}

export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (_reviewId: string) => reviewsApi.deleteReview(_reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
      toast.success('Review deleted');
    },
    onError: () => toast.error('Failed to delete review'),
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
      toast.success('💬 Comment added!')
    },
    onError: () => toast.error('Failed to add comment'),
  })
}

export function useDeleteComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (commentId: string) => reviewsApi.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.all })
      toast.success('Comment deleted')
    },
    onError: () => toast.error('Failed to delete comment'),
  })
}