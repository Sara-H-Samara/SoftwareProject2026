import api from './axiosInstance';
import type { FollowResponse, UserProfile } from '@/types';

export const followsApi = {
  /** Toggle follow on an artist */
  toggleFollow: (artistId: string) =>
    api.post<FollowResponse>(`/api/reviews/follow/${artistId}`).then(r => r.data),
  
  /** Get follow status for an artist */
  getFollowStatus: (artistId: string) =>
    api.get<FollowResponse>(`/api/reviews/follow-status/${artistId}`).then(r => r.data),
  
  /** Get followers of a user */
  getFollowers: (userId: string, page: number = 1, pageSize: number = 20) =>
    api.get<UserProfile[]>(`/api/reviews/followers/${userId}`, { params: { page, pageSize } }).then(r => r.data),
  
  /** Get users that a user is following */
  getFollowing: (userId: string, page: number = 1, pageSize: number = 20) =>
    api.get<UserProfile[]>(`/api/reviews/following/${userId}`, { params: { page, pageSize } }).then(r => r.data),
};