import { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import type { RoomDimensions, RoomMaterials } from '@/types/room-types'
import type { RoomShape } from '@/types/room-shape'
import { SHAPE_RATIOS } from '@/utils/galleryRoom.utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FloorProps {
  mat: RoomMaterials
  dim: RoomDimensions
}

interface StyledFloorProps extends FloorProps {
  highQuality: boolean
  shape:       RoomShape
}

// ─── Shared material helper ───────────────────────────────────────────────────

function floorMatProps(mat: RoomMaterials) {
  return { color: mat.floorColor, roughness: mat.floorRoughness, metalness: mat.floorMetalness }
}

// ─── Module-level scratch ─────────────────────────────────────────────────────

const _matrix = new THREE.Matrix4()
const _light  = new THREE.Color()
const _dark   = new THREE.Color()

// ─── SINGLE SOURCE OF TRUTH: room footprint path ─────────────────────────────
// Used by StyledFloor (floor mesh) AND StyledWalls (ceiling mesh).
// One function → floor and ceiling are always identical in shape.

export function buildRoomShape2D(shape: RoomShape, W: number, D: number): THREE.Shape {
  const hW = W / 2
  const hD = D / 2
  const s  = new THREE.Shape()

  // ── Coordinate mapping ────────────────────────────────────────────────────
  // THREE.ShapeGeometry builds in the XY plane.
  // After geo.rotateX(-Math.PI / 2):
  //   shape X → world X  (unchanged)
  //   shape Y → world -Z  (FLIPPED — positive shape Y = negative world Z = front)
  //
  // So to place a point at world (wx, 0, wz):
  //   shape.lineTo(wx, -wz)
  //
  // All Z coords below are NEGATED to account for this flip.

  switch (shape) {
    case 'l_shaped': {
      // Void = top-right in WORLD space (x: stepX→hW, z: stepZ→hD)
      // In shape space: world Z=+hD → shape Y=-hD, world Z=+stepZ → shape Y=-stepZ
      //
      // World layout (top-down, Z+ = back):
      //   front (-hD) ──────────────── front (-hD)
      //   (-hW,-hD)                   (hW,-hD)
      //       │                           │
      //       │       main body           │ right bar
      //       │                           │ (stops at stepZ)
      //   (-hW,stepZ)            (stepX,stepZ) inner corner
      //       │                       │
      //       │    [VOID removed]     │ inner vert wall
      //       │                       │
      //   (-hW,hD) ─────────── (stepX,hD) back
      //
      const ws    = W * SHAPE_RATIOS.L_WING_W
      const wd    = D * SHAPE_RATIOS.L_WING_D
      const stepX = hW - ws    // inner corner world X
      const stepZ = hD - wd    // inner corner world Z
      // Shape coords: (worldX, -worldZ)
      s.moveTo(-hW,    +hD)    // world(-hW, 0, -hD) = front-left
      s.lineTo( hW,    +hD)    // world( hW, 0, -hD) = front-right
      s.lineTo( hW,   -stepZ)  // world( hW, 0, stepZ) = right bar stops at stepZ
      s.lineTo( stepX,-stepZ)  // world(stepX, 0, stepZ) = inner corner
      s.lineTo( stepX,-hD)     // world(stepX, 0, hD) = back inner
      s.lineTo(-hW,   -hD)     // world(-hW, 0, hD) = back-left
      s.closePath()
      break
    }

    case 't_shaped': {
      // T-bar = full width at front. Stem = narrow channel at back center.
      // stemBaseZ = world Z where bar ends and stem begins.
      //
      // World layout (top-down):
      //  (-hW,-hD)──────────────────────(+hW,-hD)  front
      //      │                               │
      //      │         bar (full width)      │  bar walls: x=±hW, z=-hD to stemBaseZ
      //      │                               │
      //  (-hW,sbZ)──(-shW,sbZ)    (+shW,sbZ)──(+hW,sbZ)  ← stemBaseZ
      //               │  stem  │
      //               │        │  stem walls: x=±shW, z=sbZ to hD
      //              (-shW,hD)──(+shW,hD)  back
      //
      // FIX: sides (x=±hW) go from front to stemBaseZ ONLY (not full depth).
      // Full depth would include the void area behind the bar on left/right.
      //
      const sw  = W * SHAPE_RATIOS.T_STEM_W
      const sd  = D * SHAPE_RATIOS.T_STEM_D
      const shW = sw / 2
      const sbZ = hD - sd    // stemBaseZ in world Z
      // Shape coords: (worldX, -worldZ)
      s.moveTo(-hW,   +hD)    // world(-hW, -hD) front-left
      s.lineTo( hW,   +hD)    // world( hW, -hD) front-right
      s.lineTo( hW,   -sbZ)   // world( hW, sbZ) right bar stops at stemBaseZ ← FIX
      s.lineTo( shW,  -sbZ)   // world( shW, sbZ) outer right-stem corner
      s.lineTo( shW,  -hD)    // world( shW, hD) stem back-right
      s.lineTo(-shW,  -hD)    // world(-shW, hD) stem back-left
      s.lineTo(-shW,  -sbZ)   // world(-shW, sbZ) outer left-stem corner
      s.lineTo(-hW,   -sbZ)   // world(-hW, sbZ) left bar stops at stemBaseZ ← FIX
      s.closePath()
      break
    }

    case 'u_shaped': {
      // Full rect minus center-back opening
      const ow = W * SHAPE_RATIOS.U_OPENING_W
      const ad = D * SHAPE_RATIOS.U_ARM_D
      const spineZ = hD - ad   // world Z of spine
      // Shape coords: (worldX, -worldZ)
      s.moveTo(-hW,       +hD)       // front-left
      s.lineTo( hW,       +hD)       // front-right
      s.lineTo( hW,       -hD)       // back-right
      s.lineTo( ow / 2,   -hD)       // right arm back
      s.lineTo( ow / 2,   -spineZ)   // right inner corner (spine)
      s.lineTo(-ow / 2,   -spineZ)   // left inner corner
      s.lineTo(-ow / 2,   -hD)       // left arm back
      s.lineTo(-hW,       -hD)       // back-left
      s.closePath()
      break
    }

    default: {
      // rectangle / square
      s.moveTo(-hW, +hD)
      s.lineTo( hW, +hD)
      s.lineTo( hW, -hD)
      s.lineTo(-hW, -hD)
      s.closePath()
    }
  }

  return s
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CircularFloor({ mat, dim }: FloorProps) {
  const geometry = useMemo(() => {
    const geo = new THREE.CircleGeometry(dim.width / 2, 96)
    geo.rotateX(-Math.PI / 2)
    return geo
  }, [dim.width])

  useEffect(() => () => { geometry.dispose() }, [geometry])

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial {...floorMatProps(mat)} />
    </mesh>
  )
}

