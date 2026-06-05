import { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import type { RoomMaterials } from '@/types/room-types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface InstancedFloorProps {
  mat:       RoomMaterials
  width:     number
  depth:     number
  tileSize?: number
}

// ─── Pre-allocated objects (module-level, never recreated) ────────────────────

// FIX #1: Matrix4 should never be in useMemo — it's a mutable scratch object.
// useMemo would recreate it when deps change, but more importantly it implies
// a stable identity that doesn't exist. useRef is the right tool.
// We use a module-level constant here because there's no per-instance state:
// it's only ever written before being passed to setMatrixAt.
const _matrix = new THREE.Matrix4()
const _darkColor  = new THREE.Color()
const _lightColor = new THREE.Color()

// ─── Component ────────────────────────────────────────────────────────────────

function InstancedFloorInner({
  mat, width, depth, tileSize = 1.8,
}: InstancedFloorProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)

  const cols       = Math.ceil(width  / tileSize)
  const rows       = Math.ceil(depth  / tileSize)
  const totalTiles = cols * rows

  // ── Geometry ────────────────────────────────────────────────────────────────
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(tileSize - 0.02, tileSize - 0.02)
    geo.rotateX(-Math.PI / 2)
    geo.computeVertexNormals()
    return geo
  }, [tileSize])

  // ── Material ─────────────────────────────────────────────────────────────────
  // Single MeshStandardMaterial; per-tile color is set via instancedMesh.setColorAt
  // so we don't need two materials (which would double draw calls).
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color:     mat.floorColor,
    roughness: mat.floorRoughness,
    metalness: mat.floorMetalness,
    vertexColors: true,   // enables per-instance color via setColorAt
  }), [])  // eslint-disable-line react-hooks/exhaustive-deps
  // Intentionally empty deps: material identity is stable; color updates
  // are handled by the effect below so R3F never needs to swap the material.

  // FIX #3: Update material uniforms when mat changes without recreating material.
  // Recreating the material causes a full GPU upload; mutating is ~10× cheaper.
  useEffect(() => {
    material.color.set(mat.floorColor)
    material.roughness  = mat.floorRoughness
    material.metalness  = mat.floorMetalness
    material.needsUpdate = true
  }, [material, mat.floorColor, mat.floorRoughness, mat.floorMetalness])

  // ── Instance matrices + per-tile checkerboard color ─────────────────────────
  // FIX #2: checkerboard via setColorAt — dark and light tiles alternating.
  // Multiplying base color by 0.86 gives a subtle depth without being garish.
  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return

    // Ensure the mesh has a color buffer (required for setColorAt)
    if (!mesh.instanceColor) {
      mesh.instanceColor = new THREE.InstancedBufferAttribute(
        new Float32Array(totalTiles * 3), 3
      )
    }

    _lightColor.set(mat.floorColor)
    _darkColor.set(mat.floorColor).multiplyScalar(0.86)

    let idx = 0
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = (c - cols / 2 + 0.5) * tileSize
        const z = (r - rows / 2 + 0.5) * tileSize

        _matrix.makeTranslation(x, 0, z)
        mesh.setMatrixAt(idx, _matrix)

        // Checkerboard: even sum → light, odd sum → dark
        mesh.setColorAt(idx, (r + c) % 2 === 0 ? _lightColor : _darkColor)

        idx++
      }
    }

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true

  }, [cols, rows, tileSize, mat.floorColor])  // re-run when room size or color changes

  // ── Cleanup ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, totalTiles]}
      receiveShadow
      frustumCulled={false}
    />
  )
}

// ─── Public export ────────────────────────────────────────────────────────────

export function InstancedFloor(props: InstancedFloorProps) {
  const { width, depth, mat } = props
  const tileSize  = props.tileSize ?? 1.8
  const cols      = Math.ceil(width / tileSize)
  const rows      = Math.ceil(depth / tileSize)
  const totalTiles = cols * rows

  // FIX #4: args={[geometry, material, totalTiles]} is read only on mount in R3F.
  // If the room resizes (totalTiles changes), the GPU buffer stays at the old count
  // causing either a crash (buffer overflow) or missing tiles (buffer underflow).
  // Solution: force a full remount via key when totalTiles changes.
  return <InstancedFloorInner key={`${totalTiles}-${mat.floorColor}`} {...props} />
}