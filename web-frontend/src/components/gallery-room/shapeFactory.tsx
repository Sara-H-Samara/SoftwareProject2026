import { ReactNode } from 'react'
import type { RoomDimensions, RoomMaterials } from '@/types/room-types'
import type { RoomShape } from '@/types/room-shape'
import type { Walls } from '@/types/gallery-customization'
import { CircularWalls }   from './CircularWalls'
import { OctagonalWalls }  from './OctagonalWalls'
import { RectangleWalls }  from './RectangleWalls'
import { LShapedWalls }    from './LShapedWalls'
import { TShapedWalls }    from './TShapedWalls'
import { UShapedWalls }    from './UShapedWalls'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShapeBuilderProps {
  dim:          RoomDimensions
  mat:          RoomMaterials
  shape:        RoomShape
  accentWall:   Walls['accentWall']   // typed union: 'front'|'back'|'left'|'right'
  materialType: Walls['material']     // typed union: 'plaster'|'brick'|'glass'|...
  wallColor:    string
  ceiling:      ReactNode
  moldings:     ReactNode | null
  gridHelper:   ReactNode | null
}

// ─── Shape builders ───────────────────────────────────────────────────────────
// Every builder receives the full ShapeBuilderProps — each wall component
// picks what it needs. This removes the risk of accidentally omitting props
// when adding a new shape.
//
// CircularWalls takes a subset (no moldings/gridHelper — it draws its own trim rings).
// All others spread the full props.

const BUILDERS: Record<RoomShape, (p: ShapeBuilderProps) => ReactNode> = {
  rectangle: p => <RectangleWalls  {...p} />,
  square:    p => <RectangleWalls  {...p} />,
  l_shaped:  p => <LShapedWalls   {...p} />,
  t_shaped:  p => <TShapedWalls   {...p} />,
  u_shaped:  p => <UShapedWalls   {...p} />,
  octagonal: p => <OctagonalWalls {...p} />,

  // CircularWalls manages its own trim rings and ceiling internally,
  // so moldings/gridHelper/ceiling are intentionally not forwarded.
  circular: p => (
    <CircularWalls
      dim={p.dim}
      color={p.wallColor}
      roughness={p.mat.wallRoughness}
      metalness={
        p.materialType === 'mirror' ? 0.98 :
        p.materialType === 'glass'  ? 0.90 : 0.05
      }
      trimColor={p.mat.trimColor}
    />
  ),
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the correct wall component for the given shape.
 * Falls back to RectangleWalls for any unknown shape value
 * (defensive against future type mismatches at runtime).
 */
export function buildShape(props: ShapeBuilderProps): ReactNode {
  return (BUILDERS[props.shape] ?? BUILDERS.rectangle)(props)
}