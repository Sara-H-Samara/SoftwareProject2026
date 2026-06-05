import {
  Suspense, useState, useRef, useEffect, useCallback, memo
} from 'react'
import { useParams, Link } from 'react-router-dom'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useTexture, Html } from '@react-three/drei'
import {
  ArrowLeftIcon, XMarkIcon, ShoppingCartIcon,
  ChevronLeftIcon, ChevronRightIcon,
  InformationCircleIcon, CubeIcon,
} from '@heroicons/react/24/outline'
import {
  PlayIcon, StopIcon,
} from '@heroicons/react/24/solid'
import * as THREE from 'three'
import { useArtistArtworks, useArtistGallery } from '@/hooks/useGallery'
import { useCartStore } from '@/store/cartStore'
import { PageLoader } from '@/components/common/Spinner'
import { ROUTES } from '@/utils/constants'
import { formatPrice, formatDate } from '@/utils/helpers'
import type { Artwork } from '@/types'
import toast from 'react-hot-toast'

import { useAuthStore } from '@/store/authStore'
import { useGalleryDesignStore } from '@/store/galleryDesignStore'
import StyledGalleryRoom from '@/components/gallery/StyledGalleryRoom'
import { getCameraBounds } from '@/utils/galleryRoom.utils'
import { galleryStudioApi } from '@/api/galleryStudio.api'

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@300;400&display=swap');
`

const GLOBAL_STYLES = `
  ${FONTS}
  :root {
    --gold: #c9a96e;
    --gold-light: #e8d5a3;
    --gold-dark: #8a6a3a;
    --ink: #0e0c09;
    --ink-80: rgba(14,12,9,0.80);
    --ink-60: rgba(14,12,9,0.60);
    --surface: #faf8f4;
    --surface-2: #f2ede4;
    --border: rgba(201,169,110,0.20);
    --border-strong: rgba(201,169,110,0.45);
    --text-primary: #1c1814;
    --text-secondary: #6b5c47;
    --text-muted: #a09078;
    --purple: #7c5cba;
    --purple-light: #a880e8;
    --glass-bg: rgba(14,12,9,0.72);
    --glass-border: rgba(201,169,110,0.18);
    --radius-sm: 6px;
    --radius-md: 12px;
    --radius-lg: 20px;
    --radius-xl: 28px;
  }

  @keyframes fadeUp {
    from { opacity:0; transform:translateY(16px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity:0; }
    to   { opacity:1; }
  }
  @keyframes slideInRight {
    from { opacity:0; transform:translateX(32px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes tourPulse {
    0%,100% { opacity:1; }
    50%     { opacity:0.4; }
  }
  @keyframes progressGlow {
    0%,100% { box-shadow: 0 0 6px rgba(201,169,110,0.6); }
    50%     { box-shadow: 0 0 14px rgba(201,169,110,0.9); }
  }

  .vg-drawer-overlay {
    animation: fadeIn 0.25s ease;
  }
  .vg-drawer {
    animation: slideInRight 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .vg-enter-card {
    animation: fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .vg-tour-pill {
    animation: fadeUp 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .vg-btn-primary {
    font-family: 'DM Sans', sans-serif;
    font-weight: 500;
    font-size: 13px;
    letter-spacing: 0.04em;
    padding: 10px 22px;
    border-radius: 100px;
    border: 1px solid var(--border-strong);
    background: linear-gradient(135deg, var(--gold-dark), var(--gold));
    color: #fff8ee;
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 20px rgba(138,106,58,0.35), inset 0 1px 0 rgba(255,255,255,0.15);
  }
  .vg-btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 28px rgba(138,106,58,0.45), inset 0 1px 0 rgba(255,255,255,0.15);
  }

  .vg-btn-ghost {
    font-family: 'DM Sans', sans-serif;
    font-weight: 400;
    font-size: 12px;
    padding: 8px 16px;
    border-radius: 100px;
    border: 1px solid var(--glass-border);
    background: var(--glass-bg);
    color: rgba(255,255,255,0.75);
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    backdrop-filter: blur(16px);
  }
  .vg-btn-ghost:hover {
    border-color: var(--border-strong);
    color: rgba(255,255,255,0.95);
  }

  .vg-kbd {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    padding: 2px 7px;
    border-radius: 4px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.14);
    color: rgba(255,255,255,0.6);
  }
`

function safeUrl(url: string | null | undefined): string {
  if (!url) return ''
  if (url.includes('127.0.0.1:10000') || url.includes('devstoreaccount1'))
    return `http://localhost:5000/api/artworks/image-proxy?url=${encodeURIComponent(url)}`
  if (url.startsWith('http')) return url
  const base = (import.meta as any).env?.VITE_API_BASE_URL ?? ''
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`
}

function injectStyles() {
  if (typeof document !== 'undefined' && !document.getElementById('vg-styles')) {
    const el = document.createElement('style')
    el.id = 'vg-styles'
    el.textContent = GLOBAL_STYLES
    document.head.appendChild(el)
  }
}

interface TourWaypoint {
  position: THREE.Vector3
  lookTarget: THREE.Vector3
  artwork: Artwork
}

function VirtualTour({
  artworks,
  enabled,
  onWaypointReached,
  onEnd,
  onStart,
  pauseBetweenArtworks = 4,
  moveDuration = 6,
}: {
  artworks: Artwork[]
  enabled: boolean
  onWaypointReached: (artwork: Artwork | null, progress: number) => void
  onEnd: () => void
  onStart?: () => void
  pauseBetweenArtworks?: number
  moveDuration?: number
}) {
  const { camera } = useThree()
  const animationRef = useRef<number | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const waypointsRef = useRef<TourWaypoint[]>([])
  const tourRunningRef = useRef(false)
  const startPos = useRef<THREE.Vector3 | null>(null)
  const startTime = useRef<number>(0)

  const buildWaypoints = useCallback(() => {
    const wallArtworks = artworks.filter(
      a => Math.abs(a.positionZ ?? 0) > 3 || Math.abs(a.positionX ?? 0) > 3
    )

    waypointsRef.current = wallArtworks.map((artwork) => {
  const x    = artwork.positionX ?? 0
  const y    = artwork.positionY ?? 1.7
  const z    = artwork.positionZ ?? 0
  const rotY = artwork.rotationY ?? 0

  const offset = 3.5
  const camPos = new THREE.Vector3(
    x + Math.sin(rotY) * offset,
    y + 0.2,
    z + Math.cos(rotY) * offset
  )

  return {
    position:   camPos,
    lookTarget: new THREE.Vector3(x, y, z),
    artwork,
  }
})
  }, [artworks])

  const ease = (t: number) => t * t * (3 - 2 * t)

  const moveToWaypoint = useCallback((index: number) => {
    if (!tourRunningRef.current) return

    const waypoint = waypointsRef.current[index]
    if (!waypoint) {
      onEnd()
      return
    }

    if (animationRef.current) cancelAnimationFrame(animationRef.current)

    startPos.current = camera.position.clone()
    startTime.current = performance.now()

    const animate = (now: number) => {
      if (!tourRunningRef.current) return

      const tRaw = Math.min((now - startTime.current) / 1000 / moveDuration, 1)
      const t = ease(tRaw)

      if (startPos.current) {
        camera.position.lerpVectors(startPos.current, waypoint.position, t)
      }

      camera.lookAt(waypoint.lookTarget)
      onWaypointReached(waypoint.artwork, tRaw * 100)

      if (tRaw < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        camera.position.copy(waypoint.position)
        camera.lookAt(waypoint.lookTarget)
        onWaypointReached(waypoint.artwork, 100)

        timeoutRef.current = setTimeout(() => {
          moveToWaypoint(index + 1)
        }, pauseBetweenArtworks * 1000)
      }
    }

    animationRef.current = requestAnimationFrame(animate)
  }, [camera, moveDuration, pauseBetweenArtworks, onWaypointReached, onEnd])

  const cancelAll = useCallback(() => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }, [])

  const stopTour = useCallback(() => {
    tourRunningRef.current = false
    cancelAll()
  }, [cancelAll])

  const startTour = useCallback(() => {
    if (!waypointsRef.current.length) return onEnd()
    stopTour()
    tourRunningRef.current = true
    onStart?.()
    moveToWaypoint(0)
  }, [moveToWaypoint, onEnd, onStart, stopTour])

  useEffect(() => {
    buildWaypoints()
  }, [buildWaypoints])

  useEffect(() => {
    if (enabled && !tourRunningRef.current) startTour()
    return () => {
      if (!enabled) stopTour()
    }
  }, [enabled, startTour, stopTour])

  useEffect(() => {
    return () => {
      cancelAll()
      tourRunningRef.current = false
    }
  }, [cancelAll])

  return null
}

function FPSController({ enabled, customization }: { enabled: boolean; customization: any }) {
  const { camera, gl } = useThree()
  const keys = useRef<Record<string, boolean>>({})
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))
  const drag = useRef(false)
  const lastXY = useRef({ x: 0, y: 0 })
  const vel = useRef(new THREE.Vector3())
  const bounds = getCameraBounds(customization)

  useEffect(() => { euler.current.setFromQuaternion(camera.quaternion, 'YXZ') }, [camera])

  useEffect(() => {
    if (!enabled) return
    const cv = gl.domElement
    const look = (dx: number, dy: number) => {
      euler.current.y -= dx * 0.0022
      euler.current.x = THREE.MathUtils.clamp(euler.current.x - dy * 0.0022, -Math.PI / 3, Math.PI / 3)
      camera.quaternion.setFromEuler(euler.current)
    }
    const kd = (e: KeyboardEvent) => { keys.current[e.code] = true }
    const ku = (e: KeyboardEvent) => { keys.current[e.code] = false }
    const md = (e: MouseEvent) => { if (e.button === 0) { drag.current = true; lastXY.current = { x: e.clientX, y: e.clientY } } }
    const mu = () => { drag.current = false }
    const mm = (e: MouseEvent) => { if (!drag.current) return; look(e.clientX - lastXY.current.x, e.clientY - lastXY.current.y); lastXY.current = { x: e.clientX, y: e.clientY } }
    let lt = { x: 0, y: 0 }
    const ts = (e: TouchEvent) => { lt = { x: e.touches[0].clientX, y: e.touches[0].clientY } }
    const tm = (e: TouchEvent) => { look(e.touches[0].clientX - lt.x, e.touches[0].clientY - lt.y); lt = { x: e.touches[0].clientX, y: e.touches[0].clientY } }

    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku)
    cv.addEventListener('mousedown', md); window.addEventListener('mouseup', mu); window.addEventListener('mousemove', mm)
    cv.addEventListener('touchstart', ts, { passive: true }); cv.addEventListener('touchmove', tm, { passive: true })

    return () => {
      window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku)
      cv.removeEventListener('mousedown', md); window.removeEventListener('mouseup', mu); window.removeEventListener('mousemove', mm)
      cv.removeEventListener('touchstart', ts); cv.removeEventListener('touchmove', tm)
    }
  }, [enabled, camera, gl])

  useFrame((_, dt) => {
    if (!enabled) return
    const k = keys.current
    const spd = 0.068 * (k['ShiftLeft'] ? 2 : 1)
    const fwd = new THREE.Vector3()
    camera.getWorldDirection(fwd)
    fwd.y = 0
    fwd.normalize()
    const rgt = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0))
    const des = new THREE.Vector3()

    if (k['KeyW'] || k['ArrowUp']) des.addScaledVector(fwd, spd)
    if (k['KeyS'] || k['ArrowDown']) des.addScaledVector(fwd, -spd)
    if (k['KeyA'] || k['ArrowLeft']) des.addScaledVector(rgt, -spd)
    if (k['KeyD'] || k['ArrowRight']) des.addScaledVector(rgt, spd)

    vel.current.lerp(des, Math.min(dt * 14, 1))
    const np = camera.position.clone().add(vel.current)

    np.x = THREE.MathUtils.clamp(np.x, -bounds.maxX, bounds.maxX)
    np.z = THREE.MathUtils.clamp(np.z, -bounds.maxZ, bounds.maxZ)
    np.y = bounds.eyeHeight

    camera.position.copy(np)
  })

  return null
}

function SceneSpinner() {
  return (
    <Html center>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, fontFamily: '"Cormorant Garamond",Georgia,serif', color: '#c9a96e' }}>
        <div style={{ width: 44, height: 44, border: '2px solid rgba(201,169,110,0.25)', borderTopColor: '#c9a96e', borderRadius: '50%', animation: 'spin 1.2s linear infinite' }} />
        <span style={{ fontSize: 14, fontStyle: 'italic', letterSpacing: '0.06em', opacity: 0.8 }}>Loading gallery...</span>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </Html>
  )
}

function EnterOverlay({ onEnter, galleryName }: { onEnter: () => void; galleryName?: string }) {
  return (
    <div
      onClick={onEnter}
      style={{
        position: 'absolute', inset: 0, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(ellipse at center, rgba(14,12,9,0.55) 0%, rgba(14,12,9,0.82) 100%)',
        backdropFilter: 'blur(4px)',
        cursor: 'pointer', userSelect: 'none',
      }}
    >
      <div className="vg-enter-card" style={{
        background: 'rgba(14,12,9,0.88)',
        border: '1px solid rgba(201,169,110,0.25)',
        borderRadius: 24,
        padding: '44px 48px',
        maxWidth: 400, width: 'calc(100% - 40px)',
        textAlign: 'center',
        boxShadow: '0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
        backdropFilter: 'blur(24px)',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(201,169,110,0.15), rgba(201,169,110,0.05))',
          border: '1px solid rgba(201,169,110,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <CubeIcon style={{ width: 26, height: 26, color: '#c9a96e' }} />
        </div>

        {galleryName && (
          <p style={{
            fontFamily: '"DM Mono",monospace', fontSize: 10, fontWeight: 400,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: '#c9a96e', marginBottom: 8,
          }}>
            {galleryName}
          </p>
        )}

        <h2 style={{
          fontFamily: '"Cormorant Garamond",Georgia,serif',
          fontSize: 32, fontWeight: 300, letterSpacing: '0.02em',
          color: '#f5efe4', margin: '0 0 8px', lineHeight: 1.2,
        }}>
          Enter the Gallery
        </h2>
        <p style={{
          fontFamily: '"DM Sans",sans-serif', fontSize: 13,
          color: 'rgba(255,255,255,0.38)', margin: '0 0 32px', letterSpacing: '0.01em',
        }}>
          An immersive virtual exhibition
        </p>

        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12, padding: '16px 20px',
          marginBottom: 32, textAlign: 'left',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          {[
            { icon: '⌨️', label: 'Move', hint: <><span className="vg-kbd">W A S D</span> <span style={{ color: 'rgba(255,255,255,0.25)', margin: '0 6px' }}>/</span> <span className="vg-kbd">↑ ↓ ← →</span></> },
            { icon: '🖱️', label: 'Look', hint: 'Click & drag to rotate view' },
            { icon: '⚡', label: 'Sprint', hint: <><span className="vg-kbd">Shift</span> + move</> },
            { icon: '🖼️', label: 'Inspect', hint: 'Click any artwork for details' },
          ].map(({ icon, label, hint }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 14, width: 22, textAlign: 'center' }}>{icon}</span>
              <span style={{ fontFamily: '"DM Mono",monospace', fontSize: 10, letterSpacing: '0.08em', color: 'rgba(201,169,110,0.7)', width: 46, flexShrink: 0 }}>{label}</span>
              <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{hint}</span>
            </div>
          ))}
        </div>

        <button className="vg-btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 14, padding: '13px 24px' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#c9a96e', display: 'inline-block' }} />
          Begin Experience
        </button>
      </div>
    </div>
  )
}

function ArtworkSpotlight({ artwork }: { artwork: Artwork }) {
  const x = artwork.positionX ?? 0
  const y = (artwork.positionY && artwork.positionY !== 0) ? artwork.positionY + 0.3 : 2.2
  const z = artwork.positionZ ?? 0
  const rotY = artwork.rotationY ?? 0

  const wallOffset = 0.12
  const lampX = x - Math.sin(rotY) * wallOffset
  const lampZ = z - Math.cos(rotY) * wallOffset
  const lampY = y + 1.4

  return (
    <>
      <group position={[lampX, lampY, lampZ]} rotation={[0, rotY, 0]}>
        <mesh position={[0, 0.09, 0]}>
          <boxGeometry args={[0.03, 0.18, 0.03]} />
          <meshStandardMaterial color="#1a1410" metalness={0.95} roughness={0.15} />
        </mesh>
        <mesh position={[0, -0.01, 0.08]} rotation={[Math.PI / 4, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.09, 0.09, 12, 1, true]} />
          <meshStandardMaterial color="#111008" metalness={0.95} roughness={0.1} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.03, 0.11]} rotation={[Math.PI / 4, 0, 0]}>
          <circleGeometry args={[0.04, 12]} />
          <meshStandardMaterial color="#fff8d0" emissive="#fff8d0" emissiveIntensity={1.8} />
        </mesh>
      </group>

      <pointLight
        position={[lampX, lampY - 0.1, lampZ + Math.cos(rotY) * 0.15]}
        intensity={3}
        distance={4}
        decay={2}
        color="#fff6e0"
      />
    </>
  )
}

const ArtworkFrame = memo(function ArtworkFrame({
  artwork, isSelected, onClick,
}: { artwork: Artwork; isSelected: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  const grp = useRef<THREE.Group>(null)
  const sv = useRef(1)
  const texture = useTexture(safeUrl(artwork.imageUrl))

  useEffect(() => {
    if (texture) { texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8; texture.needsUpdate = true }
  }, [texture])

  const imgW = texture?.image?.width ?? 1, imgH = texture?.image?.height ?? 1
  const asp = imgW / imgH
  const fH = asp >= 1 ? 2.8 / asp : 2.8, fW = asp >= 1 ? 2.8 : 2.8 * asp
  const artW = fW - 0.18, artH = fH - 0.18

  useFrame((_, dt) => {
    if (!grp.current) return
    const t = hovered || isSelected ? 1.035 : 1
    sv.current += (t - sv.current) * Math.min(dt * 12, 1)
    grp.current.scale.setScalar(sv.current)
  })

  return (
    <group ref={grp}
      position={[
        artwork.positionX ?? 0,
(artwork.positionY && artwork.positionY !== 0) ? artwork.positionY + 0.3 : 2.2,
        artwork.positionZ ?? 0
      ]}
      rotation={[artwork.rotationX ?? 0, artwork.rotationY ?? 0, artwork.rotationZ ?? 0]}
      scale={[artwork.scaleX ?? 1, artwork.scaleY ?? 1, artwork.scaleZ ?? 1]}
      onClick={e => { e.stopPropagation(); onClick() }}
      onPointerOver={e => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto' }}
    >
      <mesh castShadow>
        <boxGeometry args={[fW + 0.18, fH + 0.18, 0.055]} />
        <meshStandardMaterial color={hovered ? '#d4b84a' : '#8b6c3a'} metalness={0.78} roughness={0.25}
          emissive={new THREE.Color(hovered ? '#9a7830' : '#000')} emissiveIntensity={hovered ? 0.18 : 0} />
      </mesh>
      <mesh position={[0, 0, 0.03]}><boxGeometry args={[fW, fH, 0.012]} /><meshStandardMaterial color="#f2ede2" roughness={0.9} /></mesh>
      <mesh position={[0, 0, 0.042]} castShadow><planeGeometry args={[artW, artH]} /><meshStandardMaterial map={texture} roughness={0.5} metalness={0} toneMapped /></mesh>
      {hovered && (
        <Html distanceFactor={9} position={[0, -(fH / 2 + 0.26), 0.05]} center>
          <div style={{
            background: 'rgba(14,12,9,0.92)', color: '#e8d5a3', padding: '6px 16px', borderRadius: '100px',
            fontSize: 11, fontFamily: '"DM Sans",sans-serif', fontWeight: 500, whiteSpace: 'nowrap',
            border: '1px solid rgba(201,169,110,0.4)', backdropFilter: 'blur(16px)', pointerEvents: 'none',
            boxShadow: '0 4px 24px rgba(0,0,0,0.6)', letterSpacing: '0.03em',
          }}>
            {artwork.title}
            {artwork.price != null && artwork.price > 0 &&
              <span style={{ color: '#c9a96e', marginLeft: 10, fontFamily: '"DM Mono",monospace', fontSize: 10 }}>
                {formatPrice(artwork.price)}
              </span>}
          </div>
        </Html>
      )}
    </group>
  )
})

function ArtworkDrawer({
  artwork, artworks, onClose, onNavigate, onAddToCart,
}: {
  artwork: Artwork; artworks: Artwork[]
  onClose: () => void; onNavigate: (a: Artwork) => void; onAddToCart: () => void
}) {
  const idx = artworks.findIndex(a => a.id === artwork.id)
  return (
    <>
      <div
        className="vg-drawer-overlay"
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(8,6,4,0.45)', backdropFilter: 'blur(3px)', zIndex: 40 }}
      />
      <aside
        className="vg-drawer"
        style={{
          position: 'fixed', right: 0, top: 0, bottom: 0, zIndex: 50,
          width: '100%', maxWidth: 380,
          background: '#0e0c09',
          borderLeft: '1px solid rgba(201,169,110,0.15)',
          display: 'flex', flexDirection: 'column',
          boxShadow: '-24px 0 80px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexShrink: 0,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontFamily: '"DM Mono",monospace', fontSize: 9, letterSpacing: '0.16em',
              textTransform: 'uppercase', color: 'rgba(201,169,110,0.55)', marginBottom: 6,
            }}>
              {String(idx + 1).padStart(2, '0')} / {String(artworks.length).padStart(2, '0')}
            </p>
            <h2 style={{
              fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: 22, fontWeight: 400,
              color: '#f5efe4', lineHeight: 1.25, margin: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any,
            }}>
              {artwork.title}
            </h2>
            {artwork.artistName && (
              <p style={{
                fontFamily: '"DM Sans",sans-serif', fontSize: 12, fontWeight: 400,
                color: 'rgba(201,169,110,0.7)', marginTop: 4, letterSpacing: '0.01em',
              }}>
                by {artwork.artistName}
              </p>
            )}
          </div>
          <button onClick={onClose} style={{
            width: 34, height: 34, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'all 0.2s',
          }}>
            <XMarkIcon style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <div style={{ position: 'relative', background: '#070504', flexShrink: 0 }}>
          <img src={safeUrl(artwork.imageUrl)} alt={artwork.title}
            style={{ width: '100%', aspectRatio: '4/3', objectFit: 'contain', display: 'block' }} />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 1,
            background: `linear-gradient(90deg, #c9a96e ${(idx + 1) / artworks.length * 100}%, rgba(255,255,255,0.06) 0%)`,
          }} />
          {idx > 0 && (
            <button onClick={() => onNavigate(artworks[idx - 1])} style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              width: 34, height: 34, borderRadius: '50%',
              background: 'rgba(14,12,9,0.82)', border: '1px solid rgba(201,169,110,0.25)',
              color: '#c9a96e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(8px)',
            }}>
              <ChevronLeftIcon style={{ width: 16, height: 16 }} />
            </button>
          )}
          {idx < artworks.length - 1 && (
            <button onClick={() => onNavigate(artworks[idx + 1])} style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              width: 34, height: 34, borderRadius: '50%',
              background: 'rgba(14,12,9,0.82)', border: '1px solid rgba(201,169,110,0.25)',
              color: '#c9a96e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(8px)',
            }}>
              <ChevronRightIcon style={{ width: 16, height: 16 }} />
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {artwork.description && (
            <p style={{
              fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: 15, fontStyle: 'italic',
              fontWeight: 300, lineHeight: 1.7, color: 'rgba(245,239,228,0.65)',
              borderLeft: '2px solid rgba(201,169,110,0.3)', paddingLeft: 16, margin: 0,
            }}>
              "{artwork.description}"
            </p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {artwork.year && <MetaChip label="Year" value={String(artwork.year)} />}
            {artwork.artworkType && <MetaChip label="Medium" value={artwork.artworkType} />}
            {artwork.dimensions && <MetaChip label="Dimensions" value={artwork.dimensions} />}
            {artwork.materials && <MetaChip label="Materials" value={artwork.materials} />}
          </div>

          <p style={{
            fontFamily: '"DM Mono",monospace', fontSize: 10, letterSpacing: '0.08em',
            color: 'rgba(255,255,255,0.2)', marginTop: 'auto',
          }}>
            Added {formatDate(artwork.createdAt)}
          </p>
        </div>

        <div style={{
          padding: '20px 24px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
          background: 'rgba(255,255,255,0.02)',
        }}>
          {artwork.price != null && artwork.price > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <p style={{ fontFamily: '"DM Mono",monospace', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(201,169,110,0.5)', marginBottom: 4 }}>Asking Price</p>
                <p style={{ fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: 28, fontWeight: 400, color: '#c9a96e', margin: 0, lineHeight: 1 }}>
                  {formatPrice(artwork.price)}
                </p>
              </div>
              <button onClick={onAddToCart} className="vg-btn-primary">
                <ShoppingCartIcon style={{ width: 15, height: 15 }} />
                Acquire
              </button>
            </div>
          ) : (
            <p style={{
              fontFamily: '"DM Sans",sans-serif', fontSize: 12,
              color: 'rgba(255,255,255,0.25)', textAlign: 'center', padding: '4px 0',
              letterSpacing: '0.02em',
            }}>
              Not available for acquisition
            </p>
          )}
        </div>
      </aside>
    </>
  )
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10, padding: '10px 14px',
    }}>
      <p style={{ fontFamily: '"DM Mono",monospace', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(201,169,110,0.5)', marginBottom: 4 }}>{label}</p>
      <p style={{ fontFamily: '"DM Sans",sans-serif', fontSize: 13, fontWeight: 500, color: 'rgba(245,239,228,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{value}</p>
    </div>
  )
}


export default function VirtualGalleryPage() {
  useEffect(() => { injectStyles() }, [])

  const { artistId } = useParams<{ artistId: string }>()
  const { data: gallery } = useArtistGallery(artistId!)
  const { data: artworks, isLoading: isLoadingArtworks } = useArtistArtworks(artistId!)
  const addItem = useCartStore(s => s.addItem)
  const { user } = useAuthStore()
  const isVisitor = user?.userType === 'Visitor'

  const { customization: galleryCustomization, loadFromApi, isLoading: isLoadingCustomization } = useGalleryDesignStore()

  useEffect(() => {
    const loadGalleryDesign = async () => {
      try {
const data = await galleryStudioApi.getCustomizationByArtist(artistId!)
        if (data) loadFromApi(data)
      } catch (error) {
        console.error('Failed to load gallery design:', error)
      }
    }
    loadGalleryDesign()
}, [loadFromApi, artistId])

  const [selected, setSelected] = useState<Artwork | null>(null)
  const [fpsActive, setFpsActive] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [tourActive, setTourActive] = useState(false)
  const [tourArtwork, setTourArtwork] = useState<Artwork | null>(null)
  const [tourProgress, setTourProgress] = useState(0)
  const [showEmoteWheel, setShowEmoteWheel] = useState(false)
  const [, setEmotePosition] = useState({ x: 0, y: 0 })

  const published = (artworks ?? []).filter(a => a.isPublished)
  const bounds = getCameraBounds(galleryCustomization)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyE' && !showEmoteWheel && fpsActive && !selected && !tourActive && isVisitor) {
        setEmotePosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
        setShowEmoteWheel(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showEmoteWheel, fpsActive, selected, tourActive, isVisitor])

  useEffect(() => { if (selected) setFpsActive(false) }, [selected])

  const handleAddToCart = useCallback(() => {
    if (!selected) return
    addItem({
      artworkId: selected.id, title: selected.title, imageUrl: selected.imageUrl,
      price: selected.price ?? 0, artistName: selected.artistName ?? 'Unknown Artist'
    })
    toast.success('Added to cart!')
    setSelected(null)
  }, [selected, addItem])


  if (isLoadingArtworks || isLoadingCustomization) {
    return <PageLoader message="Loading gallery..." />
  }

  if (!artworks || published.length === 0) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 24,
        background: '#0a0805', textAlign: 'center', padding: 24,
      }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CubeIcon style={{ width: 32, height: 32, color: 'rgba(201,169,110,0.4)' }} />
        </div>
        <div>
          <h1 style={{ fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: 26, fontWeight: 300, color: '#f5efe4', margin: '0 0 8px' }}>Gallery Not Found</h1>
          <p style={{ fontFamily: '"DM Sans",sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>No published artworks in this gallery yet.</p>
        </div>
        <Link to={ROUTES.BROWSE_GALLERIES} className="vg-btn-primary" style={{ textDecoration: 'none' }}>
          <ArrowLeftIcon style={{ width: 14, height: 14 }} /> Browse Galleries
        </Link>
      </div>
    )
  }

  const cameraPosition: [number, number, number] = [0, bounds.eyeHeight, bounds.maxZ * 0.7]

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#1a140c' }}>

      <Canvas
        key={`gallery-${galleryCustomization.structure?.shape}-${galleryCustomization.structure?.roomWidth}-${galleryCustomization.structure?.roomDepth}`}
        shadows={false}
        camera={{ position: cameraPosition, fov: 72, near: 0.05, far: 70 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1, powerPreference: 'high-performance' }}
        style={{ position: 'absolute', inset: 0 }}
        onClick={() => { if (!fpsActive && !selected && !tourActive) setFpsActive(true) }}
      >
        <Suspense fallback={<SceneSpinner />}>
          <StyledGalleryRoom customization={galleryCustomization} highQuality={true} />

          {published.map(aw => (
            <group key={aw.id}>
              <ArtworkFrame artwork={aw} isSelected={selected?.id === aw.id}
                onClick={() => { if (tourActive) setTourActive(false); setSelected(aw) }} />
              <ArtworkSpotlight artwork={aw} />
            </group>
          ))}
        </Suspense>

        <FPSController enabled={fpsActive && !selected && !tourActive} customization={galleryCustomization} />

        <VirtualTour
          artworks={published}
          enabled={tourActive}
          onWaypointReached={(artwork, progress) => { setTourArtwork(artwork); setTourProgress(progress) }}
          onStart={() => { setFpsActive(false) }}
          onEnd={() => { setTourActive(false); setTourArtwork(null); setTourProgress(0) }}
          pauseBetweenArtworks={4.5}
          moveDuration={2.5}
        />
      </Canvas>

      {!fpsActive && !selected && !tourActive && !isVisitor && (
        <EnterOverlay onEnter={() => setFpsActive(true)} galleryName={gallery?.galleryName ?? undefined} />
      )}

      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
        pointerEvents: 'none',
        background: 'linear-gradient(to bottom, rgba(8,6,4,0.85) 0%, transparent 100%)',
        padding: '18px 20px 48px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to={ROUTES.GALLERY(artistId!)} className="vg-btn-ghost" style={{ pointerEvents: 'auto', textDecoration: 'none' }}>
            <ArrowLeftIcon style={{ width: 14, height: 14 }} />
            Exit
          </Link>

          <div style={{ textAlign: 'center', pointerEvents: 'none' }}>
            <p style={{
              fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: 16, fontWeight: 400,
              color: 'rgba(245,239,228,0.9)', margin: 0, letterSpacing: '0.04em',
              textShadow: '0 1px 12px rgba(0,0,0,0.6)',
            }}>
              {gallery?.galleryName ?? 'Virtual Gallery'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'auto' }}>
            <button
              onClick={() => setShowInfo(s => !s)}
              style={{
                width: 34, height: 34, borderRadius: 10,
                background: showInfo ? 'rgba(201,169,110,0.15)' : 'rgba(14,12,9,0.72)',
                border: `1px solid ${showInfo ? 'rgba(201,169,110,0.4)' : 'rgba(255,255,255,0.1)'}`,
                color: showInfo ? '#c9a96e' : 'rgba(255,255,255,0.6)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(16px)',
              }}
            >
              <InformationCircleIcon style={{ width: 16, height: 16 }} />
            </button>
            <div style={{
              padding: '6px 14px',
              background: 'rgba(14,12,9,0.72)', backdropFilter: 'blur(16px)',
              borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)',
              fontFamily: '"DM Mono",monospace', fontSize: 11, color: 'rgba(255,255,255,0.4)',
            }}>
              {published.length} works
            </div>
          </div>
        </div>
      </div>

      {!selected && (
        <div style={{
          position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          zIndex: 30, display: 'flex', gap: 12, alignItems: 'center',
        }}>
          {!tourActive ? (
            <button className="vg-btn-primary" onClick={() => { setTourActive(true); setFpsActive(false) }}>
              <PlayIcon style={{ width: 14, height: 14 }} />
              Virtual Tour
            </button>
          ) : (
            <div className="vg-tour-pill" style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'rgba(14,12,9,0.88)', backdropFilter: 'blur(20px)',
              borderRadius: 100, padding: '10px 16px 10px 14px',
              border: '1px solid rgba(201,169,110,0.2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#c9a96e', animation: 'tourPulse 1.8s ease-in-out infinite' }} />
                <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: 12, color: 'rgba(245,239,228,0.75)' }}>Tour in progress</span>
              </div>
              <button onClick={() => setTourActive(false)} style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <StopIcon style={{ width: 12, height: 12 }} />
              </button>
            </div>
          )}
        </div>
      )}

      {tourActive && tourArtwork && (
        <div style={{
          position: 'absolute', bottom: 92, left: '50%', transform: 'translateX(-50%)',
          zIndex: 30, width: 'calc(100% - 40px)', maxWidth: 340,
          background: 'rgba(14,12,9,0.90)', backdropFilter: 'blur(24px)',
          borderRadius: 16, padding: '16px 20px',
          border: '1px solid rgba(201,169,110,0.2)',
          borderLeft: '3px solid #c9a96e',
        }}>
          <p style={{
            fontFamily: '"DM Mono",monospace', fontSize: 9, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: 'rgba(201,169,110,0.6)', marginBottom: 6,
          }}>Now Viewing</p>
          <p style={{ fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: 19, fontWeight: 400, color: '#f5efe4', margin: 0 }}>
            {tourArtwork.title}
          </p>
          <div style={{ marginTop: 12, height: 2, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 2,
              background: 'linear-gradient(90deg, #8a6a3a, #c9a96e)',
              width: `${tourProgress}%`, transition: 'width 0.1s linear',
            }} />
          </div>
        </div>
      )}

      {fpsActive && !selected && !tourActive && (
        <div style={{
          position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          zIndex: 30, pointerEvents: 'none',
          padding: '8px 18px',
          background: 'rgba(14,12,9,0.65)', backdropFilter: 'blur(16px)',
          borderRadius: 100, border: '1px solid rgba(255,255,255,0.07)',
          fontFamily: '"DM Sans",sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.35)',
          whiteSpace: 'nowrap',
        }}>
          Drag to look · WASD to walk · Click artwork for details {isVisitor && '· Press E for emotes'}
        </div>
      )}

      {showInfo && (
        <div className="vg-info-panel" style={{
          position: 'absolute', bottom: 80, right: 20, zIndex: 30,
          width: 260,
          background: 'rgba(14,12,9,0.92)', backdropFilter: 'blur(24px)',
          border: '1px solid rgba(201,169,110,0.18)',
          borderRadius: 16, padding: '20px 20px 16px',
        }}>
          <p style={{ fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: 16, color: '#f5efe4', marginBottom: 14 }}>Controls</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: '🖱️', text: 'Click & drag — look around' },
              { icon: '⬆️', text: 'WASD / arrows — move' },
              { icon: '🏃', text: 'Shift — sprint' },
              { icon: '🖼️', text: 'Click artwork — details' },
              { icon: '🎬', text: 'Virtual Tour — auto walkthrough' },
              ...(isVisitor ? [{ icon: '🎭', text: 'Press E — emotes' }] : []),
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, width: 20 }}>{icon}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{text}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setShowInfo(false)} style={{
            marginTop: 16, width: '100%', padding: '8px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8, fontSize: 12, color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
          }}>Close</button>
        </div>
      )}

      {selected && (
        <ArtworkDrawer
          artwork={selected} artworks={published}
          onClose={() => { setSelected(null); setFpsActive(true) }}
          onNavigate={setSelected}
          onAddToCart={handleAddToCart}
        />
      )}

    </div>
  )
}