function OctagonFloor({ mat, dim }: FloorProps) {
  const geometry = useMemo(() => {
    const r      = dim.width / 2
    const shape2D = new THREE.Shape()
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 - Math.PI / 8
      i === 0
        ? shape2D.moveTo(Math.cos(angle) * r, Math.sin(angle) * r)
        : shape2D.lineTo(Math.cos(angle) * r, Math.sin(angle) * r)
    }
    shape2D.closePath()
    const geo = new THREE.ShapeGeometry(shape2D)
    geo.rotateX(-Math.PI / 2)
    geo.computeVertexNormals()
    return geo
  }, [dim.width])

  useEffect(() => () => { geometry.dispose() }, [geometry])

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial {...floorMatProps(mat)} />
    </mesh>
  )
}

function ShapeFloor({ mat, dim, shape }: FloorProps & { shape: RoomShape }) {
  const geometry = useMemo(() => {
    // FIX: use buildRoomShape2D — same path as ceiling, no offset tricks
    const shape2D = buildRoomShape2D(shape, dim.width, dim.depth)
    const geo     = new THREE.ShapeGeometry(shape2D)
    geo.rotateX(-Math.PI / 2)
    geo.computeVertexNormals()
    return geo
  }, [dim.width, dim.depth, shape])

  useEffect(() => () => { geometry.dispose() }, [geometry])

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial {...floorMatProps(mat)} />
    </mesh>
  )
}

function TiledFloor({ mat, dim }: FloorProps) {
  const meshRef  = useRef<THREE.InstancedMesh>(null)
  const tileSize = 1.8
  const cols     = Math.ceil(dim.width  / tileSize)
  const rows     = Math.ceil(dim.depth  / tileSize)
  const total    = cols * rows

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(tileSize - 0.02, tileSize - 0.02)
    geo.rotateX(-Math.PI / 2)
    return geo
  }, [tileSize])

  const material = useMemo(() => new THREE.MeshStandardMaterial({
    ...floorMatProps(mat), vertexColors: true,
  }), [])  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    material.color.set(mat.floorColor)
    material.roughness   = mat.floorRoughness
    material.metalness   = mat.floorMetalness
    material.needsUpdate = true
  }, [material, mat.floorColor, mat.floorRoughness, mat.floorMetalness])

  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    _light.set(mat.floorColor)
    _dark.set(mat.floorColor).multiplyScalar(0.86)
    let idx = 0
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        _matrix.makeTranslation((c - cols / 2 + 0.5) * tileSize, 0, (r - rows / 2 + 0.5) * tileSize)
        mesh.setMatrixAt(idx, _matrix)
        mesh.setColorAt(idx, (r + c) % 2 === 0 ? _light : _dark)
        idx++
      }
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [cols, rows, tileSize, mat.floorColor])

  useEffect(() => () => { geometry.dispose(); material.dispose() }, [geometry, material])

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, total]} receiveShadow frustumCulled={false} />
  )
}

function PlaneFloor({ mat, dim }: FloorProps) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[dim.width, dim.depth]} />
      <meshStandardMaterial {...floorMatProps(mat)} />
    </mesh>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function StyledFloor({ mat, dim, highQuality, shape }: StyledFloorProps) {
  switch (shape) {
    case 'circular':  return <CircularFloor mat={mat} dim={dim} />
    case 'octagonal': return <OctagonFloor  mat={mat} dim={dim} />
    case 'l_shaped':
    case 't_shaped':
    case 'u_shaped':  return <ShapeFloor mat={mat} dim={dim} shape={shape} />
    default:          return highQuality
      ? <TiledFloor key={`${Math.ceil(dim.width / 1.8)}-${Math.ceil(dim.depth / 1.8)}`} mat={mat} dim={dim} />
      : <PlaneFloor mat={mat} dim={dim} />
  }
}