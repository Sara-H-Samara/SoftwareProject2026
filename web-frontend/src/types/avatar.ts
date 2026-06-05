// src/types/avatar.ts
export type HairStyle = 'bald' | 'short' | 'long' | 'curly' | 'ponytail'
export type ShirtStyle = 'tshirt' | 'hoodie' | 'jacket' | 'tank'
export type PantsStyle = 'pants' | 'shorts' | 'skirt'
export type AccessoryStyle = 'none' | 'glasses' | 'sunglasses' | 'hat' | 'beanie' | 'headphones' | 'earrings' | 'mask'

export interface Avatar {
  id: string
  userId: string
  skinColor: string
  height: number
  hairStyle: HairStyle
  hairColor: string
  shirtStyle: ShirtStyle
  shirtColor: string
  pantsStyle: PantsStyle
  pantsColor: string
  shoesColor: string
  accessory: AccessoryStyle
  accessoryColor: string
  updatedAt: string
}

export interface UpdateAvatarRequest {
  skinColor?: string
  height?: number
  hairStyle?: HairStyle
  hairColor?: string
  shirtStyle?: ShirtStyle
  shirtColor?: string
  pantsStyle?: PantsStyle
  pantsColor?: string
  shoesColor?: string
  accessory?: AccessoryStyle
  accessoryColor?: string
}

export const DEFAULT_AVATAR: Avatar = {
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