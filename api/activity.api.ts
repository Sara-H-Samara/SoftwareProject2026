import api from './axiosInstance';
import type { ActivityFeedResponse } from '@/types';

export const activityApi = {
  getFeed: (page: number = 1, pageSize: number = 20) =>
    api.get<ActivityFeedResponse>(`/api/activity/feed?page=${page}&pageSize=${pageSize}`).then(r => r.data),
};