import api from './axiosInstance'
import type { Artwork, ArtistGalleryInfo, GalleryListResponse } from '@/types'

export const galleriesApi = {
  getAll: (page = 1, pageSize = 12) =>
    api.get<GalleryListResponse>('/api/galleries', { params: { page, pageSize } }).then(r => r.data),

  search: (q: string, page = 1, pageSize = 12) =>
    api.get<GalleryListResponse>('/api/galleries/search', { params: { q, page, pageSize } }).then(r => r.data),

  getArtistGallery: (artistId: string) =>
    api.get<ArtistGalleryInfo>(`/api/galleries/${artistId}`).then(r => r.data),

  /** Full artwork data including 3D placement — fed directly into the Three.js scene. */
  getArtistArtworks: (artistId: string) =>
    api.get<Artwork[]>(`/api/galleries/${artistId}/artworks`).then(r => r.data),
}
