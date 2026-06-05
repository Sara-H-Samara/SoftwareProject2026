import api from './axiosInstance'
import type {
  Artwork,
  CreateArtworkRequest,
  UpdateArtworkRequest,
  UpdateArtworkPositionRequest,
} from '@/types'

export const artworksApi = {
  /** List all artworks for the logged-in artist (drafts + published). */
  getMyArtworks: () =>
    api.get<Artwork[]>('/api/artworks/my').then(r => r.data),

  /** Get a single artwork by ID. */
  getById: (id: string) =>
    api.get<Artwork>(`/api/artworks/${id}`).then(r => r.data),

  /** Create a new artwork with image upload (multipart/form-data). */
  create: (data: CreateArtworkRequest, imageFile: File) => {
    const formData = new FormData()
    
    formData.append('Title', data.title)
    formData.append('ArtworkType', data.artworkType)
    if (data.description) formData.append('Description', data.description)
    if (data.materials) formData.append('Materials', data.materials)
    if (data.dimensions) formData.append('Dimensions', data.dimensions)
    if (data.year) formData.append('Year', data.year.toString())
    if (data.price) formData.append('Price', data.price.toString())
    
    // ✅ 3D placement fields
    if (data.positionX !== undefined) formData.append('PositionX', data.positionX.toString())
    if (data.positionY !== undefined) formData.append('PositionY', data.positionY.toString())
    if (data.positionZ !== undefined) formData.append('PositionZ', data.positionZ.toString())
    if (data.rotationX !== undefined) formData.append('RotationX', data.rotationX.toString())
    if (data.rotationY !== undefined) formData.append('RotationY', data.rotationY.toString())
    if (data.rotationZ !== undefined) formData.append('RotationZ', data.rotationZ.toString())
    if (data.scaleX !== undefined) formData.append('ScaleX', data.scaleX.toString())
    if (data.scaleY !== undefined) formData.append('ScaleY', data.scaleY.toString())
    if (data.scaleZ !== undefined) formData.append('ScaleZ', data.scaleZ.toString())
    
    formData.append('ImageFile', imageFile)
    
    return api.post<Artwork>('/api/artworks', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },

  /** Update artwork metadata. */
  update: (id: string, data: UpdateArtworkRequest) =>
    api.put<Artwork>(`/api/artworks/${id}`, data).then(r => r.data),

  /** Replace the artwork's image file. */
  updateImage: (id: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    
    return api.post<Artwork>(`/api/artworks/${id}/image`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },

  /** Bulk-save 3D positions from the layout editor. */
  bulkUpdatePositions: (positions: UpdateArtworkPositionRequest[]) =>
    api.post('/api/artworks/positions', positions),

  /** Delete an artwork. */
  delete: (id: string) =>
    api.delete(`/api/artworks/${id}`),
}