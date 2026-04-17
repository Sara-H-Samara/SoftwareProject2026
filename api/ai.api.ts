import api from './axiosInstance'
import type { DescriptionPrompt, InspirationPrompt } from '@/types'

export const aiApi = {
  suggestDescription: (prompt: DescriptionPrompt) =>
    api.post<{ description: string }>('/api/ai/describe-artwork', prompt).then(r => r.data.description),

  getInspiration: (prompt: InspirationPrompt) =>
    api.post<{ ideas: string }>('/api/ai/inspire', prompt).then(r => r.data.ideas),
}