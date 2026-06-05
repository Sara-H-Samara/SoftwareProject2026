import { useInfiniteQuery } from '@tanstack/react-query';
import { activityApi } from '@/api/activity.api';

export const activityKeys = {
  all: ['activity'] as const,
  feed: () => [...activityKeys.all, 'feed'] as const,
};

export function useActivityFeed() {
  return useInfiniteQuery({
    queryKey: activityKeys.feed(),
    queryFn: ({ pageParam = 1 }) => activityApi.getFeed(pageParam, 20),
    getNextPageParam: (lastPage) => lastPage.hasNextPage ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  });
}