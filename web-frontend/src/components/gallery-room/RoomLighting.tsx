import type { RoomDimensions, RoomMaterials } from '@/types/room-types'
import type { GalleryCustomization } from '@/types/gallery-customization'

type V3 = [number, number, number]

// ─── Types ────────────────────────────────────────────────────────────────────

interface RoomLightingProps {
  mat:    RoomMaterials
  dim:    RoomDimensions
  layout?: GalleryCustomization['structure']['layoutType']
}

// ─── Spotlight grid positions ─────────────────────────────────────────────────
// Pre-compute as fractions — each light sits above an artwork wall zone.
// Two X rails × three Z positions = 6 lights total.
// X at ±65% halfW (near side walls) and Z at ±60% halfD + center.

const SPOT_X_FRACS = [-0.65 * 0.5, 0.65 * 0.5] as const
const SPOT_Z_FRACS = [-0.65 * 0.6, 0,           0.65 * 0.6] as const

// ─── Component ────────────────────────────────────────────────────────────────

export function RoomLighting({ mat, dim, layout = 'single_room' }: RoomLightingProps) {
  // Courtyard / natural light rooms get a stronger ambient, no directional shadow
  const isCourtyardOrNatural = layout === 'courtyard'
  const ambientMult  = isCourtyardOrNatural ? 1.25 : 1.0
  const shadowEnable = !isCourtyardOrNatural

  return (
    <>
      {/* Ambient — fills the room evenly */}
      <ambientLight
        intensity={mat.ambientIntensity * ambientMult * 1}
        color={mat.ambientColor}
      />

      {/* Main directional light — sun equivalent, casts soft shadows */}
      <directionalLight
        position={[5, dim.height + 1, 4] as V3}
        intensity={mat.mainLightIntensity * 0.6}
        color="#fff8f0"
        castShadow={shadowEnable}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0002}
        shadow-camera-near={0.1}
        shadow-camera-far={dim.height * 4}
      />

      {/* Warm fill — softens harsh shadows under the directional light */}
      <pointLight
        position={[0, 0.5, 0]}
        intensity={0.4}
        color="#c8b090"
        decay={1.5}
        distance={dim.width * 1.5}
      />

      {/* Spotlight grid — only when spotlights are enabled in the customization */}
      {mat.hasSpotlights && (
        <SpotlightGrid mat={mat} dim={dim} />
      )}
    </>
  )
}

// ─── Spotlight grid ───────────────────────────────────────────────────────────
// Extracted to a separate component so React can skip reconciling it entirely
// when mat.hasSpotlights is false — more efficient than useMemo on JSX.

function SpotlightGrid({ mat, dim }: { mat: RoomMaterials; dim: RoomDimensions }) {
  const y = dim.height * 0.92
  const dist = dim.height * 3

  return (
    <>
      {SPOT_X_FRACS.map(xf =>
        SPOT_Z_FRACS.map(zf => {
          const x = dim.halfW * xf
          const z = dim.halfD * zf
          return (
            <pointLight
              key={`sp-${xf}-${zf}`}
              position={[x, y, z] as V3}
              intensity={mat.spotlightIntensity * 0.45}
              color="#fff0d8"
              distance={dist}
              decay={1.5}
              castShadow={false}
            />
          )
        })
      )}
    </>
  )
}