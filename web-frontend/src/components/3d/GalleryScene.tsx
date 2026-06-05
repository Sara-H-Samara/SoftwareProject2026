/**
 * GalleryScene.tsx
 * Used in the Gallery Layout Editor's 3D Preview tab.
 * Renders artworks at their saved positions with OrbitControls
 * so the artist can inspect the layout from any angle.
 *
 * The live visitor experience uses VirtualGalleryPage which has its own
 * self-contained scene with FPS movement.
 */
import { Suspense, useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, PerspectiveCamera, Grid } from '@react-three/drei'
import * as THREE from 'three'
import type { Artwork } from '@/types'
import DynamicArtwork    from './DynamicArtwork'
import ArtworkDetailsModal from './ArtworkDetailsModal'
import LoadingScreen     from './LoadingScreen'

interface GallerySceneProps {
  artworks: Artwork[]
}

// Minimal preview room (Layout Editor only)
function PreviewRoom() {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[22, 22]} />
        <meshStandardMaterial color="#1e1811" roughness={0.5} metalness={0.05} />
      </mesh>
      {/* Ceiling */}
      <mesh position={[0, 4.8, 0]}>
        <boxGeometry args={[22, 0.12, 22]} />
        <meshStandardMaterial color="#f3efe8" roughness={0.9} />
      </mesh>
      {/* Walls */}
      <mesh position={[0, 2.4, -10.1]}><boxGeometry args={[22, 4.8, 0.2]} /><meshStandardMaterial color="#ece6dc" roughness={0.72} /></mesh>
      <mesh position={[0, 2.4,  10.1]}><boxGeometry args={[22, 4.8, 0.2]} /><meshStandardMaterial color="#ece6dc" roughness={0.72} /></mesh>
      <mesh position={[-10.1, 2.4, 0]}><boxGeometry args={[0.2, 4.8, 22]} /><meshStandardMaterial color="#ece6dc" roughness={0.72} /></mesh>
      <mesh position={[ 10.1, 2.4, 0]}><boxGeometry args={[0.2, 4.8, 22]} /><meshStandardMaterial color="#ece6dc" roughness={0.72} /></mesh>
      {/* Grid floor helper */}
      <Grid args={[20, 20]} position={[0, 0.01, 0]}
            cellColor="#c8aa6a" sectionColor="#c8aa6a"
            cellSize={1.8} sectionSize={9}
            fadeDistance={25} fadeStrength={1} infiniteGrid={false} />
    </group>
  )
}

function PreviewLighting() {
  return (
    <>
      <ambientLight intensity={0.7} color="#fff4e6" />
      <directionalLight 
        position={[5, 8, 4]} 
        intensity={1.0} 
        castShadow 
        shadow-mapSize={[512,512]} 
        color="#fff8f0" 
      />
      <pointLight position={[0, 3, 0]} intensity={0.5} color="#ffd4a0" />
      
      {/* Fill lights for walls */}
      <pointLight position={[0, 2.5, -8]} intensity={0.6} color="#fff0e0" />
      <pointLight position={[0, 2.5, 8]} intensity={0.6} color="#fff0e0" />
      <pointLight position={[-8, 2.5, 0]} intensity={0.6} color="#fff0e0" />
      <pointLight position={[8, 2.5, 0]} intensity={0.6} color="#fff0e0" />
    </>
  )
}

export default function GalleryScene({ artworks }: GallerySceneProps) {
  const [selected, setSelected] = useState<Artwork | null>(null)
  const handleSelect  = useCallback((a: Artwork) => setSelected(a), [])
  const handleClose   = useCallback(() => setSelected(null), [])

  const published = artworks.filter(a => a.isPublished)

  return (
    <div className="w-full h-full relative">
      <Canvas
        shadows={false}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
        style={{ background: '#f5f1eb' }}
      >
        <PerspectiveCamera makeDefault position={[0, 5, 10]} fov={60} near={0.1} far={80} />

        <Suspense fallback={<LoadingScreen />}>
          <PreviewLighting />
          <PreviewRoom />
          <Environment preset="apartment" background={false} />
          {published.map(aw => (
            <DynamicArtwork key={aw.id} artwork={aw} onSelect={handleSelect} />
          ))}
        </Suspense>

        <OrbitControls
          target={[0, 1.5, 0]}
          maxPolarAngle={Math.PI / 1.8}
          minDistance={2}
          maxDistance={22}
          enableDamping dampingFactor={0.08}
        />
      </Canvas>

      {/* Hint */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none">
        <div className="px-4 py-1.5 bg-black/45 backdrop-blur-md rounded-full
                        text-xs text-white/60 border border-white/10 whitespace-nowrap">
          Scroll to zoom · Drag to orbit · Click artwork to inspect
        </div>
      </div>

      {/* Artwork detail modal */}
      <ArtworkDetailsModal artwork={selected} onClose={handleClose} />
    </div>
  )
}
