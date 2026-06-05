import { ReactNode } from 'react'
import { SHAPE_RATIOS } from '@/utils/galleryRoom.utils'

type V3 = [number, number, number]

const TH = 0.22

interface DimProps {
  halfW: number
  halfD: number
  height: number
  width: number
  depth: number
}

interface MatProps {
  wallRoughness: number
  trimColor: string
}

interface LShapedWallsProps {
  dim:          DimProps
  mat:          MatProps
  accentWall:   { enabled: boolean; wall: string; color: string }
  materialType: string
  wallColor:    string
  ceiling:      ReactNode
  moldings:     ReactNode | null
  gridHelper:   ReactNode | null
}

export function LShapedWalls({
  dim, mat, accentWall, materialType, wallColor, ceiling, moldings, gridHelper,
}: LShapedWallsProps) {
  const halfH = dim.height / 2

  const isGlass  = materialType === 'glass'
  const isMirror = materialType === 'mirror'

  const solidProps = {
    roughness: mat.wallRoughness,
    metalness: isMirror ? 0.98 : 0.05,
  }

  const color = (wall: string) => {
    if (accentWall.enabled && accentWall.wall === wall) {
      return accentWall.color
    }
    return wallColor
  }

  const wingW = dim.width  * SHAPE_RATIOS.L_WING_W
  const wingD = dim.depth  * SHAPE_RATIOS.L_WING_D

  const stepX =  dim.halfW - wingW
  const stepZ =  dim.halfD - wingD

  const renderWall = (key: string, position: V3, size: V3, wallSide: string) => {
    if (isGlass) {
      return (
        <mesh key={key} position={position}>
          <boxGeometry args={size} />
          <meshPhysicalMaterial
            color={color(wallSide)}
            roughness={0.04}
            metalness={0.05}
            transmission={0.85}
            thickness={TH}
            transparent
            opacity={0.35}
          />
        </mesh>
      )
    }
    
    return (
      <mesh key={key} position={position}>
        <boxGeometry args={size} />
        <meshStandardMaterial
          {...solidProps}
          color={color(wallSide)}
        />
      </mesh>
    )
  }

  const renderMoldingStrip = (key: string, position: V3, width: number, depth: number) => {
    if (!moldings) return null
    return (
      <mesh key={key} position={position}>
        <boxGeometry args={[width, 0.08, depth]} />
        <meshStandardMaterial color={mat.trimColor} metalness={0.55} roughness={0.3} />
      </mesh>
    )
  }

  return (
    <>
      {ceiling}

      {/* الجدران */}
      {renderWall('front-wall', [0, halfH, -dim.halfD], [dim.width + TH, dim.height, TH], 'front')}
      {renderWall('back-wall', [(-dim.halfW + stepX) / 2, halfH, dim.halfD], [stepX + dim.halfW + TH, dim.height, TH], 'back')}
      {renderWall('left-wall', [-dim.halfW, halfH, 0], [TH, dim.height, dim.depth + TH], 'left')}
      {renderWall('right-wall', [dim.halfW, halfH, (-dim.halfD + stepZ) / 2], [TH, dim.height, dim.halfD + stepZ + TH], 'right')}
      {renderWall('inner-h-wall', [(stepX + dim.halfW) / 2, halfH, stepZ], [dim.halfW - stepX + TH, dim.height, TH], 'right')}
      {renderWall('inner-v-wall', [stepX, halfH, (stepZ + dim.halfD) / 2], [TH, dim.height, dim.halfD - stepZ + TH], 'right')}

      {/* Moldings - زخارف أرضية على طول الجدران */}
      {moldings && (
        <>
          {/* Front wall molding */}
          {renderMoldingStrip('molding-front', [0, 0.04, -dim.halfD + 0.01], dim.width + TH, 0.12)}
          
          {/* Back wall molding */}
          {renderMoldingStrip('molding-back', [(-dim.halfW + stepX) / 2, 0.04, dim.halfD - 0.01], stepX + dim.halfW + TH, 0.12)}
          
          {/* Left wall molding */}
          {renderMoldingStrip('molding-left', [-dim.halfW + 0.01, 0.04, 0], 0.12, dim.depth + TH)}
          
          {/* Right wall molding */}
          {renderMoldingStrip('molding-right', [dim.halfW - 0.01, 0.04, (-dim.halfD + stepZ) / 2], 0.12, dim.halfD + stepZ + TH)}
          
          {/* Inner horizontal wall molding */}
          {renderMoldingStrip('molding-inner-h', [(stepX + dim.halfW) / 2, 0.04, stepZ + 0.01], dim.halfW - stepX + TH, 0.12)}
          
          {/* Inner vertical wall molding */}
          {renderMoldingStrip('molding-inner-v', [stepX - 0.01, 0.04, (stepZ + dim.halfD) / 2], 0.12, dim.halfD - stepZ + TH)}
        </>
      )}

      {gridHelper}
    </>
  )
}