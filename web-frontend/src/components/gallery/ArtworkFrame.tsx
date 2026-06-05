import React, { useRef, useState, useEffect } from 'react'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import type { Artwork } from '@/types'
import { getImageUrl } from '@/utils/helpers'

interface ArtworkFrameProps {
  artwork:     Artwork
  onClick:     () => void
  isSelected?: boolean
  roomShape?:  string
}

function useFallbackTexture(): THREE.Texture {
  const [tex] = useState(() => {
    const t = new THREE.DataTexture(
      new Uint8Array([200, 190, 180, 255]),
      1, 1,
      THREE.RGBAFormat
    )
    t.needsUpdate = true
    return t
  })
  return tex
}

// ─── getRotationY ──────────────────────────────────────────────────────────────
// Three.js: after rotation.y = rotY, mesh faces direction (sin(rotY), 0, cos(rotY))
// For circular/octagonal at point (x,z): we need face = (-x/r, 0, -z/r) → toward center
// Solution: rotY = atan2(-x, -z)   ← NO +PI, proven correct:
//   sin(atan2(-x,-z)) = -x/r  ✓
//   cos(atan2(-x,-z)) = -z/r  ✓
// For axis-aligned walls: use stored rotationY from getWallMountPoints
// ─────────────────────────────────────────────────────────────────────────────
function getRotationY(artwork: Artwork, roomShape: string): number {
  const x = artwork.positionX ?? 0
  const z = artwork.positionZ ?? 0

  if (roomShape === 'circular' || roomShape === 'octagonal') {
    return Math.atan2(-x, -z)   // ← atan2(-x,-z) not atan2(-x,-z)+PI
  }

  return artwork.rotationY ?? 0
}

function ArtworkFrameInner({
  artwork,
  onClick,
  isSelected = false,
  roomShape  = 'rectangle',
}: ArtworkFrameProps) {
  const meshRef   = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  // useTexture MUST be unconditional — ArtworkErrorBoundary catches failures
  const imageUrl = getImageUrl(artwork.imageUrl) || '/placeholder.jpg'
  const texture  = useTexture(imageUrl)

  useEffect(() => {
    if (!texture) return
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy  = 16
    texture.needsUpdate = true
  }, [texture])

  const imgW = texture?.image?.width  ?? 1
  const imgH = texture?.image?.height ?? 1
  const asp  = imgW / imgH

  const fH = asp >= 1 ? 1.6 / asp : 1.6
  const fW = asp >= 1 ? 1.6       : 1.6 * asp

  const posX = artwork.positionX ?? 0
  const posY = artwork.positionY ?? 1.65
  const posZ = artwork.positionZ ?? 0
  const rotY = getRotationY(artwork, roomShape)

  return (
    <group
      position={[posX, posY, posZ]}
      rotation={[0, rotY, 0]}
      scale={[artwork.scaleX ?? 1, artwork.scaleY ?? 1, artwork.scaleZ ?? 1]}
      onClick={(e) => { e.stopPropagation(); onClick() }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
      onPointerOut={(e)  => { e.stopPropagation(); setHovered(false) }}
    >
      <mesh position={[0, 0, -0.03]} receiveShadow>
        <planeGeometry args={[fW + 0.2, fH + 0.2]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.15} />
      </mesh>

      <mesh position={[0, 0, -0.02]} castShadow receiveShadow>
        <boxGeometry args={[fW + 0.14, fH + 0.14, 0.05]} />
        <meshStandardMaterial
          color={hovered || isSelected ? '#d4af37' : '#7a6540'}
          metalness={0.85}
          roughness={0.25}
          emissive={hovered || isSelected ? '#d4af37' : '#000000'}
          emissiveIntensity={hovered || isSelected ? 0.2 : 0}
        />
      </mesh>

      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[fW + 0.08, fH + 0.08, 0.03]} />
        <meshStandardMaterial
          color={hovered || isSelected ? '#e8c84a' : '#9a8040'}
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>

      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[fW - 0.02, fH - 0.02, 0.01]} />
        <meshStandardMaterial color="#f5efe5" roughness={0.85} metalness={0} />
      </mesh>

      <mesh ref={meshRef} position={[0, 0, 0.035]}>
        <planeGeometry args={[fW - 0.1, fH - 0.1]} />
        <meshStandardMaterial map={texture} roughness={0.3} metalness={0.01} />
      </mesh>

      <mesh position={[0, 0, 0.048]}>
        <planeGeometry args={[fW - 0.08, fH - 0.08]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.06}
          metalness={0.95}
          roughness={0.05}
          reflectivity={0.15}
        />
      </mesh>
    </group>
  )
}

function ArtworkFrameFallback({ artwork, roomShape = 'rectangle' }: { artwork: Artwork; roomShape?: string }) {
  const fallback = useFallbackTexture()
  const posX = artwork.positionX ?? 0
  const posY = artwork.positionY ?? 1.65
  const posZ = artwork.positionZ ?? 0
  const rotY = getRotationY(artwork, roomShape)

  return (
    <group
      position={[posX, posY, posZ]}
      rotation={[0, rotY, 0]}
      scale={[artwork.scaleX ?? 1, artwork.scaleY ?? 1, artwork.scaleZ ?? 1]}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.72, 1.72, 0.05]} />
        <meshStandardMaterial color="#8b6c3a" metalness={0.75} roughness={0.28} />
      </mesh>
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[1.5, 1.5]} />
        <meshStandardMaterial map={fallback} roughness={0.9} />
      </mesh>
    </group>
  )
}

interface EBState { hasError: boolean }

class ArtworkErrorBoundary extends React.Component<
  { artwork: Artwork; onClick: () => void; isSelected?: boolean; roomShape?: string },
  EBState
> {
  state: EBState = { hasError: false }

  static getDerivedStateFromError(): EBState {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.warn('[ArtworkFrame] Failed to load texture:', error)
  }

  render() {
    if (this.state.hasError) {
      return <ArtworkFrameFallback artwork={this.props.artwork} roomShape={this.props.roomShape} />
    }
    return (
      <ArtworkFrameInner
        artwork={this.props.artwork}
        onClick={this.props.onClick}
        isSelected={this.props.isSelected}
        roomShape={this.props.roomShape}
      />
    )
  }
}

export default function ArtworkFrame(props: ArtworkFrameProps) {
  return <ArtworkErrorBoundary {...props} />
}