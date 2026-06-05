import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import * as THREE from 'three'

// ─── Types ────────────────────────────────────────────────────────────────────

type LodLevel = 'high' | 'medium' | 'low'

interface LodWallsProps {
  highDetail:   React.ReactNode
  mediumDetail: React.ReactNode
  lowDetail:    React.ReactNode
  /**
   * Distances from the nearest wall (not world origin) at which to switch levels.
   * Defaults are tuned for a ~20×20m gallery room:
   *   > far    → low detail (player near opposite wall, this wall barely visible)
   *   > medium → medium detail
   *   ≤ medium → high detail (player close, full geometry visible)
   */
  thresholds?: { far: number; medium: number }
  /**
   * Hysteresis band around each threshold (in meters).
   * Prevents thrashing when the player stands exactly on a boundary.
   * A value of 1.5 means: switch UP at (threshold - 1.5), switch DOWN at (threshold + 1.5).
   */
  hysteresis?: number
  /**
   * Center of this wall group in world space.
   * Used to compute the correct distance from camera to wall, not to origin.
   * For a wall at z = +halfD, pass position={[0, 0, halfD]}.
   */
  wallCenter?: THREE.Vector3Like
}

// ─── Pre-allocated scratch objects ───────────────────────────────────────────

const _wallPos = new THREE.Vector3()

// ─── Component ────────────────────────────────────────────────────────────────

export function LodWalls({
  highDetail,
  mediumDetail,
  lowDetail,
  thresholds   = { far: 14, medium: 7 },
  hysteresis   = 1.5,
  wallCenter,
}: LodWallsProps) {
  const [level, setLevel] = useState<LodLevel>('high')

  // FIX #3: removed cameraRef — camera is already in useFrame callback, no ref needed.
  // FIX #1 + FIX #2: track level in a ref to avoid setState in every frame.
  // Only call setLevel (which triggers React re-render) when the level actually changes.
  const levelRef = useRef<LodLevel>('high')

  useFrame(({ camera }) => {
    // FIX #1: distance from camera to the WALL, not to world origin.
    // camera.position.length() always ≈ 1.65m inside a gallery → LOD never switches.
    let dist: number
    if (wallCenter) {
      _wallPos.set(wallCenter.x, wallCenter.y, wallCenter.z)
      dist = camera.position.distanceTo(_wallPos)
    } else {
      // Fallback: distance from origin — only correct for walls centered at origin
      dist = camera.position.length()
    }

    // FIX #2: hysteresis prevents thrashing at threshold boundaries.
    // Switch DOWN (to lower detail) only when clearly past threshold + band.
    // Switch UP (to higher detail) only when clearly inside threshold - band.
    const current = levelRef.current
    let next: LodLevel

    if (current === 'high') {
      // Only downgrade when well past the medium threshold
      if      (dist > thresholds.far    + hysteresis) next = 'low'
      else if (dist > thresholds.medium + hysteresis) next = 'medium'
      else                                             next = 'high'
    } else if (current === 'medium') {
      // Upgrade to high when clearly close; downgrade to low when clearly far
      if      (dist < thresholds.medium - hysteresis) next = 'high'
      else if (dist > thresholds.far    + hysteresis) next = 'low'
      else                                             next = 'medium'
    } else {
      // low: only upgrade when clearly inside far threshold
      if      (dist < thresholds.medium - hysteresis) next = 'high'
      else if (dist < thresholds.far    - hysteresis) next = 'medium'
      else                                             next = 'low'
    }

    // Only trigger React re-render when level actually changes
    if (next !== current) {
      levelRef.current = next
      setLevel(next)
    }
  })

  if (level === 'low')    return <>{lowDetail}</>
  if (level === 'medium') return <>{mediumDetail}</>
  return <>{highDetail}</>
}

// ─── Helper: derive wall centers from room dimensions ─────────────────────────
// Use this to pass the correct wallCenter prop to each LodWalls instance.
//
// Example usage in StyledGalleryRoom:
//   const centers = getWallCenters(dim)
//   <LodWalls wallCenter={centers.front} highDetail={...} ... />

export interface WallCenters {
  front: THREE.Vector3
  back:  THREE.Vector3
  left:  THREE.Vector3
  right: THREE.Vector3
}

export function getWallCenters(dim: {
  halfW: number; halfD: number; height: number
}): WallCenters {
  const midH = dim.height / 2
  return {
    front: new THREE.Vector3(  0,       midH, -dim.halfD),
    back:  new THREE.Vector3(  0,       midH,  dim.halfD),
    left:  new THREE.Vector3(-dim.halfW, midH,  0),
    right: new THREE.Vector3( dim.halfW, midH,  0),
  }
}