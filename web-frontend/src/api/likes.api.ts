import api from './axiosInstance';
import type { LikeResponse } from '@/types';

export const likesApi = {
  /** Toggle like on an artwork */
  toggleLike: (artworkId: string) =>
    api.post<LikeResponse>(`/api/reviews/artwork/${artworkId}/like`).then(r => r.data),
  
  /** Get like status for an artwork */
  getLikeStatus: (artworkId: string) =>
    api.get<LikeResponse>(`/api/reviews/artwork/${artworkId}/like-status`).then(r => r.data),
};