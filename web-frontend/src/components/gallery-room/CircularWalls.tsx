import { useMemo, useEffect } from 'react'
import * as THREE from 'three'
import type { RoomDimensions } from '@/types/room-types'

interface CircularWallsProps {
  dim:        RoomDimensions
  color:      string
  roughness:  number
  metalness:  number
  trimColor?: string
}

// ─── UV fix ───────────────────────────────────────────────────────────────────
function fixInnerUVs(geo: THREE.CylinderGeometry): void {
  const uv = geo.attributes.uv
  if (!uv) return
  for (let i = 0; i < uv.count; i++) {
    uv.setX(i, 1 - uv.getX(i))
  }
  uv.needsUpdate = true
}

export function CircularWalls({
  dim,
  color,
  roughness,
  metalness,
  trimColor = '#c8aa6a',
}: CircularWallsProps) {

  const radius = dim.width / 2

  // ─── WALL ────────────────────────────────────────────────────────────────
  const geometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(
      radius,
      radius,
      dim.height,
      96,
      1,
      true
    )
    fixInnerUVs(geo)
    geo.computeVertexNormals()
    return geo
  }, [radius, dim.height])

  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    side: THREE.BackSide,
  }), [color, roughness, metalness])

  // ─── TRIM ────────────────────────────────────────────────────────────────
  const trimGeo = useMemo(() => {
    return new THREE.TorusGeometry(radius, 0.065, 12, 96)
  }, [radius])

  const trimMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: trimColor,
    metalness: 0.55,
    roughness: 0.3,
  }), [trimColor])

  // ─── CEILING ─────────────────────────────────────────────────────────────
  const ceilingGeo = useMemo(() => {
    return new THREE.CylinderGeometry(
      radius - 0.02,
      radius - 0.02,
      0.2,
      96
    )
  }, [radius])

  const ceilingMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#f5f4f2',
    roughness: 0.9,
    metalness: 0.0,
  }), [])

  // ─── CLEANUP ─────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
      trimGeo.dispose()
      trimMat.dispose()
      ceilingGeo.dispose()
      ceilingMat.dispose()
    }
  }, [geometry, material, trimGeo, trimMat, ceilingGeo, ceilingMat])

  return (
    <group>
      {/* WALL */}
      <mesh
        geometry={geometry}
        material={material}
        position={[0, dim.height / 2, 0]}
        receiveShadow
      />

      {/* CEILING (NEW FIX) */}
      <mesh
        geometry={ceilingGeo}
        material={ceilingMat}
        position={[0, dim.height - 0.05, 0]}
        receiveShadow
      />

      {/* CROWN TRIM */}
      <mesh
        geometry={trimGeo}
        material={trimMat}
        position={[0, dim.height - 0.08, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      />

      {/* BASEBOARD */}
      <mesh
        geometry={trimGeo}
        material={trimMat}
        position={[0, 0.08, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      />

      {/* FLOOR TRIM RING */}
      <mesh position={[0, 0.016, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.12, radius + 0.06, 96]} />
        <meshStandardMaterial
          color={trimColor}
          metalness={0.55}
          roughness={0.3}
        />
      </mesh>
    </group>
  )
}