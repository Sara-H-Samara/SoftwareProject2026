import { ReactNode } from 'react'
import type { RoomDimensions, RoomMaterials } from '@/types/room-types'
import type { Walls } from '@/types/gallery-customization'

type V3 = [number, number, number]

const TH = 0.22

interface RectangleWallsProps {
  dim:          RoomDimensions
  mat:          RoomMaterials
  materialType: Walls['material']
  wallColor:    string
  ceiling:      ReactNode
  moldings:     ReactNode | null
  gridHelper:   ReactNode | null
}

export function RectangleWalls({
  dim, mat, materialType, wallColor,
  ceiling, moldings, gridHelper,
}: RectangleWallsProps) {
  const halfH    = dim.height / 2
  const isGlass  = materialType === 'glass'
  const isMirror = materialType === 'mirror'

  const solidProps = {
    roughness: mat.wallRoughness,
    metalness: isMirror ? 0.98 : 0.05,
  }

  const walls = [
    { side: 'back',  pos: [0, halfH,  (dim.halfD + TH / 2)] as V3, size: [dim.width + TH, dim.height, TH] as V3 },
    { side: 'left',  pos: [-(dim.halfW + TH / 2), halfH, 0] as V3, size: [TH, dim.height, dim.depth + TH] as V3 },
    { side: 'right', pos: [ (dim.halfW + TH / 2), halfH, 0] as V3, size: [TH, dim.height, dim.depth + TH] as V3 },
  ] as const

  return (
    <>
      {ceiling}

      {walls.map(({ side, pos, size }) => (
        <mesh key={side} position={pos}>
          <boxGeometry args={size} />
          {isGlass ? (
            <meshPhysicalMaterial
              color={wallColor}
              roughness={0.04}
              metalness={0.05}
              transmission={0.85}
              thickness={TH}
              transparent
              opacity={0.35}
            />
          ) : (
            <meshStandardMaterial {...solidProps} color={wallColor} />
          )}
        </mesh>
      ))}

      {moldings}
      {gridHelper}
    </>
  )
}