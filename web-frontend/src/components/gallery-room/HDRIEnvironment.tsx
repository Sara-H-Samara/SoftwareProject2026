import { Environment, Lightformer } from '@react-three/drei'
import { Suspense } from 'react'
import type { GalleryCustomization } from '@/types/gallery-customization'
import type { RoomShape } from '@/types/room-shape'
import { SHAPE_RATIOS } from '@/utils/galleryRoom.utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface GalleryEnvironmentProps {
  customization?: GalleryCustomization | null
  showBackground?: boolean
}

type EnvPreset =
  | 'apartment' | 'city'  | 'dawn'   | 'forest'
  | 'lobby'     | 'night' | 'park'   | 'studio'
  | 'sunset'    | 'warehouse'

interface Dim {
  halfW:  number
  halfD:  number
  height: number
}

// ─── Resolvers ────────────────────────────────────────────────────────────────

function resolvePreset(c?: GalleryCustomization | null): EnvPreset {
  const layout    = c?.structure?.layoutType         ?? 'single_room'
  const lightType = c?.lighting?.mainLighting?.type  ?? 'recessed'
  const colorTemp = c?.lighting?.mainLighting?.colorTemp ?? 'daylight'

  if (lightType === 'natural') return colorTemp === 'warm' ? 'sunset' : 'park'
  if (lightType === 'pendant') return layout === 'loft' ? 'warehouse' : 'apartment'
  if (layout === 'courtyard')  return 'forest'
  if (layout === 'loft')       return 'warehouse'
  return 'lobby'
}

function resolveIntensities(c?: GalleryCustomization | null) {
  const ambient = c?.lighting?.ambientLight?.intensity ?? 0.75
  return {
    env: ambient < 0.4 ? 0.35 : ambient * 0.88,
    bg:  Math.min(ambient * 0.9, 0.85),
  }
}

// ─── Shape-aware light positions ─────────────────────────────────────────────
// Returns [x, z] positions that always fall INSIDE the room floor for each shape.
// For complex shapes (L/T/U), lights are placed only in the guaranteed-indoor area.

function getLightPositions(
  shape: RoomShape,
  dim:   Dim
): [number, number][] {
  const { halfW, halfD } = dim

  switch (shape) {
    case 'circular':
    case 'octagonal': {
      // Safe radius: 45% of the inradius so all lights are inside the polygon
      const safeR = Math.min(halfW, halfD) * 0.45
      return [
        [-safeR * 0.7,  -safeR * 0.7],
        [ safeR * 0.7,  -safeR * 0.7],
        [-safeR * 0.7,   safeR * 0.7],
        [ safeR * 0.7,   safeR * 0.7],
      ]
    }

    case 'l_shaped': {
      // L removes the top-right quadrant.
      // Safe zone: the bottom-left 3/4 of the room (always present in an L).
      const wx = halfW * (1 - SHAPE_RATIOS.L_WING_W) * 0.5  // well inside the remaining bar
      const wz = halfD * (1 - SHAPE_RATIOS.L_WING_D) * 0.5
      return [
        [-halfW * 0.4, -halfD * 0.4],  // front-left   (main area)
        [ wx,           -halfD * 0.4],  // front-center (main area, away from void)
        [-halfW * 0.4,  wz           ], // back-left     (main area)
        [ wx,           wz           ], // center        (junction area)
      ]
    }

    case 't_shaped': {
      // T has the full top-bar and a narrow stem below.
      // Place 2 lights in the top-bar and 1 in the stem center.
      const barMidZ   = -(halfD * SHAPE_RATIOS.T_STEM_D * 0.5) // center of top bar
      return [
        [-halfW * 0.4,  barMidZ],  // left of top-bar
        [ halfW * 0.4,  barMidZ],  // right of top-bar
        [ 0,            halfD * (1 - SHAPE_RATIOS.T_STEM_D * 0.5) * 0.5], // stem center
      ]
    }

    case 'u_shaped': {
      // U has left arm, right arm, and main body.
      // Avoid the center-back opening.
      const armInnerX = halfW - (halfW - halfW * SHAPE_RATIOS.U_OPENING_W * 0.5) * 0.5
      const armMidZ   = halfD * (1 - SHAPE_RATIOS.U_ARM_D * 0.5)
      return [
        [-halfW * 0.4, -halfD * 0.4],  // main body left
        [ halfW * 0.4, -halfD * 0.4],  // main body right
        [-armInnerX,    armMidZ     ],  // left arm
        [ armInnerX,    armMidZ     ],  // right arm
      ]
    }

    // rectangle / square / courtyard → symmetric 2×2 grid
    default: {
      const ox = halfW * 0.4
      const oz = halfD * 0.4
      return [
        [-ox, -oz], [ox, -oz],
        [-ox,  oz], [ox,  oz],
      ]
    }
  }
}

// ─── Ceiling fill lights ──────────────────────────────────────────────────────

function CeilingFillLights({
  customization,
  dim,
}: {
  customization?: GalleryCustomization | null
  dim: Dim
}) {
  const shape = (customization?.structure?.shape ?? 'rectangle') as RoomShape
  const y     = dim.height - 0.12
  const scale = Math.min(dim.halfW, dim.halfD) * 0.55

  const positions = getLightPositions(shape, dim)

  return (
    <>
      {positions.map(([x, z], i) => (
        <Lightformer
          key={i}
          form="rect"
          intensity={2.0}
          color="#fff6e8"
          scale={scale}
          position={[x, y, z]}
          rotation={[Math.PI / 2, 0, 0]}
        />
      ))}

      {/* Soft fill from the front wall — always safe regardless of shape */}
      <Lightformer
        form="rect"
        intensity={0.6}
        color="#e8f0ff"
        scale={scale * 0.8}
        position={[0, dim.height * 0.5, -dim.halfD * 0.92]}
        rotation={[0, 0, 0]}
      />
    </>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function GalleryEnvironment({
  customization,
  showBackground = false,
}: GalleryEnvironmentProps) {
  const preset      = resolvePreset(customization)
  const { env, bg } = resolveIntensities(customization)

  const hasSpotlights  = customization?.lighting?.spotlights?.enabled ?? true
  const isNaturalLight = customization?.lighting?.mainLighting?.type === 'natural'
  const showFillLights = !hasSpotlights && !isNaturalLight

  const dim: Dim = {
    halfW:  (customization?.structure?.roomWidth  ?? 22) / 2,
    halfD:  (customization?.structure?.roomDepth  ?? 22) / 2,
    height:  customization?.structure?.wallHeight ?? 4.8,
  }

  return (
    <Suspense fallback={null}>
      <Environment
        preset={preset}
        background={showBackground}
        backgroundIntensity={showBackground ? bg : 0}
        environmentIntensity={env}
        backgroundBlurriness={showBackground ? 0.55 : 0}
      />

      {showFillLights && (
        <CeilingFillLights customization={customization} dim={dim} />
      )}
    </Suspense>
  )
}