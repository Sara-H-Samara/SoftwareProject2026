import * as THREE from 'three'
import { useMemo, useEffect } from 'react'
import type { RoomDimensions, RoomMaterials } from '@/types/room-types'
import type { RoomShape } from '@/types/room-shape'
import type { Walls } from '@/types/gallery-customization'
import { buildShape } from './shapeFactory'
import { buildRoomShape2D } from './StyledFloor'

const CEILING_THICKNESS = 0.14
const MOLDING_H         = 0.18
const BASEBOARD_H       = 0.16

interface StyledWallsProps {
  mat:          RoomMaterials
  dim:          RoomDimensions
  shape:        RoomShape
  accentWall:   Walls['accentWall']
  materialType: Walls['material']
  wallColor:    string
}

function ShapedCeiling({ shape, dim, y }: { shape: RoomShape; dim: RoomDimensions; y: number }) {
  const geo = useMemo(() => {
    const shape2D = buildRoomShape2D(shape, dim.width, dim.depth)
    const g       = new THREE.ShapeGeometry(shape2D)
    g.rotateX(-Math.PI / 2)
    return g
  }, [shape, dim.width, dim.depth])

  useEffect(() => () => { geo.dispose() }, [geo])

  return (
    <mesh position={[0, y, 0]} geometry={geo}>
      <meshStandardMaterial color="#f3efe8" roughness={0.9} side={THREE.DoubleSide} />
    </mesh>
  )
}

function Ceiling({ shape, dim }: { shape: RoomShape; dim: RoomDimensions }) {
  const y = dim.height + CEILING_THICKNESS / 2

  if (shape === 'circular') {
    return (
      <mesh position={[0, dim.height, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[dim.width / 2, 96]} />
        <meshStandardMaterial color="#f3efe8" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
    )
  }

  if (shape === 'octagonal') {
    const r        = dim.width / 2
    const octShape = new THREE.Shape()
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 - Math.PI / 8
      const x = Math.cos(a) * r
      const y = Math.sin(a) * r
      i === 0 ? octShape.moveTo(x, y) : octShape.lineTo(x, y)
    }
    octShape.closePath()
    const octGeo = new THREE.ShapeGeometry(octShape)
    return (
      <mesh position={[0, dim.height, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <primitive object={octGeo} attach="geometry" />
        <meshStandardMaterial color="#f3efe8" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
    )
  }

  if (shape === 'l_shaped' || shape === 't_shaped' || shape === 'u_shaped') {
    return <ShapedCeiling shape={shape} dim={dim} y={dim.height} />
  }

  return (
    <mesh position={[0, y, 0]}>
      <boxGeometry args={[dim.width + 0.5, CEILING_THICKNESS, dim.depth + 0.5]} />
      <meshStandardMaterial color="#f3efe8" roughness={0.9} />
    </mesh>
  )
}

function Moldings({ dim, mat }: { dim: RoomDimensions; mat: RoomMaterials }) {
  const trimMat = { color: mat.trimColor, metalness: 0.55, roughness: 0.30 }
  type Strip = { p: [number, number, number]; r: [number, number, number]; w: number }

  const crown: Strip[] = [
    { p: [0,          dim.height - 0.015, -dim.halfD], r: [0, 0,            0], w: dim.width },
    { p: [0,          dim.height - 0.015,  dim.halfD], r: [0, 0,            0], w: dim.width },
    { p: [-dim.halfW, dim.height - 0.015,  0         ], r: [0, Math.PI / 2, 0], w: dim.depth },
    { p: [ dim.halfW, dim.height - 0.015,  0         ], r: [0, Math.PI / 2, 0], w: dim.depth },
  ]

  const base: Strip[] = [
    { p: [0,          0.08, -dim.halfD], r: [0, 0,            0], w: dim.width },
    { p: [0,          0.08,  dim.halfD], r: [0, 0,            0], w: dim.width },
    { p: [-dim.halfW, 0.08,  0         ], r: [0, Math.PI / 2, 0], w: dim.depth },
    { p: [ dim.halfW, 0.08,  0         ], r: [0, Math.PI / 2, 0], w: dim.depth },
  ]

  return (
    <group>
      {crown.map((m, i) => (
        <mesh key={`cr${i}`} position={m.p} rotation={m.r}>
          <boxGeometry args={[m.w, MOLDING_H, MOLDING_H]} />
          <meshStandardMaterial {...trimMat} />
        </mesh>
      ))}
      {base.map((m, i) => (
        <mesh key={`bs${i}`} position={m.p} rotation={m.r}>
          <boxGeometry args={[m.w, BASEBOARD_H, 0.10]} />
          <meshStandardMaterial {...trimMat} />
        </mesh>
      ))}
    </group>
  )
}

export function StyledWalls({ mat, dim, shape, accentWall, materialType, wallColor }: StyledWallsProps) {
  return buildShape({
    dim, mat, shape, accentWall, materialType, wallColor,
    ceiling:    <Ceiling shape={shape} dim={dim} />,
    moldings:   <Moldings dim={dim} mat={mat} />,
    gridHelper: null,  
  })
}