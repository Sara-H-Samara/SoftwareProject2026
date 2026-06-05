import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { artworkOfTheDayApi } from '@/api/artworkOfTheDay.api';
import toast from 'react-hot-toast';

export const artworkOfTheDayKeys = {
  all: ['artwork-of-the-day'] as const,
  today: () => [...artworkOfTheDayKeys.all, 'today'] as const,
  votes: (artworkId: string) => [...artworkOfTheDayKeys.all, 'votes', artworkId] as const,
  canVote: () => [...artworkOfTheDayKeys.all, 'can-vote'] as const,
  leaderboard: (limit: number) => [...artworkOfTheDayKeys.all, 'leaderboard', limit] as const,
};

/** Get today's featured artwork */
export function useArtworkOfTheDay() {
  return useQuery({
    queryKey: artworkOfTheDayKeys.today(),
    queryFn: artworkOfTheDayApi.getTodaysArtwork,
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: 1,
  });
}

/** Vote for an artwork */
export function useVoteForArtwork(artworkId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => artworkOfTheDayApi.voteForArtwork(artworkId),
    onSuccess: (data) => {
      queryClient.setQueryData(artworkOfTheDayKeys.votes(artworkId), data.totalVotes);
      queryClient.invalidateQueries({ queryKey: artworkOfTheDayKeys.canVote() });
      toast.success('Thank you for voting! 🎉');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'You can only vote once per week';
      toast.error(message);
    },
  });
}

/** Get total votes for an artwork */
export function useArtworkVotes(artworkId: string) {
  return useQuery({
    queryKey: artworkOfTheDayKeys.votes(artworkId),
    queryFn: () => artworkOfTheDayApi.getVotes(artworkId),
    enabled: Boolean(artworkId),
    staleTime: 1000 * 60,
  });
}

/** Check if current user can vote */
export function useCanUserVote() {
  return useQuery({
    queryKey: artworkOfTheDayKeys.canVote(),
    queryFn: artworkOfTheDayApi.canUserVote,
    staleTime: 1000 * 60,
    retry: false,
  });
}

/** Get monthly leaderboard */
export function useLeaderboard(limit: number = 10) {
  return useQuery({
    queryKey: artworkOfTheDayKeys.leaderboard(limit),
    queryFn: () => artworkOfTheDayApi.getLeaderboard(limit),
    staleTime: 1000 * 60 * 5,
  });
}