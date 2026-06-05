import api from './axiosInstance';
import type { Artwork } from '@/types';

export interface VoteResponse {
  totalVotes: number;
}

export interface CanVoteResponse {
  canVote: boolean;
}

export const artworkOfTheDayApi = {
  /** Get today's featured artwork */
  getTodaysArtwork: () =>
    api.get<Artwork>('/api/artworks/artwork-of-the-day').then(r => r.data),
  
  /** Vote for an artwork */
  voteForArtwork: (artworkId: string) =>
    api.post<VoteResponse>(`/api/artworks/${artworkId}/vote`).then(r => r.data),
  
  getVotes: (artworkId: string) =>
    api.get<{ totalVotes: number }>(`/api/artworks/${artworkId}/votes`).then(r => r.data.totalVotes),
  
  /** Check if current user can vote */
  canUserVote: () =>
    api.get<CanVoteResponse>('/api/artworks/user/can-vote').then(r => r.data),
  
  /** Get monthly leaderboard */
  getLeaderboard: (limit: number = 10) =>
    api.get<Artwork[]>(`/api/artworks/leaderboard?limit=${limit}`).then(r => r.data),
};