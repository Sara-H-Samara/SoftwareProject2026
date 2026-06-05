import type { RoomDimensions, RoomMaterials } from '@/types/room-types'
import type { RoomShape } from '@/types/room-shape'
import { SHAPE_RATIOS } from '@/utils/galleryRoom.utils'

type V3 = [number, number, number]

interface CeilingTrackLightsProps {
  mat: RoomMaterials
  dim: RoomDimensions
  shape: RoomShape
  intensityScale?: number
}

const RAIL_COLOR = '#111111'
const HEAD_COLOR = '#1a1a1a'
const BULB_COLOR = '#fff8e0'

const RAIL_X_FRACS = [0.55, 0.18] as const
const LAMP_Z_FRACS = [0.82, 0.50, 0.0] as const

function TrackRail({ x, dim }: { x: number; dim: RoomDimensions }) {
  const railLength = dim.depth * 0.75
  const y = dim.height - 0.05

  return (
    <mesh position={[x, y, 0] as V3}>
      <boxGeometry args={[0.055, 0.055, railLength]} />
      <meshStandardMaterial color={RAIL_COLOR} metalness={0.95} roughness={0.08} />
    </mesh>
  )
}

function TrackLamp({
  x, z, dim, intensity,
}: {
  x: number
  z: number
  dim: RoomDimensions
  intensity: number
}) {
  const headY = dim.height - 0.07
  const bulbY = dim.height - 0.17
  const lightY = dim.height - 0.22

  const distFromCenter = Math.abs(x) / (0.55 * 0.1)
  const dropExtra = distFromCenter * 0.04

  return (
    <group>
      <mesh position={[x, headY + 0.06 + dropExtra / 2, z] as V3}>
        <cylinderGeometry args={[0.006, 0.006, 0.12 + dropExtra, 6]} />
        <meshStandardMaterial color={RAIL_COLOR} metalness={0.9} roughness={0.15} />
      </mesh>

      <mesh position={[x, headY, z] as V3}>
        <cylinderGeometry args={[0.062, 0.088, 0.15, 12]} />
        <meshStandardMaterial color={HEAD_COLOR} metalness={0.92} roughness={0.1} />
      </mesh>

      <mesh position={[x, headY - 0.04, z] as V3}>
        <cylinderGeometry args={[0.048, 0.058, 0.06, 12]} />
        <meshStandardMaterial color="#0a0a0a" metalness={0.5} roughness={0.5} />
      </mesh>

      <mesh position={[x, bulbY, z] as V3}>
        <sphereGeometry args={[0.036, 10, 10]} />
        <meshStandardMaterial color={BULB_COLOR} emissive={BULB_COLOR} emissiveIntensity={4.2} />
      </mesh>

      <pointLight
        position={[x, lightY, z] as V3}
        color={BULB_COLOR}
        intensity={intensity}
        distance={dim.height * 2.2}
        decay={2}
      />
    </group>
  )
}

function getRectanglePositions(dim: RoomDimensions): [number, number][] {
  const xPositions = RAIL_X_FRACS.flatMap((f) => [-dim.halfW * f, dim.halfW * f])
  const zPositions = LAMP_Z_FRACS.flatMap((f) => (f === 0 ? [0] : [-dim.halfD * f, dim.halfD * f]))
  return xPositions.flatMap((x) => zPositions.map((z) => [x, z] as [number, number]))
}

function getLShapePositions(dim: RoomDimensions): [number, number][] {
  const positions: [number, number][] = []
  const wingW = dim.width * SHAPE_RATIOS.L_WING_W
  const wingD = dim.depth * SHAPE_RATIOS.L_WING_D
  const stepX = dim.halfW - wingW
  const stepZ = dim.halfD - wingD

  const barMidZ = -dim.halfD * 0.55
  const armMidZ = stepZ * 0.5
  const stemMidZ = dim.halfD * 0.6

  const x1 = dim.halfW * 0.45
  const x2 = dim.halfW * 0.15
  
  const innerX = stepX * 0.6

  positions.push([-x1, barMidZ], [x1, barMidZ])
  positions.push([-x2, barMidZ], [x2, barMidZ])
  
  positions.push([-dim.halfW + 0.8, armMidZ])
  positions.push([-innerX, stemMidZ])
  positions.push([innerX, stemMidZ])

  return positions
}

