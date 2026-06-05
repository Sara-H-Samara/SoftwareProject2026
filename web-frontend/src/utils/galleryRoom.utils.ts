import { DEFAULT_CUSTOMIZATION } from '@/types/gallery-customization'
import type { GalleryCustomization } from '@/types/gallery-customization'

export const SHAPE_RATIOS = {
  L_WING_W:    0.45,
  L_WING_D:    0.45,
  U_OPENING_W: 0.40,
  U_ARM_D:     0.40,
  T_STEM_W:    0.35,
  T_STEM_D:    0.40,
} as const

export interface RoomDimensions {
  width:       number
  depth:       number
  height:      number
  halfW:       number
  halfD:       number
  wallOffset:  number
  wallZOffset: number
}

export function getRoomDimensions(c?: GalleryCustomization | null): RoomDimensions {
  const s      = c?.structure ?? DEFAULT_CUSTOMIZATION.structure
  const width  = s.roomWidth  ?? 22
  const depth  = s.roomDepth  ?? 22
  const height = s.wallHeight ?? 4.8
  return {
    width, depth, height,
    halfW:       width  / 2,
    halfD:       depth  / 2,
    wallOffset:  width  / 2 + 0.11,
    wallZOffset: depth  / 2 + 0.11,
  }
}

export interface WallMountPoint {
  id:        string
  label:     string
  positionX: number
  positionY: number
  positionZ: number
  rotationY: number
  gridX:     number
  gridY:     number
  wall:      'front' | 'back' | 'left' | 'right'
}

