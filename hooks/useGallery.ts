import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { galleriesApi } from '@/api/galleries.api'

// ── Query Keys ────────────────────────────────────────────────────────────────
export const galleryKeys = {
  all: ['galleries'] as const,
  list: (page: number, pageSize: number) => [...galleryKeys.all, 'list', page, pageSize] as const,
  infinite: (pageSize: number) => [...galleryKeys.all, 'infinite', pageSize] as const,
  search: (q: string, page: number) => [...galleryKeys.all, 'search', q, page] as const,
  searchInfinite: (q: string, pageSize: number) => [...galleryKeys.all, 'searchInfinite', q, pageSize] as const,
  artist: (artistId: string) => [...galleryKeys.all, 'artist', artistId] as const,
  artistArtworks: (artistId: string) => [...galleryKeys.all, 'artist', artistId, 'artworks'] as const,
}

// ── Queries ───────────────────────────────────────────────────────────────────

/** Paginated gallery browse page. */
export function useGalleries(page = 1, pageSize = 12) {
  return useQuery({
    queryKey: galleryKeys.list(page, pageSize),
    queryFn: () => galleriesApi.getAll(page, pageSize),
    staleTime: 1000 * 60 * 5,
    placeholderData: (prev) => prev,
  })
}

/** Infinite scroll galleries */
export function useInfiniteGalleries(pageSize = 12) {
  return useInfiniteQuery({
    queryKey: galleryKeys.infinite(pageSize),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await galleriesApi.getAll(pageParam, pageSize)
      return response
    },
    getNextPageParam: (lastPage, allPages) => {
      const totalPages = Math.ceil(lastPage.totalCount / pageSize)
      const nextPage = allPages.length + 1
      return nextPage <= totalPages ? nextPage : undefined
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5,
  })
}

/** Search galleries by keyword. */
export function useSearchGalleries(q: string, page = 1) {
  return useQuery({
    queryKey: galleryKeys.search(q, page),
    queryFn: () => galleriesApi.search(q, page),
    enabled: q.trim().length >= 2,
    staleTime: 1000 * 30,
  })
}

/** Infinite scroll search galleries */
export function useInfiniteSearchGalleries(q: string, pageSize = 12) {
  return useInfiniteQuery({
    queryKey: galleryKeys.searchInfinite(q, pageSize),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await galleriesApi.search(q, pageParam)
      return response
    },
    getNextPageParam: (lastPage, allPages) => {
      const totalPages = Math.ceil(lastPage.totalCount / pageSize)
      const nextPage = allPages.length + 1
      return nextPage <= totalPages ? nextPage : undefined
    },
    initialPageParam: 1,
    enabled: q.trim().length >= 2,
    staleTime: 1000 * 30,
  })
}

/** Single artist gallery info (profile + stats). */
export function useArtistGallery(artistId: string) {
  return useQuery({
    queryKey: galleryKeys.artist(artistId),
    queryFn: () => galleriesApi.getArtistGallery(artistId),
    enabled: Boolean(artistId),
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * All published artworks for an artist — this is the payload loaded into
 * the Three.js scene. Includes full 3D placement data.
 * Cached aggressively since 3D scenes are expensive to initialise.
 */
export function useArtistArtworks(artistId: string) {
  return useQuery({
    queryKey: galleryKeys.artistArtworks(artistId),
    queryFn: () => galleriesApi.getArtistArtworks(artistId),
    enabled: Boolean(artistId),
    staleTime: 1000 * 60 * 10,
  })
}