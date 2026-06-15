import api from './axiosInstance';
import type { FollowResponse, UserProfile } from '@/types';

export const followsApi = {
 
  toggleFollow: (artistId: string) =>
    api.post<FollowResponse>(`/api/reviews/follow/${artistId}`).then(r => r.data),
  

  getFollowStatus: (artistId: string) =>
    api.get<FollowResponse>(`/api/reviews/follow-status/${artistId}`).then(r => r.data),
  
 
  getFollowers: (userId: string, page: number = 1, pageSize: number = 20) =>
    api.get<UserProfile[]>(`/api/reviews/followers/${userId}`, { params: { page, pageSize } }).then(r => r.data),
  

  getFollowing: (userId: string, page: number = 1, pageSize: number = 20) =>
    api.get<UserProfile[]>(`/api/reviews/following/${userId}`, { params: { page, pageSize } }).then(r => r.data),
};