export function getWallMountPoints(
  c?: GalleryCustomization | null,
  mountHeight = 1.65
): WallMountPoint[] {

  const d  = getRoomDimensions(c)
  const s  = c?.structure?.shape ?? 'rectangle'
  const H  = mountHeight
  const WO = 0.12
  const N  = 5   // mount points per wall segment

  const points: WallMountPoint[] = []

  const push = (
    id:    string,
    label: string,
    x:     number,
    z:     number,
    rotY:  number,
    wall:  WallMountPoint['wall']
  ) => {
    points.push({
      id, label,
      positionX: x,
      positionY: H,
      positionZ: z,
      rotationY: rotY,
      wall,
      gridX: Math.min(95, Math.max(5, ((x + d.halfW) / d.width)  * 100)),
      gridY: Math.min(95, Math.max(5, ((z + d.halfD) / d.depth) * 100)),
    })
  }

  // Helper: place N evenly-spaced points along a wall segment
  // axis='x': points move along X from x0 to x1, fixed z
  // axis='z': points move along Z from z0 to z1, fixed x
  const wallPoints = (
    prefix: string,
    label:  string,
    wall:   WallMountPoint['wall'],
    rotY:   number,
    axis:   'x' | 'z',
    fixed:  number,
    from:   number,
    to:     number,
    count = N
  ) => {
    for (let i = 0; i < count; i++) {
      const t = (i + 1) / (count + 1)
      const v = from + t * (to - from)
      const x = axis === 'x' ? v : fixed
      const z = axis === 'z' ? v : fixed
      push(`${prefix}-${i}`, label, x, z, rotY, wall)
    }
  }

  // ─── RECTANGLE / SQUARE ────────────────────────────────────────────────────
  if (s === 'rectangle' || s === 'square') {
    wallPoints('front', 'Front', 'front', Math.PI,      'x', d.halfD - WO,   -d.halfW, d.halfW)
    wallPoints('back',  'Back',  'back',  0,             'x', -d.halfD + WO,  -d.halfW, d.halfW)
    wallPoints('left',  'Left',  'left',  Math.PI / 2,  'z', -d.halfW + WO, -d.halfD, d.halfD)
    wallPoints('right', 'Right', 'right', -Math.PI / 2, 'z',  d.halfW - WO, -d.halfD, d.halfD)
  }

  // ─── L SHAPE ───────────────────────────────────────────────────────────────
  // Matches LShapedWalls.tsx exactly:
  //   Front wall: z=-halfD, faces +Z inward → artwork rotY=0
  //   Back  wall: z=+halfD, faces -Z inward → artwork rotY=π
  //   Left  wall: x=-halfW, faces +X inward → artwork rotY=-π/2
  //   Right wall: x=+halfW, faces -X inward → artwork rotY=+π/2
  //   Cut-out: x > stepX AND z > stepZ (front-right corner)
  //   Back wall only spans -halfW to stepX (left portion)
  //   Right wall only spans z from -halfD to stepZ (upper portion)
  //   Inner H at z=stepZ faces -Z (same as back) → rotY=π
  //   Inner V at x=stepX faces -X (same as right) → rotY=+π/2
  if (s === 'l_shaped') {
    const stepX = d.halfW - SHAPE_RATIOS.L_WING_W * d.width
    const stepZ = d.halfD - SHAPE_RATIOS.L_WING_D * d.depth

    // Front wall (z=-halfD): full width, faces +Z → rotY=0
    wallPoints('l-front', 'Front', 'front', 0, 'x', -d.halfD + WO, -d.halfW, d.halfW)

    // Back wall (z=+halfD): left portion only, faces -Z → rotY=π
    wallPoints('l-back', 'Back', 'back', Math.PI, 'x', d.halfD - WO, -d.halfW, stepX)

    // Left wall (x=-halfW): full depth, faces +X → rotY=-π/2
    wallPoints('l-left', 'Left', 'left',  Math.PI / 2, 'z', -d.halfW + WO, -d.halfD, d.halfD)

    // Right wall (x=+halfW): upper portion only (z: -halfD to stepZ), faces -X → rotY=+π/2
    wallPoints('l-right', 'Right', 'right', -Math.PI / 2, 'z', d.halfW - WO, -d.halfD, stepZ)

    // Inner horizontal wall (z=+stepZ): stepX to +halfW, faces -Z → rotY=π
    wallPoints('l-inner-h', 'Inner', 'front', Math.PI, 'x', stepZ - WO, stepX, d.halfW)

    // Inner vertical wall (x=+stepX): stepZ to +halfD, faces -X → rotY=+π/2
    wallPoints('l-inner-v', 'Inner', 'right', -Math.PI / 2, 'z', stepX - WO, stepZ, d.halfD)
  }

  // ─── T SHAPE ───────────────────────────────────────────────────────────────
  // Matches TShapedWalls.tsx exactly:
  //   Front:       z=-halfD, full width,            rotY=0
  //   Left bar:    x=-halfW, z: -halfD→stemBaseZ,   rotY=-π/2
  //   Right bar:   x=+halfW, z: -halfD→stemBaseZ,   rotY=+π/2
  //   Left wing:   z=stemBaseZ, x: -halfW→-stemHalfW, rotY=π
  //   Right wing:  z=stemBaseZ, x: stemHalfW→+halfW,  rotY=π
  //   Left stem:   x=-stemHalfW, z: stemBaseZ→+halfD, rotY=-π/2
  //   Right stem:  x=+stemHalfW, z: stemBaseZ→+halfD, rotY=+π/2
  //   Stem back:   z=+halfD, x: -stemHalfW→+stemHalfW, rotY=π
  if (s === 't_shaped') {
  const stemHalfW  = (d.width  * SHAPE_RATIOS.T_STEM_W) / 2
  const stemDepth  = d.depth   * SHAPE_RATIOS.T_STEM_D
  const stemBaseZ  = d.halfD   - stemDepth   // z where bar ends, stem begins
  const WALL_OFFSET = 0.12

  // Front wall (z=-halfD): full width, faces +Z → rotY=0
  wallPoints('t-front', 'Front', 'front', 0, 'x', -d.halfD + WALL_OFFSET, -d.halfW, d.halfW)

  // Left bar wall (x=-halfW): bar region only, faces +X → rotY=-π/2
  wallPoints('t-left', 'Left', 'left', Math.PI / 2, 'z', -d.halfW + WALL_OFFSET, -d.halfD, stemBaseZ)

  // Right bar wall (x=+halfW): bar region only, faces -X → rotY=+π/2
  wallPoints('t-right', 'Right', 'right', -Math.PI / 2, 'z', d.halfW - WALL_OFFSET, -d.halfD, stemBaseZ)

  // Left back wing (z=+stemBaseZ): left side, faces -Z → rotY=π
  wallPoints('t-wing-l', 'Wing', 'back', Math.PI, 'x', stemBaseZ - WALL_OFFSET, -d.halfW, -stemHalfW)

  // Right back wing (z=+stemBaseZ): right side, faces -Z → rotY=π
  wallPoints('t-wing-r', 'Wing', 'back', Math.PI, 'x', stemBaseZ - WALL_OFFSET, stemHalfW, d.halfW)

  // Left stem wall (x=-stemHalfW): stem region, faces +X → rotY=-π/2
  // IMPORTANT: use stemHalfW - offset for X position
  wallPoints('t-stem-l', 'Stem', 'left', Math.PI / 2, 'z', -stemHalfW + WALL_OFFSET, stemBaseZ, d.halfD)

  // Right stem wall (x=+stemHalfW): stem region, faces -X → rotY=+π/2
  // IMPORTANT: use stemHalfW - offset for X position
  wallPoints('t-stem-r', 'Stem', 'right', -Math.PI / 2, 'z', stemHalfW - WALL_OFFSET, stemBaseZ, d.halfD)

  // Stem back wall (z=+halfD): stem width only, faces -Z → rotY=π
  wallPoints('t-back', 'Back', 'back', Math.PI, 'x', d.halfD - WALL_OFFSET, -stemHalfW, stemHalfW)
}

    // ─── U SHAPE ───────────────────────────────────────────────────────────────
  // Layout:
  //   Front wall:       z=-halfD, full width
  //   Left outer wall:  x=-halfW, full depth (both main body AND arm)
  //   Right outer wall: x=+halfW, full depth (both main body AND arm)
  //   Spine wall:       z=+spineZ, opening width only
  //   Left arm back:    z=+halfD, left arm width
  //   Right arm back:   z=+halfD, right arm width
  //   Left inner arm:   x=leftArmInnerX, inside left arm (z: spineZ to halfD)
  //   Right inner arm:  x=rightArmInnerX, inside right arm (z: spineZ to halfD)
  if (s === 'u_shaped') {
    const openingW        = d.width  * SHAPE_RATIOS.U_OPENING_W
    const armW            = (d.width - openingW) / 2
    const armDepth        = d.depth  * SHAPE_RATIOS.U_ARM_D
    const spineZ          = d.halfD  - armDepth
    const leftArmInnerX   = -d.halfW + armW
    const rightArmInnerX  =  d.halfW - armW

    // Front wall (z=-halfD): full width, faces +Z → rotY=0
    wallPoints('u-front', 'Front', 'front', 0, 'x', -d.halfD + WO, -d.halfW, d.halfW)

    // Left outer wall (x=-halfW): FULL depth including arm, faces +X → rotY=+π/2
    wallPoints('u-left', 'Left', 'left', Math.PI / 2, 'z', -d.halfW + WO, -d.halfD, d.halfD)

    // Right outer wall (x=+halfW): FULL depth including arm, faces -X → rotY=-π/2
    wallPoints('u-right', 'Right', 'right', -Math.PI / 2, 'z', d.halfW - WO, -d.halfD, d.halfD)

    // Spine wall (z=+spineZ): opening width, faces -Z → rotY=π
    wallPoints('u-spine', 'Spine', 'back', Math.PI, 'x', spineZ - WO, leftArmInnerX, rightArmInnerX)

    // Left arm back (z=+halfD): left arm width, faces -Z → rotY=π
    wallPoints('u-back-l', 'Back', 'back', Math.PI, 'x', d.halfD - WO, -d.halfW, leftArmInnerX)

    // Right arm back (z=+halfD): right arm width, faces -Z → rotY=π
    wallPoints('u-back-r', 'Back', 'back', Math.PI, 'x', d.halfD - WO, rightArmInnerX, d.halfW)

    // Left inner arm wall: inside left arm, faces -X toward arm → rotY=-π/2
    wallPoints('u-inner-l', 'Inner', 'left', -Math.PI / 2, 'z', leftArmInnerX - WO, spineZ, d.halfD)

    // Right inner arm wall: inside right arm, faces +X toward arm → rotY=+π/2
    wallPoints('u-inner-r', 'Inner', 'right', Math.PI / 2, 'z', rightArmInnerX + WO, spineZ, d.halfD)
  }

    // ─── CIRCULAR ──────────────────────────────────────────────────────────────
  if (s === 'circular') {
    const radius = Math.min(d.width, d.depth) / 2 - 0.2
    const mountR = radius - WO
    const count  = 12

    for (let i = 0; i < count; i++) {
      const a    = (i / count) * Math.PI * 2
      const x    = Math.cos(a) * mountR
      const z    = Math.sin(a) * mountR
      const rotY = Math.atan2(-x, -z)
      push(`c-${i}`, 'Wall', x, z, rotY, 'front')
    }
  }

  // ─── OCTAGONAL ─────────────────────────────────────────────────────────────
  if (s === 'octagonal') {
    const circumR  = d.width / 2
    const inradius = circumR * Math.cos(Math.PI / 8)
    const mountR   = inradius - WO

    // 1 point per wall face, centered on each face
    for (let i = 0; i < 8; i++) {
      const a    = (i / 8) * Math.PI * 2
      const x    = Math.cos(a) * mountR
      const z    = Math.sin(a) * mountR
      const rotY = Math.atan2(-x, -z)
      push(`o-${i}`, 'Wall', x, z, rotY, 'front')
    }
  }

  return points
}

