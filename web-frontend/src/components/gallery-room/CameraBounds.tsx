import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import type { GalleryCustomization } from '@/types/gallery-customization'
import { SHAPE_RATIOS } from '@/utils/galleryRoom.utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type Zone = { minX: number; maxX: number; minZ: number; maxZ: number }

export interface CameraBoundsProps {
  bounds: {
    minX:      number
    maxX:      number
    minZ:      number
    maxZ:      number
    eyeHeight: number
  }
  excludedZones?: Zone[]
  /**
   * Wall push-back stiffness (0 = instant hard clamp, 1 = no push).
   * 0.12 feels like brushing a soft wall. 0 for hard arcade feel.
   */
  damping?: number
  enabled?: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * FIX #2: lerp-based clamp — no overshoot, no jitter.
 *
 * Old formula:  min + (value - min) * smoothing - velocity * 0.1
 *   Problem: subtracting raw velocity can push value further past the limit
 *            when velocity is high → overshoot & bounce
 *
 * New formula:  lerp(value, limit, 1 - damping)
 *   Guarantees the result moves toward the limit by (1-damping) fraction each frame.
 *   Never overshoots because lerp is bounded between value and limit.
 */
function dampedClamp(value: number, min: number, max: number, damping: number): number {
  if (value < min) return THREE.MathUtils.lerp(value, min, 1 - damping)
  if (value > max) return THREE.MathUtils.lerp(value, max, 1 - damping)
  return value
}

/**
 * FIX #3: direct AABB test — no array allocation per frame.
 *
 * Old: isInExcludedZone(x, z, [zone])  ← creates a new array every call
 * New: inline check against zone object directly
 */
function isInsideZone(x: number, z: number, zone: Zone): boolean {
  return x > zone.minX && x < zone.maxX && z > zone.minZ && z < zone.maxZ
}

/**
 * Wall-slide resolution: push camera to nearest zone boundary using
 * entry-axis detection for smooth sliding (no corner teleport).
 */
function resolveZone(
  x: number, z: number,
  zone: Zone,
  prevX: number, prevZ: number
): { x: number; z: number } {
  const prevInsideX = prevX > zone.minX && prevX < zone.maxX
  const prevInsideZ = prevZ > zone.minZ && prevZ < zone.maxZ

  // Entered from X side → slide along Z, push back on X
  if (!prevInsideX && prevInsideZ) {
    return {
      x: Math.abs(x - zone.minX) < Math.abs(x - zone.maxX) ? zone.minX : zone.maxX,
      z,
    }
  }
  // Entered from Z side → slide along X, push back on Z
  if (prevInsideX && !prevInsideZ) {
    return {
      x,
      z: Math.abs(z - zone.minZ) < Math.abs(z - zone.maxZ) ? zone.minZ : zone.maxZ,
    }
  }
  // Corner entry: push to nearest edge on the shorter axis
  const dx = Math.min(Math.abs(x - zone.minX), Math.abs(x - zone.maxX))
  const dz = Math.min(Math.abs(z - zone.minZ), Math.abs(z - zone.maxZ))
  if (dx <= dz) {
    return {
      x: Math.abs(x - zone.minX) < Math.abs(x - zone.maxX) ? zone.minX : zone.maxX,
      z,
    }
  }
  return {
    x,
    z: Math.abs(z - zone.minZ) < Math.abs(z - zone.maxZ) ? zone.minZ : zone.maxZ,
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CameraBounds({
  bounds,
  excludedZones,
  damping  = 0.12,
  enabled  = true,
}: CameraBoundsProps) {
  // prevPos stores position AFTER all corrections (FIX #1)
  const prevPos  = useRef(new THREE.Vector3())
  const velocity = useRef(new THREE.Vector3())

  useFrame(({ camera }) => {
    if (!enabled) return

    const pos = camera.position

    // Velocity = displacement from last corrected position
    velocity.current.subVectors(pos, prevPos.current)

    // ── Y: hard lock — no damping, prevents floating/crouching ──────────────
    pos.y = bounds.eyeHeight

    // ── XZ: damped rectangular clamp ─────────────────────────────────────────
    let finalX = dampedClamp(pos.x, bounds.minX, bounds.maxX, damping)
    let finalZ = dampedClamp(pos.z, bounds.minZ, bounds.maxZ, damping)

    // ── Shape-aware: excluded zone resolution (L/U/T voids) ──────────────────
    // FIX #3: direct zone check, no array allocation
    if (excludedZones) {
      for (const zone of excludedZones) {
        if (isInsideZone(finalX, finalZ, zone)) {
          const resolved = resolveZone(
            finalX, finalZ, zone,
            prevPos.current.x, prevPos.current.z
          )
          finalX = resolved.x
          finalZ = resolved.z
        }
      }
    }

    pos.x = finalX
    pos.z = finalZ

    // FIX #1: copy AFTER all corrections so velocity reflects actual movement,
    // not raw camera pos before clamping. This prevents jitter and incorrect
    // push-back on the next frame.
    prevPos.current.copy(pos)
  })

  return null
}

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * Build excluded zones from GalleryCustomization.
 * Uses SHAPE_RATIOS — the same constants used by the wall geometry components —
 * so camera bounds always match actual walls. (FIX #4)
 */
export function buildExcludedZones(
  customization?: GalleryCustomization | null
): Zone[] {
  const shape  = customization?.structure?.shape     ?? 'rectangle'
  const roomW  = customization?.structure?.roomWidth ?? 22
  const roomD  = customization?.structure?.roomDepth ?? 22
  const halfW  = roomW / 2
  const halfD  = roomD / 2
  const pad    = 0.6  // minimum distance from virtual wall to camera center

  switch (shape) {
    case 'l_shaped': {
      // Void = top-right quadrant (removed wing area)
      // Matches LShapedWalls: wingW = roomW * L_WING_W, wingD = roomD * L_WING_D
      const wingW = roomW * SHAPE_RATIOS.L_WING_W
      const wingD = roomD * SHAPE_RATIOS.L_WING_D
      return [{
        minX:  halfW - wingW + pad,
        maxX:  halfW         - pad,
        minZ: -halfD         + pad,
        maxZ:  halfD - wingD - pad,
      }]
    }

    case 'u_shaped': {
      // Void = center-back opening between the two arms
      // Matches UShapedWalls: openingW = roomW * U_OPENING_W, armDepth = roomD * U_ARM_D
      const openingW = roomW * SHAPE_RATIOS.U_OPENING_W
      const armDepth = roomD * SHAPE_RATIOS.U_ARM_D
      return [{
        minX: -(openingW / 2) + pad,
        maxX:   openingW / 2  - pad,
        minZ:  halfD - armDepth + pad,
        maxZ:  halfD            - pad,
      }]
    }

    case 't_shaped': {
      // Two voids: left and right of the stem (the missing back-bar areas)
      // Matches TShapedWalls: stemHalfW = (roomW * T_STEM_W) / 2, stemDepth = roomD * T_STEM_D
      const stemHalfW = (roomW * SHAPE_RATIOS.T_STEM_W) / 2
      const stemDepth = roomD * SHAPE_RATIOS.T_STEM_D
      const spineZ    = halfD - stemDepth
      return [
        {
          minX: -halfW        + pad,
          maxX: -stemHalfW    - pad,
          minZ:  spineZ       + pad,
          maxZ:  halfD        - pad,
        },
        {
          minX:  stemHalfW    + pad,
          maxX:  halfW        - pad,
          minZ:  spineZ       + pad,
          maxZ:  halfD        - pad,
        },
      ]
    }

    // rectangle, square, circular, octagonal → no excluded zones needed
    default:
      return []
  }
}