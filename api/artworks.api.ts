import api from './axiosInstance'
import type {
  Artwork,
  CreateArtworkRequest,
  UpdateArtworkRequest,
  UpdateArtworkPositionRequest,
} from '@/types'
import { buildArtworkFormData } from '@/utils/helpers'

// ✅ إضافة interceptor للتشخيص (يمكن إزالته بعد التأكد من العمل)
api.interceptors.request.use((config) => {
  console.log('🔍 API Request:', {
    url: config.url,
    method: config.method,
    headers: {
      ...config.headers,
      Authorization: config.headers?.Authorization ? 'Bearer [hidden]' : 'none'
    },
    data: config.data instanceof FormData ? 'FormData' : config.data
  })
  return config
})

export const artworksApi = {
  /** List all artworks for the logged-in artist (drafts + published). */
  getMyArtworks: () =>
    api.get<Artwork[]>('/api/artworks/my').then(r => r.data),

  /** Get a single artwork by ID. */
  getById: (id: string) =>
    api.get<Artwork>(`/api/artworks/${id}`).then(r => r.data),

  /** Create a new artwork with image upload (multipart/form-data). */
  create: (data: CreateArtworkRequest, imageFile: File) => {
  const formData = buildArtworkFormData(data as unknown as Record<string, unknown>, imageFile)
  
  console.log('📤 Create artwork - FormData entries:')
  for (let pair of (formData as any).entries()) {
    if (pair[0] === 'image') {
      console.log(`  ${pair[0]}: [File: ${(pair[1] as File).name}]`)
    } else {
      console.log(`  ${pair[0]}: ${pair[1]}`)
    }
  }
  
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
    console.log('📤 Update image for artwork:', id)
    console.log('  file:', file.name)
    
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