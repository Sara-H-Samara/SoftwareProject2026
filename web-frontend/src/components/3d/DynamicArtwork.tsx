/**
 * DynamicArtwork.tsx
 * Used exclusively in the Gallery Layout Editor 3D preview.
 * Renders artworks at their saved positions so the artist can verify placement.
 *
 * NOT used in VirtualGalleryPage — that uses ArtworkFrame (which has the
 * full gold-frame + mat + aspect-ratio logic).
 */
import { useRef, useState, useCallback, useEffect } from 'react'
import { useTexture } from '@react-three/drei'
import { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { Artwork } from '@/types'

interface DynamicArtworkProps {
  artwork: Artwork
  onSelect: (artwork: Artwork) => void
}

export default function DynamicArtwork({ artwork, onSelect }: DynamicArtworkProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const texture  = useTexture(artwork.imageUrl)

  useEffect(() => {
    if (texture) {
      texture.colorSpace = THREE.SRGBColorSpace
      texture.anisotropy = 4
      texture.needsUpdate = true
    }
  }, [texture])

  // Aspect-ratio aware sizing
  const imgW = texture?.image?.width  ?? 1
  const imgH = texture?.image?.height ?? 1
  const asp  = imgW / imgH
  const fH = asp >= 1 ? 1.6 / asp : 1.6
  const fW = asp >= 1 ? 1.6        : 1.6 * asp

  const is2D =
    artwork.artworkType === 'Painting'   ||
    artwork.artworkType === 'Photography'||
    artwork.artworkType === 'Digital'

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation(); onSelect(artwork)
  }, [artwork, onSelect])

  const handleOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'
  }, [])

  const handleOut = useCallback(() => {
    setHovered(false); document.body.style.cursor = 'auto'
  }, [])

  return (
    <group
      position={[artwork.positionX??0, artwork.positionY??1.7, artwork.positionZ??0]}
      rotation={[artwork.rotationX??0, artwork.rotationY??0,   artwork.rotationZ??0]}
      scale={[artwork.scaleX??1, artwork.scaleY??1, artwork.scaleZ??1]}
    >
      {is2D ? (
        <>
          {/* Gold frame */}
          <mesh position={[0,0,-0.015]}>
            <boxGeometry args={[fW+0.16, fH+0.16, 0.04]} />
            <meshStandardMaterial color={hovered ? '#c4a840' : '#8b6c3a'} metalness={0.75} roughness={0.28}
              emissive={new THREE.Color(hovered ? '#9a7830' : '#000')} emissiveIntensity={hovered ? 0.15 : 0} />
          </mesh>
          {/* Cream mat */}
          <mesh position={[0,0,0.005]}>
            <boxGeometry args={[fW, fH, 0.01]} />
            <meshStandardMaterial color="#f2ede2" roughness={0.9} />
          </mesh>
          {/* Artwork */}
          <mesh ref={meshRef} onClick={handleClick} onPointerOver={handleOver} onPointerOut={handleOut}>
            <planeGeometry args={[fW-0.1, fH-0.1]} />
            <meshStandardMaterial map={texture} roughness={0.5} metalness={0} toneMapped
              emissive={new THREE.Color(hovered ? '#4c1d95' : '#000')} emissiveIntensity={hovered ? 0.08 : 0} />
          </mesh>
        </>
      ) : (
        /* Sculpture placeholder */
        <mesh ref={meshRef} onClick={handleClick} onPointerOver={handleOver} onPointerOut={handleOut}>
          <boxGeometry args={[0.6, 1, 0.6]} />
          <meshStandardMaterial color={hovered ? '#5b21b6' : '#3b1f6e'} metalness={0.5} roughness={0.35}
            emissive={new THREE.Color(hovered ? '#4c1d95' : '#000')} emissiveIntensity={hovered ? 0.25 : 0} />
        </mesh>
      )}

      {/* Hover light */}
      {hovered && (
        <pointLight position={[0, 0.5, 0.5]} color="#c8aa6a" intensity={0.6} distance={2} />
      )}
    </group>
  )
}
