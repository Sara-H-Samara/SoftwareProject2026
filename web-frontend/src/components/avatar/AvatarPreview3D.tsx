// src/components/avatar/AvatarPreview3D.tsx
import { useEffect, useRef, useMemo } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import type { Avatar } from '@/types/avatar'
import { buildAvatarGroup, disposeAvatarGroup, tickAvatarAnimation } from './buildAvatar'

interface AvatarPreview3DProps {
  avatar: Avatar
  autoRotate?: boolean
  className?: string
}

function AvatarModel({ avatar, autoRotate }: { avatar: Avatar; autoRotate: boolean }) {
  const outerRef  = useRef<THREE.Group>(null)   // stable outer group (never replaced)
  const innerRef  = useRef<THREE.Group | null>(null)  // rebuilt on avatar change
  const timeRef   = useRef(0)                   // animation clock — never drives state

  // Stable key derived from all avatar fields that affect appearance
  const avatarKey = useMemo(() => JSON.stringify({
    hairStyle: avatar.hairStyle, hairColor: avatar.hairColor,
    shirtStyle: avatar.shirtStyle, shirtColor: avatar.shirtColor,
    pantsStyle: avatar.pantsStyle, pantsColor: avatar.pantsColor,
    shoesColor: avatar.shoesColor, skinColor: avatar.skinColor,
    accessory: avatar.accessory, accessoryColor: avatar.accessoryColor,
    height: avatar.height,
  }), [
    avatar.hairStyle, avatar.hairColor, avatar.shirtStyle, avatar.shirtColor,
    avatar.pantsStyle, avatar.pantsColor, avatar.shoesColor, avatar.skinColor,
    avatar.accessory, avatar.accessoryColor, avatar.height,
  ])

  // Rebuild mesh only when avatar visuals change
  useEffect(() => {
    const outer = outerRef.current
    if (!outer) return

    // Dispose + remove old inner group
    if (innerRef.current) {
      outer.remove(innerRef.current)
      disposeAvatarGroup(innerRef.current)
      innerRef.current = null
    }

    const newGroup = buildAvatarGroup(avatar)
    outer.add(newGroup)
    innerRef.current = newGroup
  }, [avatarKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Full cleanup on unmount
  useEffect(() => {
    return () => {
      if (innerRef.current) {
        disposeAvatarGroup(innerRef.current)
        innerRef.current = null
      }
    }
  }, [])

  // Animation loop — reads/writes refs only, never triggers re-render
  useFrame((_, delta) => {
    const outer = outerRef.current
    if (!outer) return

    timeRef.current += delta

    // Tick animation on the inner group (the one buildAvatarGroup returned)
    if (innerRef.current) {
      tickAvatarAnimation(innerRef.current, timeRef.current, false)
    }

    outer.rotation.y = autoRotate
      ? outer.rotation.y + 0.008
      : Math.sin(timeRef.current * 0.6) * 0.35
  })

  return <group ref={outerRef} position={[0, 0, 0]} />
}

export function AvatarPreview3D({
  avatar, autoRotate = false, className = '',
}: AvatarPreview3DProps) {
  return (
    <div className={`w-full h-full rounded-2xl overflow-hidden ${className}`}
      style={{ background: 'linear-gradient(160deg, #f5f3ef 0%, #eae6df 100%)' }}>
      <Canvas
        camera={{ position: [0, 0.8, 3.5], fov: 45 }}
        shadows
        gl={{ preserveDrawingBuffer: true }}
      >
        {/* Lighting rig — three-point + fill */}
        <ambientLight intensity={0.55} />
        <directionalLight position={[2.5,  3.8,  3.2]} intensity={1.3} castShadow
          shadow-mapSize-width={512} shadow-mapSize-height={512} />
        <directionalLight position={[-3,   2.4,  2.2]} intensity={0.5} />
        <directionalLight position={[0,    2.8, -3.5]} intensity={0.75} />
        <hemisphereLight intensity={0.4} />

        {/* Subtle ground shadow disc */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
          <circleGeometry args={[0.35, 32]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.12} depthWrite={false} />
        </mesh>

        <AvatarModel avatar={avatar} autoRotate={autoRotate} />

        <OrbitControls
          enableZoom enablePan={false}
          minDistance={2} maxDistance={5}
          autoRotate={autoRotate} autoRotateSpeed={1.5}
          target={[0, 0.7, 0]}
          makeDefault
        />

        <Environment preset="apartment" background={false} />
      </Canvas>
    </div>
  )
}