import { useState, useEffect } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { searchApi } from '@/api/search.api';
import type { SearchFilters } from '@/types';

export const searchKeys = {
  all: ['search'] as const,
  results: (filters: SearchFilters) => [...searchKeys.all, 'results', filters] as const,
  infinite: (filters: Omit<SearchFilters, 'page'>) => [...searchKeys.all, 'infinite', filters] as const,
  suggestions: (query: string) => [...searchKeys.all, 'suggestions', query] as const,
  popular: () => [...searchKeys.all, 'popular'] as const,
};

// ── Search Results ────────────────────────────────────────────────────────────

export function useSearch(filters: SearchFilters) {
  return useQuery({
    queryKey: searchKeys.results(filters),
    queryFn: () => searchApi.searchArtworks(filters),
    enabled: true,
    staleTime: 1000 * 30,
  });
}

// ── Infinite Scroll Search ───────────────────────────────────────────────────

export function useInfiniteSearch(filters: Omit<SearchFilters, 'page'>) {
  const pageSize = filters.pageSize || 12;
  
  return useInfiniteQuery({
    queryKey: searchKeys.infinite(filters),
    queryFn: ({ pageParam = 1 }) => 
      searchApi.searchArtworks({ ...filters, page: pageParam, pageSize }),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasNextPage ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 1000 * 30,
  });
}

// ── Search Suggestions ────────────────────────────────────────────────────────

export function useSearchSuggestions(query: string) {
  const debouncedQuery = useDebounce(query, 300);
  
  return useQuery({
    queryKey: searchKeys.suggestions(debouncedQuery),
    queryFn: () => searchApi.getSearchSuggestions(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 1000 * 60,
  });
}

export function usePopularSearches() {
  return useQuery({
    queryKey: searchKeys.popular(),
    queryFn: () => searchApi.getPopularSearches(),
    staleTime: 1000 * 60 * 5,
  });
}

// ── Debounce Hook ────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return debouncedValue;
}