// src/types/gallery-customization.ts

export interface Structure {
  shape: 'rectangle' | 'square' | 'l_shaped' | 't_shaped' | 'u_shaped' | 'circular' | 'octagonal'
  layoutType: 'single_room' | 'loft' | 'courtyard'
  wallHeight: number
  roomWidth: number
  roomDepth: number
  ceilingType: 'flat' | 'vaulted' | 'skylight' | 'exposed_beam' | 'domed'
  pillars: boolean
}

export interface Walls {
  color: string
  material: 'plaster' | 'brick' | 'wood_panels' | 'concrete' | 'wallpaper' | 'glass' | 'mirror'
  roughness: number
  metalness?: number  // Added for glass/mirror materials
  wainscoting: {
    enabled: boolean
    height: number
    color: string
    material: string
  }
  accentWall: {
    enabled: boolean
    wall: 'front' | 'back' | 'left' | 'right'
    color: string
  }
  moldings: {
    enabled: boolean
    style: 'classic' | 'modern' | 'minimal'
    color: string
  }
}

export interface Floor {
  color: string
  material: 'wood' | 'marble' | 'concrete' | 'tile' | 'epoxy' | 'polished_concrete'
  roughness: number
  metalness?: number  // Added for polished/metal-like floors
  gloss?: number       // Alternative property name
}

export interface Lighting {
  ambientLight: {
    intensity: number
    color: string
  }
  mainLighting: {
    type: 'recessed' | 'pendant' | 'track' | 'natural'
    intensity: number
    colorTemp: 'warm' | 'daylight' | 'cool'
  }
  spotlights: {
    enabled: boolean
    count: number
    intensity: number
    angle: number
  }
}

export interface GalleryCustomization {
  structure: Structure
  walls: Walls
  floor: Floor
  lighting: Lighting
}

export const DEFAULT_CUSTOMIZATION: GalleryCustomization = {
  structure: {
    shape: 'rectangle',
    layoutType: 'single_room',
    wallHeight: 4.8,
    roomWidth: 22,
    roomDepth: 22,
    ceilingType: 'flat',
    pillars: false,
  },
  walls: {
    color: '#ece6dc',
    material: 'plaster',
    roughness: 0.7,
    wainscoting: {
      enabled: false,
      height: 0.9,
      color: '#f2ede2',
      material: 'wood',
    },
    accentWall: {
      enabled: false,
      wall: 'front',
      color: '#c9a96e',
    },
    moldings: {
      enabled: true,
      style: 'classic',
      color: '#e8e0d0',
    },
  },
  floor: {
    color: '#d4c9a8',
    material: 'marble',
    roughness: 0.4,
    metalness: 0.1,
    gloss: 0.4,
  },
  lighting: {
    ambientLight: {
      intensity: 0.75,
      color: '#fff4e6',
    },
    mainLighting: {
      type: 'recessed',
      intensity: 0.85,
      colorTemp: 'daylight',
    },
    spotlights: {
      enabled: true,
      count: 8,
      intensity: 1.0,
      angle: 0.5,
    },
  },
}