export interface ResolvedMaterials {
  wallColor:          string
  wallRoughness:      number
  wallMetalness:      number
  trimColor:          string
  floorColor:         string
  floorRoughness:     number
  floorMetalness:     number
  ambientIntensity:   number
  ambientColor:       string
  mainLightIntensity: number
  hasSpotlights:      boolean
  spotlightIntensity: number
  hasPillars:         boolean
}

export function resolveRoomMaterials(c?: GalleryCustomization | null): ResolvedMaterials {
  const s = c?.structure  ?? DEFAULT_CUSTOMIZATION.structure
  const w = c?.walls      ?? DEFAULT_CUSTOMIZATION.walls
  const f = c?.floor      ?? DEFAULT_CUSTOMIZATION.floor
  const l = c?.lighting   ?? DEFAULT_CUSTOMIZATION.lighting

  const wallMetalness =
    w.metalness !== undefined ? w.metalness
    : w.material === 'glass' || w.material === 'mirror' ? 0.85
    : 0.04

  const floorMetalnessMap: Record<string, number> = {
    hardwood: 0.06, marble: 0.35, carpet: 0.00, concrete: 0.02,
    tile: 0.08, epoxy: 0.45, polished_concrete: 0.22,
  }

  return {
    wallColor:          w.color      ?? '#ece6dc',
    wallRoughness:      w.roughness  ?? 0.7,
    wallMetalness,
    trimColor:          '#c8aa6a',
    floorColor:         f.color      ?? '#d4c9a8',
    floorRoughness:     f.roughness  ?? 0.4,
    floorMetalness:     f.metalness !== undefined ? f.metalness : floorMetalnessMap[f.material] ?? 0.06,
    ambientIntensity:   l.ambientLight?.intensity  ?? 0.75,
    ambientColor:       l.ambientLight?.color       ?? '#fff4e6',
    mainLightIntensity: l.mainLighting?.intensity   ?? 0.85,
    hasSpotlights:      l.spotlights?.enabled       ?? true,
    spotlightIntensity: l.spotlights?.intensity     ?? 1.0,
    hasPillars:         s.pillars ?? false,
  }
}

export function getCameraBounds(c?: GalleryCustomization | null) {
  const d = getRoomDimensions(c)
  return {
    minX:      -(d.halfW - 1.0),
    maxX:        d.halfW - 1.0,
    minZ:      -(d.halfD - 1.0),
    maxZ:        d.halfD - 1.0,
    eyeHeight: 1.65,
  }
}

export function getSlotCountForLayout(layoutType: string): number {
  switch (layoutType) {
    case 'loft':      return 10
    case 'courtyard': return 8
    default:          return 12
  }
}