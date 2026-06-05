import { ReactNode } from 'react'
import type { RoomDimensions, RoomMaterials } from '@/types/room-types'
import type { Walls } from '@/types/gallery-customization'

type V3 = [number, number, number]

const TH   = 0.22
const SEGS = 8

interface OctagonalWallsProps {
  dim:          RoomDimensions
  mat:          RoomMaterials
  accentWall:   Walls['accentWall']
  materialType: Walls['material']
  wallColor:    string
  ceiling:      ReactNode
  moldings:     ReactNode | null
  gridHelper:   ReactNode | null
}

export function OctagonalWalls({
  dim, mat, accentWall, materialType, wallColor,
  ceiling,
}: OctagonalWallsProps) {
  const halfH    = dim.height / 2
  const isGlass  = materialType === 'glass'
  const isMirror = materialType === 'mirror'

  const solidProps = {
    roughness:   mat.wallRoughness,
    metalness:   isMirror ? 0.98 : 0.05,
  }

  const r        = dim.width / 2
  const chord    = 2 * r * Math.sin(Math.PI / SEGS)

  const ACCENT_MAP: Record<string, number> = {
    right: 0, frontRight: 1, front: 2, frontLeft: 3,
    left:  4, backLeft:  5, back:  6, backRight:  7,
  }
  const accentIdx = accentWall.enabled ? (ACCENT_MAP[accentWall.wall] ?? -1) : -1

  const wallSegments = Array.from({ length: SEGS }, (_, i) => {
    const a0 = (i / SEGS) * 2 * Math.PI - Math.PI / SEGS
    const a1 = ((i + 1) / SEGS) * 2 * Math.PI - Math.PI / SEGS
    const sx = Math.cos(a0) * r, sz = Math.sin(a0) * r
    const ex = Math.cos(a1) * r, ez = Math.sin(a1) * r
    const cx = (sx + ex) / 2,    cz = (sz + ez) / 2
    const dx = ex - sx,           dz = ez - sz
    const rotY  = -Math.atan2(dz, dx)
    const color = i === accentIdx ? accentWall.color : wallColor
    return { cx, cz, rotY, i, color }
  })

  return (
    <>
      {ceiling}

      {/* ── Wall segments ── */}
      {wallSegments.map(({ cx, cz, rotY, color, i }) => (
        <mesh
          key={`wall-${i}`}
          position={[cx, halfH, cz] as V3}
          rotation={[0, rotY, 0] as V3}
          receiveShadow
        >
          <boxGeometry args={[chord, dim.height, TH]} />
          {isGlass ? (
            <meshPhysicalMaterial
              color={color}
              roughness={0.04}
              metalness={0.05}
              transmission={0.85}
              thickness={TH}
              transparent
              opacity={0.35}
            />
          ) : (
            <meshStandardMaterial {...solidProps} color={color} />
          )}
        </mesh>
      ))}

      {/* ── Crown molding strips ── */}
      {wallSegments.map(({ cx, cz, rotY, i }) => (
        <mesh key={`crown-${i}`} position={[cx, dim.height - 0.09, cz] as V3} rotation={[0, rotY, 0] as V3}>
          <boxGeometry args={[chord, 0.18, 0.18]} />
          <meshStandardMaterial color={mat.trimColor} metalness={0.55} roughness={0.30} />
        </mesh>
      ))}

      {/* ── Baseboard strips ── */}
      {wallSegments.map(({ cx, cz, rotY, i }) => (
        <mesh key={`base-${i}`} position={[cx, 0.08, cz] as V3} rotation={[0, rotY, 0] as V3}>
          <boxGeometry args={[chord, 0.16, 0.10]} />
          <meshStandardMaterial color={mat.trimColor} metalness={0.55} roughness={0.30} />
        </mesh>
      ))}

    </>
  )
}