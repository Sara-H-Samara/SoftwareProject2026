// src/api/live.api.ts
import axiosInstance from './axiosInstance'
import type {
  LiveSessionDto,
  StartSessionRequest,
  SetFeaturedArtworkRequest,
  FeaturedArtworkDto,
  AuctionWinnerDto,
  AuctionStateDto,
} from '@/types/live'

export const liveApi = {
  startSession: (data: StartSessionRequest) =>
    axiosInstance.post<LiveSessionDto>('/api/live/sessions', data).then(r => r.data),

  endSession: (sessionId: string) =>
    axiosInstance.delete(`/api/live/sessions/${sessionId}`),

  setFeaturedArtwork: (sessionId: string, data: SetFeaturedArtworkRequest) =>
    axiosInstance.post<FeaturedArtworkDto>(`/api/live/sessions/${sessionId}/featured`, data).then(r => r.data),

  closeBidding: (sessionId: string) =>
    axiosInstance.post<AuctionWinnerDto | { message: string }>(`/api/live/sessions/${sessionId}/close-bidding`).then(r => r.data),

  getActiveSession: async (artistId: string): Promise<LiveSessionDto | null> => {
    try {
      const r = await axiosInstance.get<LiveSessionDto>(
        `/api/live/artists/${artistId}/session`,
        { validateStatus: (status) => status === 200 || status === 404 }
      )
      if (r.status === 404) return null
      return r.data
    } catch {
      return null
    }
  },

  getSessionByCode: (code: string) =>
    axiosInstance.get<{ id: string; title: string; artistId: string; artistName: string; inviteCode: string }>(`/api/live/join/${code}`).then(r => r.data),

  getAuctionState: (sessionId: string, artworkId: string) =>
    axiosInstance.get<AuctionStateDto>(`/api/live/sessions/${sessionId}/artworks/${artworkId}/auction`).then(r => r.data),
}

// Legacy named exports (backward compatibility)
export const startLiveSession  = (data: StartSessionRequest) => liveApi.startSession(data)
export const endLiveSession    = (sessionId: string)         => liveApi.endSession(sessionId)
export const getActiveSession  = (artistId: string)          => liveApi.getActiveSession(artistId)
export const getAuctionState   = (sessionId: string, artworkId: string) => liveApi.getAuctionState(sessionId, artworkId)