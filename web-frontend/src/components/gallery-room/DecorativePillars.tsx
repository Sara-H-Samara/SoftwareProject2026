import type { RoomDimensions, RoomMaterials } from '@/types/room-types'
import type { RoomShape } from '@/types/room-shape'
import { SHAPE_RATIOS } from '@/utils/galleryRoom.utils'

type V3 = [number, number, number]

const SHAFT_TOP_R = 0.22
const SHAFT_BOT_R = 0.27
const TORUS_R = 0.35
const PLINTH_R = 0.39
const ABA_R = 0.36

interface PillarProps {
  h: number
  color: string
  trimMat: { color: string; metalness: number; roughness: number }
}

function Pillar({ h, color, trimMat }: PillarProps) {
  const plinthH = h * 0.052
  const torusH = h * 0.022
  const shaftH = h * 0.848
  const capitalH = h * 0.048
  const abacusH = h * 0.030

  const plinthTop = plinthH
  const torusTop = plinthTop + torusH
  const shaftTop = torusTop + shaftH
  const capitalTop = shaftTop + capitalH

  const shaftMat = { color, metalness: 0.38, roughness: 0.42 }

  return (
    <group>
      <mesh position={[0, plinthH / 2, 0] as V3}>
        <cylinderGeometry args={[PLINTH_R, PLINTH_R * 1.04, plinthH, 4]} />
        <meshStandardMaterial {...trimMat} />
      </mesh>

      <mesh position={[0, plinthTop + torusH / 2, 0] as V3}>
        <cylinderGeometry args={[TORUS_R, PLINTH_R, torusH, 20]} />
        <meshStandardMaterial {...trimMat} />
      </mesh>

      <mesh castShadow position={[0, torusTop + shaftH / 2, 0] as V3}>
        <cylinderGeometry args={[SHAFT_TOP_R, SHAFT_BOT_R, shaftH, 20]} />
        <meshStandardMaterial {...shaftMat} />
      </mesh>

      <mesh position={[0, shaftTop + capitalH / 2, 0] as V3}>
        <cylinderGeometry args={[ABA_R, SHAFT_TOP_R, capitalH, 20]} />
        <meshStandardMaterial {...trimMat} />
      </mesh>

      <mesh position={[0, capitalTop + abacusH / 2, 0] as V3}>
        <cylinderGeometry args={[ABA_R + 0.04, ABA_R, abacusH, 4]} />
        <meshStandardMaterial {...trimMat} />
      </mesh>
    </group>
  )
}

function getPillarPositions(shape: RoomShape, halfW: number, halfD: number): [number, number][] {
  switch (shape) {
    case 'rectangle':
    case 'square': {
      // 4 corners فقط
      return [
        [-halfW + 0.5, -halfD + 0.5],
        [halfW - 0.5, -halfD + 0.5],
        [-halfW + 0.5, halfD - 0.5],
        [halfW - 0.5, halfD - 0.5],
      ]
    }

    case 'circular': {
      // بدون أعمدة للدائري (لأنه ما فيه زوايا)
      return []
    }

    case 'octagonal': {
      // 8 زوايا للمثمن
      const radius = halfW * 0.88
      const angles = [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map(deg => (deg * Math.PI) / 180)
      return angles.map(angle => [
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
      ])
    }

    case 'l_shaped': {
      const wingW = halfW * SHAPE_RATIOS.L_WING_W
      const wingD = halfD * SHAPE_RATIOS.L_WING_D
      const cornerX = halfW - wingW
      const cornerZ = halfD - wingD
      // 5 زوايا لشكل L
      return [
        [-halfW + 0.5, -halfD + 0.5],           // الزاوية الأمامية اليسار
        [halfW - 0.5, -halfD + 0.5],            // الزاوية الأمامية اليمين
        [-halfW + 0.5, cornerZ - 0.5],          // الزاوية الداخلية اليسار
        [cornerX - 0.5, cornerZ - 0.5],         // الزاوية الداخلية
        [cornerX - 0.5, halfD - 0.5],           // الزاوية الخلفية اليمين
      ]
    }

    case 't_shaped': {
      const stemHalfW = (halfW * 2 * SHAPE_RATIOS.T_STEM_W) / 2
      const stemDepth = halfD * 2 * SHAPE_RATIOS.T_STEM_D
      const stemBaseZ = halfD - stemDepth
      const barHalfH = halfD - stemDepth
      // 6 زوايا لشكل T
      return [
        [-halfW + 0.5, -halfD + 0.5],           // الزاوية الأمامية اليسار
        [halfW - 0.5, -halfD + 0.5],            // الزاوية الأمامية اليمين
        [-halfW + 0.5, barHalfH - 0.5],         // الزاوية الوسطى اليسار
        [halfW - 0.5, barHalfH - 0.5],          // الزاوية الوسطى اليمين
        [-stemHalfW + 0.5, stemBaseZ + 0.5],    // الزاوية الخلفية اليسار للـ stem
        [stemHalfW - 0.5, stemBaseZ + 0.5],     // الزاوية الخلفية اليمين للـ stem
      ]
    }

    case 'u_shaped': {
      const openingW = halfW * 2 * SHAPE_RATIOS.U_OPENING_W
      const armDepth = halfD * 2 * SHAPE_RATIOS.U_ARM_D
      const armW = (halfW * 2 - openingW) / 2
      const spineZ = halfD - armDepth
      const armInnerX = halfW - armW
      // 6 زوايا لشكل U
      return [
        [-halfW + 0.5, -halfD + 0.5],           // الزاوية الأمامية اليسار
        [halfW - 0.5, -halfD + 0.5],            // الزاوية الأمامية اليمين
        [-halfW + 0.5, halfD - 0.5],            // الزاوية الخلفية اليسار
        [halfW - 0.5, halfD - 0.5],             // الزاوية الخلفية اليمين
        [-armInnerX + 0.6, spineZ + 0.5],       // الزاوية الداخلية اليسار
        [armInnerX - 0.6, spineZ + 0.5],        // الزاوية الداخلية اليمين
      ]
    }

    default:
      return []
  }
}

interface DecorativePillarsProps {
  mat: RoomMaterials
  dim: RoomDimensions
  shape: RoomShape
}

export function DecorativePillars({ mat, dim, shape }: DecorativePillarsProps) {
  if (!mat.hasPillars) return null

  // الأشكال الدائرية ما فيها زوايا، فما رح يظهر فيها أعمدة
  if (shape === 'circular') return null

  const positions = getPillarPositions(shape, dim.halfW, dim.halfD)
  const trimMat = { color: mat.trimColor, metalness: 0.55, roughness: 0.30 }

  return (
    <>
      {positions.map(([x, z], i) => (
        <group key={`pillar-${i}`} position={[x, 0, z] as V3}>
          <Pillar h={dim.height} color="#c0aa88" trimMat={trimMat} />
        </group>
      ))}
    </>
  )
}