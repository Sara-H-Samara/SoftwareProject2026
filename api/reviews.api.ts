import api from './axiosInstance';
import type { Review, CreateReviewRequest, UpdateReviewRequest, CreateCommentRequest, Comment } from '@/types';

export const reviewsApi = {
  // ── Reviews ────────────────────────────────────────────────────────────────
  
  /** Create a new review for an artwork */
  createReview: (data: CreateReviewRequest) =>
    api.post<Review>('/api/reviews', data).then(r => r.data),
  
  /** Update an existing review */
  updateReview: (reviewId: string, data: UpdateReviewRequest) =>
    api.put<Review>(`/api/reviews/${reviewId}`, data).then(r => r.data),
  
  /** Delete a review */
  deleteReview: (reviewId: string) =>
    api.delete(`/api/reviews/${reviewId}`),
  
  /** Get reviews for an artwork (public) */
  getArtworkReviews: (artworkId: string, page: number = 1, pageSize: number = 10) =>
    api.get<Review[]>(`/api/reviews/artwork/${artworkId}`, { params: { page, pageSize } }).then(r => r.data),
  
  // ── Comments ────────────────────────────────────────────────────────────────
  
  /** Create a comment on a review or artwork */
  createComment: (data: CreateCommentRequest) =>
    api.post<Comment>('/api/reviews/comments', data).then(r => r.data),
  
  /** Delete a comment */
  deleteComment: (commentId: string) =>
    api.delete(`/api/reviews/comments/${commentId}`),
};