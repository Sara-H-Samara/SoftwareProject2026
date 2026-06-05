import api from './axiosInstance'
import type { DescriptionPrompt, InspirationPrompt } from '@/types'

export interface ArtworkForAnalysis {
  id: string
  title: string
  artworkType: string
  description?: string
  materials?: string
  dimensions?: string
  year?: number
  price?: number
  colorMood?: string
  visualStyle?: string
  subject?: string
  mood?: string
  dominantColors?: string
  isVisuallyAnalyzed?: boolean
}

export interface WallSegment {
  wallId: 'front' | 'back' | 'left' | 'right'
  label: string
  positionCount: number
  startX: number
  startZ: number
  endX: number
  endZ: number
}

export interface GalleryLayoutInfo {
  roomWidth: number
  roomDepth: number
  wallHeight: number
  shape: string
  totalWallPositions: number
  wallSegments: WallSegment[]
}

export interface ArtworkPlacement {
  artworkId: string
  positionX: number
  positionY: number
  positionZ: number
  rotationY: number
  wallId: string
  placementReason: string
}

export interface ArrangeArtworksResponse {
  placements: ArtworkPlacement[]
  explanation: string
}

export interface SuggestTitleRequest {
  description?: string
  artworkType?: string
  materials?: string
  additionalContext?: string
  imageUrl?: string
}

export interface AnalyzeImageRequest {
  imageUrl: string
  artworkType?: string
}

export interface AnalyzeImageResponse {
  suggestedTitle: string
  suggestedDescription: string
  suggestedMaterials?: string
  suggestedArtworkType?: string
  suggestedPrice?: number
  colorMood?: string
  visualStyle?: string
  subject?: string
  mood?: string
  titleAlternatives: string[]
}

export const aiApi = {
  suggestDescription: (prompt: DescriptionPrompt) =>
    api.post<{ description: string }>('/api/ai/describe-artwork', prompt)
      .then(r => r.data.description),

  getInspiration: (prompt: InspirationPrompt) =>
    api.post<{ ideas: string }>('/api/ai/inspire', prompt)
      .then(r => r.data.ideas),

  arrangeArtworks: (data: { artworks: ArtworkForAnalysis[]; galleryLayout: GalleryLayoutInfo }) =>
    api.post<ArrangeArtworksResponse>('/api/ai/arrange-artworks', data)
      .then(r => r.data),

  suggestTitles: (data: SuggestTitleRequest) =>
    api.post<{ suggestions: string[] }>('/api/ai/suggest-titles', data)
      .then(r => r.data.suggestions),

  analyzeImage: (data: AnalyzeImageRequest) =>
    api.post<AnalyzeImageResponse>('/api/ai/analyze-image', data)
      .then(r => r.data),
}