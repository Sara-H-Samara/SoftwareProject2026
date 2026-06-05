import { useQuery } from '@tanstack/react-query'
import api from '@/api/axiosInstance'

export const visitorKeys = {
  liked: ['liked-artworks'] as const,
  saved: ['saved-artworks'] as const,
  history: ['view-history'] as const,
}

export function useLikedArtworks() {
  return useQuery({
    queryKey: visitorKeys.liked,
    queryFn: async () => {
      const response = await api.get('/api/visitor/liked-artworks')
      return response.data
    },
  })
}

export function useSavedArtworks() {
  return useQuery({
    queryKey: visitorKeys.saved,
    queryFn: async () => {
      const response = await api.get('/api/visitor/saved-artworks')
      return response.data
    },
  })
}

export function useViewHistory() {
  return useQuery({
    queryKey: visitorKeys.history,
    queryFn: async () => {
      const response = await api.get('/api/visitor/view-history')
      return response.data
    },
  })
}