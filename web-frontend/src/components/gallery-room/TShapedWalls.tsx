// src/components/3d/TShapedWalls.tsx
import { ReactNode } from 'react'
import { SHAPE_RATIOS } from '@/utils/galleryRoom.utils'

type V3 = [number, number, number]

const TH = 0.22 // wall thickness
const EPS = 0.005 // tiny overlap for gap prevention

interface DimProps {
  halfW: number
  halfD: number
  height: number
  width: number
  depth: number
}

interface TShapedWallsProps {
  dim: DimProps
  mat: { wallRoughness: number; trimColor: string }
  accentWall: { enabled: boolean; wall: string; color: string }
  materialType: string
  wallColor: string
  ceiling: ReactNode
  moldings: ReactNode | null
  gridHelper: ReactNode | null
}

export function TShapedWalls({
  dim,
  mat,
  accentWall,
  materialType,
  wallColor,
  ceiling,
  moldings,
  gridHelper,
}: TShapedWallsProps) {
  const halfH = dim.height / 2

  const isGlass = materialType === 'glass'
  const isMirror = materialType === 'mirror'

  const baseMat = {
    roughness: mat.wallRoughness,
    metalness: isMirror ? 0.98 : isGlass ? 0.9 : 0.05,
    transparent: isGlass,
    opacity: isGlass ? 0.22 : 1,
  }

  const color = (wall: string) =>
    accentWall.enabled && accentWall.wall === wall
      ? accentWall.color
      : wallColor

  // ============================================================================
  // T SHAPE DIMENSIONS
  // ============================================================================

  const stemW = dim.width * SHAPE_RATIOS.T_STEM_W
  const stemHalfW = stemW / 2

  const stemDepth = dim.depth * SHAPE_RATIOS.T_STEM_D

  // where stem begins
  const stemBaseZ = dim.halfD - stemDepth

  // top bar depth
  const barDepth = dim.depth - stemDepth

  // centers
  const barMidZ = -dim.halfD + barDepth / 2
  const stemMidZ = stemBaseZ + stemDepth / 2

  // side wing widths
  const wingW = dim.halfW - stemHalfW

  // wing centers
  const leftWingCX = -dim.halfW + wingW / 2
  const rightWingCX = dim.halfW - wingW / 2

  return (
    <>
      {ceiling}

      {/* ========================================================================= */}
      {/* FRONT WALL */}
      {/* ========================================================================= */}

      <mesh position={[0, halfH, -dim.halfD] as V3}>
        <boxGeometry args={[dim.width + TH, dim.height, TH]} />
        <meshStandardMaterial
          {...baseMat}
          color={color('front')}
        />
      </mesh>

      {/* ========================================================================= */}
      {/* LEFT BAR WALL */}
      {/* ========================================================================= */}

      <mesh position={[-dim.halfW, halfH, barMidZ] as V3}>
        <boxGeometry
          args={[TH, dim.height, barDepth + TH + EPS]}
        />
        <meshStandardMaterial
          {...baseMat}
          color={color('left')}
        />
      </mesh>

      {/* ========================================================================= */}
      {/* RIGHT BAR WALL */}
      {/* ========================================================================= */}

      <mesh position={[dim.halfW, halfH, barMidZ] as V3}>
        <boxGeometry
          args={[TH, dim.height, barDepth + TH + EPS]}
        />
        <meshStandardMaterial
          {...baseMat}
          color={color('right')}
        />
      </mesh>

      {/* ========================================================================= */}
      {/* LEFT BACK WING */}
      {/* IMPORTANT: NO EPS here to keep stem opening clean */}
      {/* ========================================================================= */}

      <mesh position={[leftWingCX, halfH, stemBaseZ] as V3}>
        <boxGeometry
          args={[wingW, dim.height, TH]}
        />
        <meshStandardMaterial
          {...baseMat}
          color={color('back')}
        />
      </mesh>

      {/* ========================================================================= */}
      {/* RIGHT BACK WING */}
      {/* ========================================================================= */}

      <mesh position={[rightWingCX, halfH, stemBaseZ] as V3}>
        <boxGeometry
          args={[wingW, dim.height, TH]}
        />
        <meshStandardMaterial
          {...baseMat}
          color={color('back')}
        />
      </mesh>

      {/* ========================================================================= */}
      {/* LEFT STEM WALL */}
      {/* ========================================================================= */}

      <mesh position={[-stemHalfW, halfH, stemMidZ] as V3}>
        <boxGeometry
          args={[TH, dim.height, stemDepth + TH + EPS]}
        />
        <meshStandardMaterial
          {...baseMat}
          color={color('stem')}
        />
      </mesh>

      {/* ========================================================================= */}
      {/* RIGHT STEM WALL */}
      {/* ========================================================================= */}

      <mesh position={[stemHalfW, halfH, stemMidZ] as V3}>
        <boxGeometry
          args={[TH, dim.height, stemDepth + TH + EPS]}
        />
        <meshStandardMaterial
          {...baseMat}
          color={color('stem')}
        />
      </mesh>

      {/* ========================================================================= */}
      {/* STEM BACK WALL */}
      {/* ========================================================================= */}

      <mesh position={[0, halfH, dim.halfD] as V3}>
        <boxGeometry
          args={[stemW + TH, dim.height, TH]}
        />
        <meshStandardMaterial
          {...baseMat}
          color={color('stem')}
        />
      </mesh>

      {/* ========================================================================= */}
      {/* STEM CORNER TRIMS */}
      {/* ========================================================================= */}

      {([-stemHalfW, stemHalfW] as const).map((x, i) => (
        <mesh
          key={`trim-${i}`}
          position={[x, 0.08, stemMidZ] as V3}
        >
          <boxGeometry args={[0.10, 0.16, stemDepth]} />
          <meshStandardMaterial
            color={mat.trimColor}
            metalness={0.55}
            roughness={0.30}
          />
        </mesh>
      ))}

      {moldings}
      {gridHelper}
    </>
  )
}