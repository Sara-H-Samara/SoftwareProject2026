import { memo, useMemo, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import type { GalleryCustomization } from '@/types/gallery-customization'
import type { RoomShape } from '@/types/room-shape'
import {
  getRoomDimensions,
  resolveRoomMaterials,
  getCameraBounds,
} from '@/utils/galleryRoom.utils'
import { buildExcludedZones } from '../gallery-room/CameraBounds'
import { RoomLighting } from '../gallery-room/RoomLighting'
import { StyledFloor } from '../gallery-room/StyledFloor'
import { StyledWalls } from '../gallery-room/StyledWalls'
import { CeilingTrackLights } from '../gallery-room/CeilingTrackLights'
import { DecorativePillars } from '../gallery-room/DecorativePillars'
import { CameraBounds } from '../gallery-room/CameraBounds'

export interface StyledGalleryRoomProps {
  customization?: GalleryCustomization | null
  highQuality?: boolean
  enableBounds?: boolean
  cameraZFraction?: number
}


function StyledGalleryRoomComponent({
  customization,
  highQuality = false,
  enableBounds = true,
  cameraZFraction = 0.80,
}: StyledGalleryRoomProps) {
  const { camera } = useThree()

  const dim = useMemo(() => getRoomDimensions(customization), [customization])
  const mat = useMemo(() => resolveRoomMaterials(customization), [customization])
  const bounds = useMemo(() => getCameraBounds(customization), [customization])
  const zones = useMemo(() => buildExcludedZones(customization), [customization])

  const shape = (customization?.structure?.shape ?? 'rectangle') as RoomShape
  const layout = customization?.structure?.layoutType ?? 'single_room'
  const wallColor = customization?.walls?.color ?? '#ece6dc'
  const materialType = customization?.walls?.material ?? 'plaster'
const accentWall = {
  enabled: false,
  wall: 'front' as const,
  color: wallColor,
}

  const ready = useRef(false)
  useFrame(() => {
    if (ready.current) return
    ready.current = true
    camera.position.set(0, bounds.eyeHeight, -(dim.halfD * cameraZFraction))
    camera.lookAt(0, bounds.eyeHeight, 0)
  })

  const isRectLike = shape === 'rectangle' || shape === 'square'
  const showPillars = mat.hasPillars && (isRectLike || layout === 'courtyard')

  return (
    <group>
      <RoomLighting mat={mat} dim={dim} layout={layout} />

      <StyledFloor mat={mat} dim={dim} highQuality={highQuality} shape={shape} />

      <StyledWalls
        mat={mat}
        dim={dim}
        shape={shape}
        accentWall={accentWall}
        materialType={materialType}
        wallColor={wallColor}
      />

      <CeilingTrackLights mat={mat} dim={dim} shape={shape} intensityScale={1} />

      {showPillars && <DecorativePillars mat={mat} dim={dim} shape={shape} />}

      {enableBounds && (
        <CameraBounds bounds={bounds} excludedZones={zones} enabled />
      )}
    </group>
  )
}

export default memo(StyledGalleryRoomComponent)