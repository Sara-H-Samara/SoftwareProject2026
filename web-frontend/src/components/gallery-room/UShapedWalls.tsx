// src/components/3d/UShapedWalls.tsx
import { ReactNode } from 'react'
import { SHAPE_RATIOS } from '@/utils/galleryRoom.utils'

type V3 = [number, number, number]

const TH = 0.22
const EPS = 0.005 // overlap to prevent gaps

interface DimProps {
  halfW: number
  halfD: number
  height: number
  width: number
  depth: number
}

interface UShapedWallsProps {
  dim: DimProps
  mat: { wallRoughness: number; trimColor: string }
  accentWall: { enabled: boolean; wall: string; color: string }
  materialType: string
  wallColor: string
  ceiling: ReactNode
  moldings: ReactNode | null
  gridHelper: ReactNode | null
}

export function UShapedWalls({
  dim, mat, accentWall, materialType, wallColor,
  ceiling, moldings, gridHelper,
}: UShapedWallsProps) {
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
    accentWall.enabled && accentWall.wall === wall ? accentWall.color : wallColor

  /**
   * U-shape layout (top-down, Z+ toward viewer):
   *
   *  ┌──────────────────────────────────┐  z = -halfD  (front)
   *  │                                  │
   *  │           main body              │
   *  │                                  │
   *  ├──────┬──────────────┬───────┤  z = spineZ
   *  │ left │   opening    │ right │
   *  │ arm  │  (no walls)  │ arm   │
   *  └──────┘              └───────┘  z = +halfD  (back)
   */

  const openingW = dim.width * SHAPE_RATIOS.U_OPENING_W
  const armW = (dim.width - openingW) / 2
  const armDepth = dim.depth * SHAPE_RATIOS.U_ARM_D
  const spineZ = dim.halfD - armDepth
  const leftArmInnerX = -dim.halfW + armW
  const rightArmInnerX = dim.halfW - armW
  const leftArmCX = -dim.halfW + armW / 2
  const rightArmCX = dim.halfW - armW / 2
  const armMidZ = spineZ + armDepth / 2

  return (
    <>
      {ceiling}

      {/* ========================================================================= */}
      {/* 1. FRONT WALL - full width */}
      {/* ========================================================================= */}
      <mesh position={[0, halfH, -dim.halfD] as V3}>
        <boxGeometry args={[dim.width + TH, dim.height, TH]} />
        <meshStandardMaterial {...baseMat} color={color('front')} />
      </mesh>

      {/* ========================================================================= */}
      {/* 2. LEFT WALL - full depth */}
      {/* ========================================================================= */}
      <mesh position={[-dim.halfW, halfH, 0] as V3}>
        <boxGeometry args={[TH, dim.height, dim.depth + TH]} />
        <meshStandardMaterial {...baseMat} color={color('left')} />
      </mesh>

      {/* ========================================================================= */}
      {/* 3. RIGHT WALL - full depth */}
      {/* ========================================================================= */}
      <mesh position={[dim.halfW, halfH, 0] as V3}>
        <boxGeometry args={[TH, dim.height, dim.depth + TH]} />
        <meshStandardMaterial {...baseMat} color={color('right')} />
      </mesh>

      {/* ========================================================================= */}
      {/* 4. SPINE WALL - closes the back of the main opening */}
      {/* ========================================================================= */}
      <mesh position={[0, halfH, spineZ] as V3}>
        <boxGeometry args={[openingW + EPS, dim.height, TH]} />
        <meshStandardMaterial {...baseMat} color={color('spine')} />
      </mesh>

      {/* ========================================================================= */}
      {/* 5. LEFT ARM BACK WALL */}
      {/* ========================================================================= */}
      <mesh position={[leftArmCX, halfH, dim.halfD] as V3}>
        <boxGeometry args={[armW + EPS, dim.height, TH]} />
        <meshStandardMaterial {...baseMat} color={color('back')} />
      </mesh>

      {/* ========================================================================= */}
      {/* 6. RIGHT ARM BACK WALL */}
      {/* ========================================================================= */}
      <mesh position={[rightArmCX, halfH, dim.halfD] as V3}>
        <boxGeometry args={[armW + EPS, dim.height, TH]} />
        <meshStandardMaterial {...baseMat} color={color('back')} />
      </mesh>

      {/* ========================================================================= */}
      {/* 7. LEFT INNER ARM WALL */}
      {/* ========================================================================= */}
      <mesh position={[leftArmInnerX, halfH, armMidZ] as V3}>
        <boxGeometry args={[TH, dim.height, armDepth + EPS]} />
        <meshStandardMaterial {...baseMat} color={color('inner')} />
      </mesh>

      {/* ========================================================================= */}
      {/* 8. RIGHT INNER ARM WALL */}
      {/* ========================================================================= */}
      <mesh position={[rightArmInnerX, halfH, armMidZ] as V3}>
        <boxGeometry args={[TH, dim.height, armDepth + EPS]} />
        <meshStandardMaterial {...baseMat} color={color('inner')} />
      </mesh>

      {/* ========================================================================= */}
      {/* 9. LEFT CORNER FILL - connects spine to left inner wall */}
      {/* ========================================================================= */}
      <mesh position={[leftArmInnerX, halfH, spineZ] as V3}>
        <boxGeometry args={[TH, dim.height, TH]} />
        <meshStandardMaterial {...baseMat} color={color('inner')} />
      </mesh>

      {/* ========================================================================= */}
      {/* 10. RIGHT CORNER FILL - connects spine to right inner wall */}
      {/* ========================================================================= */}
      <mesh position={[rightArmInnerX, halfH, spineZ] as V3}>
        <boxGeometry args={[TH, dim.height, TH]} />
        <meshStandardMaterial {...baseMat} color={color('inner')} />
      </mesh>

      {/* ========================================================================= */}
      {/* TRIM DETAILS */}
      {/* ========================================================================= */}

      {/* Left inner corner trim (where spine meets left inner wall) */}
      <mesh position={[leftArmInnerX, 0.08, spineZ] as V3}>
        <boxGeometry args={[0.10, 0.16, 0.10]} />
        <meshStandardMaterial color={mat.trimColor} metalness={0.55} roughness={0.30} />
      </mesh>

      {/* Right inner corner trim (where spine meets right inner wall) */}
      <mesh position={[rightArmInnerX, 0.08, spineZ] as V3}>
        <boxGeometry args={[0.10, 0.16, 0.10]} />
        <meshStandardMaterial color={mat.trimColor} metalness={0.55} roughness={0.30} />
      </mesh>

      {/* Left arm trim strip */}
      <mesh position={[leftArmInnerX, 0.08, armMidZ] as V3}>
        <boxGeometry args={[0.10, 0.16, armDepth]} />
        <meshStandardMaterial color={mat.trimColor} metalness={0.55} roughness={0.30} />
      </mesh>

      {/* Right arm trim strip */}
      <mesh position={[rightArmInnerX, 0.08, armMidZ] as V3}>
        <boxGeometry args={[0.10, 0.16, armDepth]} />
        <meshStandardMaterial color={mat.trimColor} metalness={0.55} roughness={0.30} />
      </mesh>

      {/* Spine base trim (where floor meets spine) */}
      <mesh position={[0, 0.08, spineZ] as V3}>
        <boxGeometry args={[openingW, 0.16, 0.10]} />
        <meshStandardMaterial color={mat.trimColor} metalness={0.55} roughness={0.30} />
      </mesh>

      {/* Back wall trim left */}
      <mesh position={[leftArmCX, 0.08, dim.halfD] as V3}>
        <boxGeometry args={[armW, 0.16, 0.10]} />
        <meshStandardMaterial color={mat.trimColor} metalness={0.55} roughness={0.30} />
      </mesh>

      {/* Back wall trim right */}
      <mesh position={[rightArmCX, 0.08, dim.halfD] as V3}>
        <boxGeometry args={[armW, 0.16, 0.10]} />
        <meshStandardMaterial color={mat.trimColor} metalness={0.55} roughness={0.30} />
      </mesh>

      {moldings}
      {gridHelper}
    </>
  )
}