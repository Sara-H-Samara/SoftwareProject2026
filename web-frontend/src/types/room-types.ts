// src/types/room-types.ts

export interface RoomDimensions {
  width: number
  depth: number
  height: number
  halfW: number
  halfD: number
  wallZOffset: number
  wallOffset: number
}

export interface RoomMaterials {
  wallColor: string
  wallRoughness: number
  floorColor: string
  floorRoughness: number
  floorMetalness: number
  trimColor: string
  ambientIntensity: number
  ambientColor: string
  mainLightIntensity: number
  hasSpotlights: boolean
  spotlightIntensity: number
  hasPillars: boolean
}