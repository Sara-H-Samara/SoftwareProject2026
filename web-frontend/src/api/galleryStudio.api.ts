// src/api/galleryStudio.api.ts
import api from './axiosInstance';
import { GalleryCustomization } from '@/types/gallery-customization';

export const galleryStudioApi = {
  // Get current artist's customization (for the studio editor)
  getCustomization: async (): Promise<GalleryCustomization> => {
    const response = await api.get<GalleryCustomization>('/api/gallery/customization');
    return response.data;
  },

  // Get any artist's customization by ID (public — for visitors viewing a gallery)
  getCustomizationByArtist: async (artistId: string): Promise<GalleryCustomization> => {
    const response = await api.get<GalleryCustomization>(`/api/gallery/${artistId}/customization`);
    return response.data;
  },

  // Save customization
  saveCustomization: async (data: GalleryCustomization): Promise<GalleryCustomization> => {
    const response = await api.put<GalleryCustomization>('/api/gallery/customization', data);
    return response.data;
  },

  // Reset to default
  resetCustomization: async (): Promise<void> => {
    await api.post('/api/gallery/customization/reset');
  },

  // Get subscription status
  getSubscriptionStatus: async (): Promise<{ isActive: boolean; plan?: string }> => {
    const response = await api.get<{ isActive: boolean; plan?: string }>('/api/gallery/subscription');
    return response.data;
  },

  // Create subscription checkout session
  createSubscription: async (planId: 'monthly' | 'yearly'): Promise<{ checkoutUrl: string }> => {
    const response = await api.post<{ checkoutUrl: string }>('/api/gallery/subscription/create', { planId });
    return response.data;
  },
};