function getTShapePositions(dim: RoomDimensions): [number, number][] {
  const positions: [number, number][] = []
  const stemHalfW = (dim.width * SHAPE_RATIOS.T_STEM_W) / 2
  const stemDepth = dim.depth * SHAPE_RATIOS.T_STEM_D
  const stemBaseZ = dim.halfD - stemDepth
  const barMidZ = (-dim.halfD + stemBaseZ) / 2

  const x1 = dim.halfW * 0.45
  const x2 = dim.halfW * 0.15

  positions.push([-x1, barMidZ], [x1, barMidZ])
  positions.push([-x2, barMidZ], [x2, barMidZ])

  positions.push([-stemHalfW * 0.5, stemBaseZ + stemDepth * 0.3])
  positions.push([stemHalfW * 0.5, stemBaseZ + stemDepth * 0.3])
  positions.push([0, stemBaseZ + stemDepth * 0.65])

  return positions
}

function getUShapePositions(dim: RoomDimensions): [number, number][] {
  const positions: [number, number][] = []
  const openingW = dim.width * SHAPE_RATIOS.U_OPENING_W
  const armDepth = dim.depth * SHAPE_RATIOS.U_ARM_D
  const armW = (dim.width - openingW) / 2
  const spineZ = dim.halfD - armDepth

  const frontZ = -dim.halfD * 0.55
  const armMidZ = spineZ + armDepth * 0.4

  const x1 = dim.halfW * 0.45
  const x2 = dim.halfW * 0.15

  positions.push([-x1, frontZ], [x1, frontZ])
  positions.push([-x2, frontZ], [x2, frontZ])

  positions.push([-dim.halfW + armW * 0.6, armMidZ])
  positions.push([dim.halfW - armW * 0.6, armMidZ])

  return positions
}

function getCircularPositions(dim: RoomDimensions): [number, number][] {
  const radius = dim.halfW * 0.55
  const count = 8
  const positions: [number, number][] = []

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2
    positions.push([Math.cos(angle) * radius, Math.sin(angle) * radius])
  }

  positions.push([0, 0])

  return positions
}

function getOctagonalPositions(dim: RoomDimensions): [number, number][] {
  const radius = dim.halfW * 0.55
  const count = 8
  const positions: [number, number][] = []

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2
    positions.push([Math.cos(angle) * radius, Math.sin(angle) * radius])
  }

  positions.push([0, 0])

  return positions
}

export function CeilingTrackLights({
  mat,
  dim,
  shape,
  intensityScale = 1,
}: CeilingTrackLightsProps) {
  if (!mat.hasSpotlights) return null

  const baseIntensity = (mat.spotlightIntensity ?? 1.0) * intensityScale
  let lampPositions: [number, number][] = []
  let showRails = false

  if (shape === 'rectangle' || shape === 'square') {
    lampPositions = getRectanglePositions(dim)
    showRails = true
  } else if (shape === 'l_shaped') {
    lampPositions = getLShapePositions(dim)
  } else if (shape === 't_shaped') {
    lampPositions = getTShapePositions(dim)
  } else if (shape === 'u_shaped') {
    lampPositions = getUShapePositions(dim)
  } else if (shape === 'circular') {
    lampPositions = getCircularPositions(dim)
  } else if (shape === 'octagonal') {
    lampPositions = getOctagonalPositions(dim)
  } else {
    return null
  }

  return (
    <group>
      {showRails &&
        RAIL_X_FRACS.flatMap((f) => [-dim.halfW * f, dim.halfW * f]).map((x) => (
          <TrackRail key={`rail-${x}`} x={x} dim={dim} />
        ))}

      {lampPositions.map(([x, z], i) => (
        <TrackLamp key={`lamp-${i}`} x={x} z={z} dim={dim} intensity={baseIntensity * 0.42} />
      ))}
    </group>
  )
}