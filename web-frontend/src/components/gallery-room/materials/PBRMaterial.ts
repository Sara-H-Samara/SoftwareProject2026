// src/components/gallery-room/materials/PBRMaterial.tsx
import { useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

interface PBRMaterialProps {
  type: 'wood' | 'marble' | 'concrete' | 'plaster'
  color: string
  roughness: number
  metalness: number
}

export function usePBRMaterial({ type, color, roughness, metalness }: PBRMaterialProps) {
  const textures = useTexture({
    map: `/textures/${type}/diffuse.jpg`,
    normalMap: `/textures/${type}/normal.jpg`,
    roughnessMap: `/textures/${type}/roughness.jpg`,
    aoMap: `/textures/${type}/ao.jpg`,
  })
  
  return useMemo(() => {
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness,
      map: textures.map,
      normalMap: textures.normalMap,
      roughnessMap: textures.roughnessMap,
      aoMap: textures.aoMap,
      aoMapIntensity: 0.8,
      envMapIntensity: 1.2
    })
    return material
  }, [color, roughness, metalness, textures])
}