// src/components/gallery/ProceduralGalleryRoom.tsx
import { useMemo } from 'react'
import type { GalleryCustomization } from '@/types/gallery-customization'
import type { RoomShape } from '@/types/room-shape'
import type { RoomDimensions, RoomMaterials } from '@/types/room-types'
import { getRoomDimensions, resolveRoomMaterials } from '@/utils/galleryRoom.utils'
import { buildRoomShape2D } from '@/components/gallery-room/StyledFloor'
import * as THREE from 'three'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProceduralGalleryRoomProps {
  customization?: GalleryCustomization | null
  highQuality?:  boolean
}

// ─── Track lights ─────────────────────────────────────────────────────────────

interface TrackLightsProps {
  mat: RoomMaterials
  dim: RoomDimensions
}

function CeilingTrackLights({ mat, dim }: TrackLightsProps) {
  const railXs = [-dim.halfW * 0.55, -dim.halfW * 0.18, dim.halfW * 0.18, dim.halfW * 0.55]
  const lampZs = [-dim.halfD * 0.55, -dim.halfD * 0.18, 0, dim.halfD * 0.18, dim.halfD * 0.55]

  return (
    <group>
      {railXs.map(x => (
        <mesh key={`rail-${x}`} position={[x, dim.height - 0.06, 0]}>
          <boxGeometry args={[0.06, 0.06, dim.depth * 0.85]} />
          <meshStandardMaterial color="#111" metalness={0.95} roughness={0.1} />
        </mesh>
      ))}
      {railXs.flatMap(x =>
        lampZs.map(z => (
          <pointLight
            key={`light-${x}-${z}`}
            position={[x, dim.height - 0.08, z]}
            intensity={mat.spotlightIntensity * 0.45}
            color="#fff0d8"
            distance={dim.height * 3}
            decay={1.5}
          />
        ))
      )}
    </group>
  )
}

// ─── Decorative pillars ───────────────────────────────────────────────────────

interface PillarsProps {
  mat: RoomMaterials
  dim: RoomDimensions
}

