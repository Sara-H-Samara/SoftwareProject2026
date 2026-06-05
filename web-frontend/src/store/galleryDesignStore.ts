// src/store/galleryDesignStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GalleryCustomization, DEFAULT_CUSTOMIZATION } from '@/types/gallery-customization';

interface GalleryDesignStore {
  customization: GalleryCustomization;
  isLoading: boolean;
  hasUnsavedChanges: boolean;
  activeTab: string;
  
  setCustomization: (customization: GalleryCustomization) => void;
  updatePart: <K extends keyof GalleryCustomization>(part: K, data: Partial<GalleryCustomization[K]>) => void;
  setHasUnsavedChanges: (value: boolean) => void;
  setActiveTab: (tab: string) => void;
  resetToDefault: () => void;
  loadFromApi: (data: GalleryCustomization) => void;
}

export const useGalleryDesignStore = create<GalleryDesignStore>()(
  persist(
    (set) => ({
      customization: DEFAULT_CUSTOMIZATION,
      isLoading: false,
      hasUnsavedChanges: false,
      activeTab: 'structure',

      setCustomization: (customization) => set({ customization, hasUnsavedChanges: true }),

      updatePart: (part, data) =>
        set((state) => {
          const currentPart = state.customization[part];
          const mergedPart = typeof currentPart === 'object' && currentPart !== null
            ? { ...currentPart, ...data }
            : data;
          
          return {
            customization: {
              ...state.customization,
              [part]: mergedPart,
            },
            hasUnsavedChanges: true,
          };
        }),

      setHasUnsavedChanges: (value) => set({ hasUnsavedChanges: value }),

      setActiveTab: (tab) => set({ activeTab: tab }),

      resetToDefault: () =>
        set({
          customization: DEFAULT_CUSTOMIZATION,
          hasUnsavedChanges: true,
        }),

      loadFromApi: (data) =>
        set({
          customization: data,
          hasUnsavedChanges: false,
        }),
    }),
    {
      name: 'gallery-design-storage',
      partialize: (state) => ({ customization: state.customization }),
    }
  )
);