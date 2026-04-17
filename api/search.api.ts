import api from './axiosInstance';
import type { SearchFilters, SearchResult, Artwork } from '@/types';

export const searchApi = {
  /** Search artworks with filters */
  searchArtworks: (filters: SearchFilters) => {
    const params = new URLSearchParams();
    
    if (filters.query) params.append('query', filters.query);
    if (filters.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());
    if (filters.artworkType) params.append('artworkType', filters.artworkType);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());
    
    return api.get<SearchResult<Artwork>>(`/api/artworks/search?${params.toString()}`).then(r => r.data);
  },
  
  /** Get popular searches */
  getPopularSearches: () => 
    api.get<string[]>('/api/artworks/popular-searches').then(r => r.data),
  
  /** Get search suggestions */
  getSearchSuggestions: (query: string) =>
    api.get<string[]>(`/api/artworks/suggestions?query=${query}`).then(r => r.data),
};