function DecorativePillars({ mat, dim }: PillarsProps) {
  const trimMat = { color: mat.trimColor, metalness: 0.55, roughness: 0.30 }
  const px = dim.halfW * 0.72
  const pz = dim.halfD * 0.72
  const h  = dim.height

  return (
    <>
      {([[-px, -pz], [px, -pz], [-px, pz], [px, pz]] as [number, number][]).map(([x, z], i) => (
        <group key={`pillar-${i}`} position={[x, 0, z]}>
          {/* Shaft */}
          <mesh castShadow position={[0, h / 2, 0]}>
            <cylinderGeometry args={[0.22, 0.27, h * 0.848, 16]} />
            <meshStandardMaterial color="#c0aa88" metalness={0.38} roughness={0.42} />
          </mesh>
          {/* Capital */}
          <mesh position={[0, h * 0.926, 0]}>
            <cylinderGeometry args={[0.36, 0.22, h * 0.048, 16]} />
            <meshStandardMaterial {...trimMat} />
          </mesh>
          {/* Base */}
          <mesh position={[0, h * 0.026, 0]}>
            <cylinderGeometry args={[0.35, 0.39, h * 0.052, 4]} />
            <meshStandardMaterial {...trimMat} />
          </mesh>
        </group>
      ))}
    </>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProceduralGalleryRoom({ customization }: ProceduralGalleryRoomProps) {
  const dim   = useMemo(() => getRoomDimensions(customization),    [customization])
  const mat   = useMemo(() => resolveRoomMaterials(customization), [customization])
  const shape = (customization?.structure?.shape ?? 'rectangle') as RoomShape

  const isStandard = shape === 'rectangle' || shape === 'square'

  // ── Floor geometry ──────────────────────────────────────────────────────────
  // FIX #1: geometry computed in useMemo (not on every render)
  // FIX #2: ShapeGeometry handles the rotation itself — no extra rotation on the mesh
  const floorGeo = useMemo(() => {
    if (shape === 'circular') {
      const geo = new THREE.CircleGeometry(dim.width / 2, 96)
      geo.rotateX(-Math.PI / 2)
      return geo
    }
    if (shape === 'octagonal') {
      const r = dim.width / 2
      const s = new THREE.Shape()
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 - Math.PI / 8
        i === 0 ? s.moveTo(Math.cos(a) * r, Math.sin(a) * r) : s.lineTo(Math.cos(a) * r, Math.sin(a) * r)
      }
      s.closePath()
      const geo = new THREE.ShapeGeometry(s)
      geo.rotateX(-Math.PI / 2)
      return geo
    }
    if (shape === 'l_shaped' || shape === 't_shaped' || shape === 'u_shaped') {
      const shape2D = buildRoomShape2D(shape, dim.width, dim.depth)
      const geo     = new THREE.ShapeGeometry(shape2D)
      geo.rotateX(-Math.PI / 2)
      geo.computeVertexNormals()
      return geo
    }
    // rectangle / square
    const geo = new THREE.PlaneGeometry(dim.width, dim.depth)
    geo.rotateX(-Math.PI / 2)
    return geo
  }, [shape, dim.width, dim.depth])

  // ── Ceiling geometry ────────────────────────────────────────────────────────
  // FIX: ceiling uses same buildRoomShape2D as floor → always matches
  const ceilingGeo = useMemo(() => {
    if (shape === 'circular') {
      return new THREE.CircleGeometry(dim.width / 2, 96)
    }
    if (shape === 'octagonal') {
      return new THREE.CircleGeometry(dim.width / 2, 8)
    }
    if (shape === 'l_shaped' || shape === 't_shaped' || shape === 'u_shaped') {
      const shape2D = buildRoomShape2D(shape, dim.width, dim.depth)
      const geo     = new THREE.ShapeGeometry(shape2D)
      // No rotateX here — mesh rotation handles it
      return geo
    }
    return new THREE.PlaneGeometry(dim.width + 0.5, dim.depth + 0.5)
  }, [shape, dim.width, dim.depth])

  // ── Stable materials in useMemo — no new material per render ───────────────
  // FIX #3: old version created `new THREE.MeshStandardMaterial` in useEffect
  // on every render without disposing the previous one → GPU memory leak.
  // useMemo creates once and reuses until deps change.


  const floorMat = useMemo(() => new THREE.MeshStandardMaterial({
    color:     mat.floorColor,
    roughness: mat.floorRoughness,
    metalness: mat.floorMetalness,
  }), [mat.floorColor, mat.floorRoughness, mat.floorMetalness])

  const ceilingMat = useMemo(() => new THREE.MeshStandardMaterial({
    color:     '#f3efe8',
    roughness: 0.9,
    side:      THREE.DoubleSide,
  }), [])

  return (
    <group>
      {/* Lighting */}
      <ambientLight intensity={mat.ambientIntensity} color={mat.ambientColor} />
      <directionalLight
        position={[5, dim.height + 1, 4]}
        intensity={mat.mainLightIntensity}
        color="#fff8f0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {/* Floor — FIX: geometry already rotated, no rotation prop needed */}
      <mesh geometry={floorGeo} material={floorMat} receiveShadow />

      {/* Ceiling — FIX: rotated via mesh prop, not baked into geometry */}
      <mesh
        geometry={ceilingGeo}
        material={ceilingMat}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, dim.height, 0]}
      />

      {/* Track lights — rectangular rooms only */}
      {isStandard && mat.hasSpotlights && <CeilingTrackLights mat={mat} dim={dim} />}

      {/* Pillars — rectangular rooms only */}
      {isStandard && mat.hasPillars && <DecorativePillars mat={mat} dim={dim} />}
    </group>
  )
}