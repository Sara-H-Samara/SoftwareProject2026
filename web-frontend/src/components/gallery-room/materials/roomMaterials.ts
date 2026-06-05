// src/components/gallery-room/materials/roomMaterials.ts
import { useMemo, useEffect } from 'react'
import * as THREE from 'three'
import type { RoomMaterials } from '@/types/room-types'

export function useFloorMaterial(mat: RoomMaterials) {
  return useMemo(() => {
    const material = new THREE.MeshStandardMaterial({
      color: mat.floorColor,
      roughness: mat.floorRoughness,
      metalness: mat.floorMetalness,
      side: THREE.FrontSide
    })
    return material
  }, [mat.floorColor, mat.floorRoughness, mat.floorMetalness])
}

export function useWallMaterial(wallColor: string, roughness: number, materialType: string) {
  return useMemo(() => {
    const isGlass = materialType === 'glass'
    const isMirror = materialType === 'mirror'
    
    const material = new THREE.MeshStandardMaterial({
      color: wallColor,
      roughness: isGlass ? 0.1 : roughness,
      metalness: isGlass ? 0.9 : (isMirror ? 0.98 : 0.05),
      side: THREE.BackSide,
      ...(isGlass && {
        transmission: 0.85,
        transparent: true,
        opacity: 0.35,
        envMapIntensity: 1.2
      }),
      ...(isMirror && {
        envMapIntensity: 1.5
      })
    })
    return material
  }, [wallColor, roughness, materialType])
}

export function useDisposableGeometry<T extends THREE.BufferGeometry>(geometry: T | null) {
  useEffect(() => {
    return () => {
      if (geometry) {
        geometry.dispose()
      }
    }
  }, [geometry])
}