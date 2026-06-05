// src/store/avatarStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Avatar } from '@/types/avatar'

const DEFAULT_AVATAR: Avatar = {
  id: '',
  userId: '',
  skinColor: '#E8B89E',
  height: 1.0,
  hairStyle: 'short',
  hairColor: '#3B2A1F',
  shirtStyle: 'tshirt',
  shirtColor: '#3F6FB5',
  pantsStyle: 'pants',
  pantsColor: '#2F2F35',
  shoesColor: '#101015',
  accessory: 'none',
  accessoryColor: '#222222',
  updatedAt: new Date().toISOString(),
}

interface AvatarStore {
  customization: Avatar
  isCustomizerOpen: boolean
  openCustomizer: () => void
  closeCustomizer: () => void
  updateCustomization: (updates: Partial<Avatar>) => void
  resetToDefault: () => void
}

export const useAvatarStore = create<AvatarStore>()(
  persist(
    (set) => ({
      customization: DEFAULT_AVATAR,
      isCustomizerOpen: false,
      openCustomizer: () => set({ isCustomizerOpen: true }),
      closeCustomizer: () => set({ isCustomizerOpen: false }),
      updateCustomization: (updates) =>
        set((state) => ({
          customization: { ...state.customization, ...updates }
        })),
      resetToDefault: () => set({ customization: DEFAULT_AVATAR }),
    }),
    {
      name: 'avatar-storage',
    }
  )
)