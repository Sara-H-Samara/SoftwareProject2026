import api from './axiosInstance'
import type { SearchFilters, SearchResult, Artwork } from '@/types'

export const searchApi = {

  searchArtworks: (filters: SearchFilters) =>
    api.get<SearchResult<Artwork>>('/api/artworks/search', {
      params: {
        ...(filters.query && { query: filters.query }),
        ...(filters.minPrice !== undefined && { minPrice: filters.minPrice }),
        ...(filters.maxPrice !== undefined && { maxPrice: filters.maxPrice }),
        ...(filters.artworkType && { artworkType: filters.artworkType }),
        ...(filters.sortBy && { sortBy: filters.sortBy }),
        ...(filters.page && { page: filters.page }),
        ...(filters.pageSize && { pageSize: filters.pageSize }),
      },
    }).then(r => r.data),

  getPopularSearches: () =>
    api.get<string[]>('/api/artworks/popular-searches').then(r => r.data),

  getSearchSuggestions: (query: string) =>
    api.get<string[]>('/api/artworks/suggestions', { params: { query } }).then(r => r.data),
}