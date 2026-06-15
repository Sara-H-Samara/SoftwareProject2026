import api from './axiosInstance'
import type {
  Artwork,
  CreateArtworkRequest,
  UpdateArtworkRequest,
  UpdateArtworkPositionRequest,
} from '@/types'
import { buildArtworkFormData } from '@/utils/helpers'


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
 
  getMyArtworks: () =>
    api.get<Artwork[]>('/api/artworks/my').then(r => r.data),

 
  getById: (id: string) =>
    api.get<Artwork>(`/api/artworks/${id}`).then(r => r.data),

 
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

 
  update: (id: string, data: UpdateArtworkRequest) =>
    api.put<Artwork>(`/api/artworks/${id}`, data).then(r => r.data),

 
  updateImage: (id: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    console.log('📤 Update image for artwork:', id)
    console.log('  file:', file.name)
    
    return api.post<Artwork>(`/api/artworks/${id}/image`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },

  
  bulkUpdatePositions: (positions: UpdateArtworkPositionRequest[]) =>
    api.post('/api/artworks/positions', positions),

 
  delete: (id: string) =>
    api.delete(`/api/artworks/${id}`),
}