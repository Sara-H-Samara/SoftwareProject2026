import api from './axiosInstance';
import type { Review, CreateReviewRequest, UpdateReviewRequest, CreateCommentRequest, Comment } from '@/types';

export const reviewsApi = {
 
  createReview: (data: CreateReviewRequest) =>
    api.post<Review>('/api/reviews', data).then(r => r.data),
  
 
  updateReview: (reviewId: string, data: UpdateReviewRequest) =>
    api.put<Review>(`/api/reviews/${reviewId}`, data).then(r => r.data),
  

  deleteReview: (reviewId: string) =>
    api.delete(`/api/reviews/${reviewId}`),
  

  getArtworkReviews: (artworkId: string, page: number = 1, pageSize: number = 10) =>
    api.get<Review[]>(`/api/reviews/artwork/${artworkId}`, { params: { page, pageSize } }).then(r => r.data),
  
 
  createComment: (data: CreateCommentRequest) =>
    api.post<Comment>('/api/reviews/comments', data).then(r => r.data),
  
 
  deleteComment: (commentId: string) =>
    api.delete(`/api/reviews/comments/${commentId}`),
};