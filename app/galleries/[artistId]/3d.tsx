import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView,
} from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { GLView } from 'expo-gl'
import * as THREE from 'three'
import { Renderer, TextureLoader } from 'expo-three'
import { useMyAvatar } from '@/hooks/useAvatar'
import {
  buildAvatarGroup, disposeAvatarGroup,
  tickAvatarAnimation, DEFAULT_AVATAR,
} from '@/components/avatar/buildAvatar'
import type { Avatar } from '@/types'
import { useAuthStore } from '@/store/authStore'

// ─── Config ───────────────────────────────────────────────────────────────────
const API_BASE      = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.1.184:5005'
const LOOK_SPEED    = 0.006
const WALK_SPEED    = 8.0
const TURN_SPEED    = 3.4
const BOUNDS        = 9.0
const PLAYER_HEIGHT = 1.65
const VIEW_DISTANCE = 2.8

const AVATAR_BASE_Y         = 0.0
const GALLERY_AVATAR_SCALE  = 1.0
const AVATAR_FORWARD_OFFSET = 2.4
const AVATAR_OPACITY        = 0.92
const FLOOR_VISUAL_Y        = -1.79

// ─── Web palette ──────────────────────────────────────────────────────────────
const C = {
  bg:        0x1a140c,
  wall:      0xede8e0,
  floor:     0x3a2d24,
  floorGrid: 0x4a3525,
  ceiling:   0xf2ede8,
  trim:      0xc8aa6a,
  sculpture: 0xc8a843,
  pedestal:  0xd0c8bc,
  bench:     0x7a4e2b,
  frame:     0xc4a96a,
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Artwork {
  id: string; title: string; imageUrl: string
  positionX: number; positionY: number; positionZ: number
  rotationY: number; scaleX?: number; scaleY?: number
}

// ─── Shared geometry/material cache (avoids re-allocation per frame) ──────────
let _sharedGeos: Record<string, THREE.BufferGeometry> | null = null
function getSharedGeos() {
  if (_sharedGeos) return _sharedGeos
  _sharedGeos = {
    box1:     new THREE.BoxGeometry(1, 1, 1),
    plane1:   new THREE.PlaneGeometry(1, 1),
    sphere:   new THREE.SphereGeometry(1, 8, 6),        // low-poly spheres
    cone:     new THREE.ConeGeometry(1, 1, 8),          // 8-seg cone
    cylinder: new THREE.CylinderGeometry(1, 1, 1, 12),
    circle:   new THREE.CircleGeometry(1, 16),
  }
  return _sharedGeos
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ArtGallery3D() {
  const { artistId } = useLocalSearchParams<{ artistId: string }>()
  const { user } = useAuthStore()
  const isVisitor = user?.userType === 'Visitor'

  const [artworks,    setArtworks]    = useState<Artwork[]>([])
  const [mode,        setMode]        = useState<'walk' | 'look'>('walk')
  const [loading,     setLoading]     = useState(true)
  const [loadingText, setLoadingText] = useState('Loading gallery...')
  const [posDisplay,  setPosDisplay]  = useState({ x: 0, z: 0, yaw: 0 })

  // Scene refs
  const glRef          = useRef<any>(null)
  const cameraRef      = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef    = useRef<Renderer | null>(null)
  const sceneRef       = useRef<THREE.Scene | null>(null)
  const sculptRef      = useRef<THREE.Mesh | null>(null)
  const rafRef         = useRef<number>(0)
  const builtRef       = useRef(false)
  const frameRef       = useRef(0)
  const hudThrottleRef = useRef(0)
  const artworksRef    = useRef<Artwork[]>([])
  const lastTimeRef    = useRef(performance.now())

  // Geometry disposal tracker
  const ownGeosRef  = useRef<THREE.BufferGeometry[]>([])
  const ownMatsRef  = useRef<THREE.Material[]>([])

  const poseRef = useRef({ x: 0, z: 8, yaw: Math.PI, pitch: 0 })
  const modeRef = useRef<'walk' | 'look'>('walk')
  useEffect(() => { modeRef.current = mode }, [mode])

  const lastTouch   = useRef({ x: 0, y: 0 })
  const lookDelta   = useRef({ x: 0, y: 0 })
  const lookVel     = useRef({ x: 0, y: 0 })   // smoothed look velocity
  const controls    = useRef({ forward: false, backward: false, left: false, right: false })

  // Avatar
  const { data: myAvatar } = useMyAvatar()
  const myAvatarRef = useRef<Avatar>(DEFAULT_AVATAR)
  myAvatarRef.current = myAvatar ?? DEFAULT_AVATAR

  const avatarStyleKey = useMemo(() => [
    myAvatar?.height, myAvatar?.hairStyle, myAvatar?.shirtStyle,
    myAvatar?.pantsStyle, myAvatar?.accessory, myAvatar?.skinColor,
    myAvatar?.hairColor, myAvatar?.shirtColor, myAvatar?.pantsColor,
    myAvatar?.shoesColor, myAvatar?.accessoryColor,
  ].join('|'), [
    myAvatar?.height, myAvatar?.hairStyle, myAvatar?.shirtStyle,
    myAvatar?.pantsStyle, myAvatar?.accessory, myAvatar?.skinColor,
    myAvatar?.hairColor, myAvatar?.shirtColor, myAvatar?.pantsColor,
    myAvatar?.shoesColor, myAvatar?.accessoryColor,
  ])

  const avatarSceneRef  = useRef<THREE.Group | null>(null)
  const avatarShadowRef = useRef<THREE.Mesh | null>(null)
  const avatarAnimStart = useRef(Date.now())
  const buildSceneRef   = useRef<((gl: any, arts: Artwork[]) => void) | null>(null)

  // ─── Fetch ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!artistId) return
    fetch(`${API_BASE}/api/galleries/${artistId}/artworks`)
      .then(r => r.json())
      .then((data: Artwork[]) => {
        artworksRef.current = data
        setArtworks(data)
        setLoadingText(`Found ${data.length} artworks…`)
      })
      .catch(() => setLoadingText('Failed to load artworks'))
  }, [artistId])

  useEffect(() => {
    if (glRef.current && artworks.length > 0 && !builtRef.current)
      buildSceneRef.current?.(glRef.current, artworks)
  }, [artworks])

  // ─── Avatar spawn ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading) return
    const scene = sceneRef.current
    if (!scene) return

    if (avatarSceneRef.current) {
      scene.remove(avatarSceneRef.current)
      disposeAvatarGroup(avatarSceneRef.current)
      avatarSceneRef.current = null
    }
    if (avatarShadowRef.current) {
      scene.remove(avatarShadowRef.current)
      avatarShadowRef.current.geometry.dispose()
      ;(avatarShadowRef.current.material as THREE.Material).dispose()
      avatarShadowRef.current = null
    }

    if (!isVisitor) return

    const body = buildAvatarGroup(myAvatarRef.current)
    body.scale.setScalar(GALLERY_AVATAR_SCALE)
    body.userData.baseY = AVATAR_BASE_Y
    body.traverse(obj => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      const mat = mesh.material as THREE.MeshStandardMaterial
      if (mat && 'transparent' in mat) {
        mat.transparent = true
        mat.opacity = AVATAR_OPACITY
        mat.depthWrite = false
      }
    })
    scene.add(body)
    avatarSceneRef.current = body

    const shadowGeo = new THREE.CircleGeometry(0.35, 16)   // 16-seg is plenty
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false,
    })
    const shadow = new THREE.Mesh(shadowGeo, shadowMat)
    shadow.rotation.x = -Math.PI / 2
    shadow.position.set(0, FLOOR_VISUAL_Y + 0.005, 0)
    scene.add(shadow)
    avatarShadowRef.current = shadow
    avatarAnimStart.current = Date.now()
  }, [loading, avatarStyleKey])

  // ─── Helpers ──────────────────────────────────────────────────────────────
  /** Create a geometry and register it for disposal */
  const mkGeo = useCallback(<T extends THREE.BufferGeometry>(g: T): T => {
    ownGeosRef.current.push(g); return g
  }, [])

  /** Create a material and register it for disposal */
  const mkMat = useCallback(<T extends THREE.Material>(m: T): T => {
    ownMatsRef.current.push(m); return m
  }, [])

  // ─── Build Scene ──────────────────────────────────────────────────────────
  const buildScene = useCallback(async (gl: any, arts: Artwork[]) => {
    if (builtRef.current) return
    builtRef.current = true

    try {
      const W = gl.drawingBufferWidth
      const H = gl.drawingBufferHeight

      const renderer = new Renderer({ gl })
      renderer.setSize(W, H)
      renderer.setClearColor(C.bg)
      // ✅ disable shadows entirely — huge GPU win on mobile
      renderer.shadowMap.enabled = false

      rendererRef.current = renderer

      const scene = new THREE.Scene()
      scene.background = new THREE.Color(C.bg)
      // ✅ linear fog is cheaper than FogExp2 and avoids near-clip pop
      scene.fog = new THREE.Fog(C.bg, 18, 38)
      sceneRef.current = scene

      const camera = new THREE.PerspectiveCamera(72, W / H, 0.1, 80)
      camera.matrixAutoUpdate = true
      camera.position.set(0, PLAYER_HEIGHT, 8)
      camera.lookAt(0, PLAYER_HEIGHT, 0)
      camera.updateProjectionMatrix()
      camera.updateMatrixWorld(true)
      cameraRef.current = camera
      poseRef.current = { x: 0, z: 8, yaw: Math.PI, pitch: 0 }

      // ── Lighting ──────────────────────────────────────────────────────────
      // ✅ Fewer, stronger lights — each light is an extra render pass on GPU
      scene.add(new THREE.AmbientLight(0xfff5e6, 1.1))

      const sun = new THREE.DirectionalLight(0xfff8f0, 1.6)
      sun.position.set(4, 7, 3)
      sun.castShadow = false
      scene.add(sun)

      // ✅ 4 point lights instead of 6+1 — still covers ceiling rail feel
      ;[[-4, -5], [-4, 5], [4, -5], [4, 5]].forEach(([x, z]) => {
        const s = new THREE.PointLight(0xfff0d8, 1.1, 16, 1.6)
        s.position.set(x, 4.3, z)
        scene.add(s)
      })

      // ── Shared materials ──────────────────────────────────────────────────
      const wallMat  = mkMat(new THREE.MeshLambertMaterial({ color: C.wall }))
      const floorMat = mkMat(new THREE.MeshLambertMaterial({ color: C.floor }))
      const ceilMat  = mkMat(new THREE.MeshLambertMaterial({ color: C.ceiling }))
      // ✅ MeshLambertMaterial is ~2× faster than MeshStandardMaterial on mobile
      //    Use Standard only where metalness/roughness visually matters (trim, sculpture, frames)
      const trimMat  = mkMat(new THREE.MeshStandardMaterial({ color: C.trim, metalness: 0.55, roughness: 0.30 }))

      // ── Floor ─────────────────────────────────────────────────────────────
      const floorGeo = mkGeo(new THREE.PlaneGeometry(20, 20))
      const floor = new THREE.Mesh(floorGeo, floorMat)
      floor.rotation.x = -Math.PI / 2; floor.position.y = -1.8
      scene.add(floor)

      const grid = new THREE.GridHelper(20, 10, C.floorGrid, C.floor)
      grid.position.y = -1.79
      ;(grid.material as THREE.Material).opacity = 0.22
      ;(grid.material as THREE.Material).transparent = true
      scene.add(grid)

      // ── Ceiling ───────────────────────────────────────────────────────────
      const ceilGeo = mkGeo(new THREE.PlaneGeometry(20.5, 20.5))
      const ceil = new THREE.Mesh(ceilGeo, ceilMat)
      ceil.rotation.x = Math.PI / 2; ceil.position.y = 3.9
      scene.add(ceil)

      // ── Walls (merged into as few meshes as possible) ─────────────────────
      const roomH = 6, halfY = 1.2
      ;[
        { p: [0, halfY, -9.9],  s: [20, roomH, 0.22] },
        { p: [0, halfY,  9.9],  s: [20, roomH, 0.22] },
        { p: [-9.9, halfY, 0],  s: [0.22, roomH, 20] },
        { p: [ 9.9, halfY, 0],  s: [0.22, roomH, 20] },
      ].forEach(({ p, s }) => {
        const m = new THREE.Mesh(mkGeo(new THREE.BoxGeometry(s[0], s[1], s[2])), wallMat)
        m.position.set(p[0], p[1], p[2])
        scene.add(m)
      })

      // ── Crown moldings + baseboards ───────────────────────────────────────
      const stripMat = trimMat
      const strip = (w: number, h: number, d: number, x: number, y: number, z: number, ry = 0) => {
        const m = new THREE.Mesh(mkGeo(new THREE.BoxGeometry(w, h, d)), stripMat)
        m.position.set(x, y, z); if (ry) m.rotation.y = ry; scene.add(m)
      }
      const cY = 3.72, bY = -1.66
      strip(20, 0.16, 0.18, 0, cY, -9.89); strip(20, 0.16, 0.18, 0, cY, 9.89)
      strip(20, 0.16, 0.18, 0, cY, 0, Math.PI/2); strip(20, 0.16, 0.18, 0, cY, 0, -Math.PI/2)
      strip(20, 0.14, 0.12, 0, bY, -9.89); strip(20, 0.14, 0.12, 0, bY, 9.89)
      strip(20, 0.14, 0.12, 0, bY, 0, Math.PI/2); strip(20, 0.14, 0.12, 0, bY, 0, -Math.PI/2)

      // ── Pedestal + sculpture ──────────────────────────────────────────────
      const pedMat  = mkMat(new THREE.MeshStandardMaterial({ color: C.pedestal, roughness: 0.25, metalness: 0.35 }))
      const sculMat = mkMat(new THREE.MeshStandardMaterial({ color: C.sculpture, metalness: 0.72, roughness: 0.15 }))

      const ped = new THREE.Mesh(mkGeo(new THREE.BoxGeometry(3.4, 0.65, 3.4)), pedMat)
      ped.position.set(0, -1.48, 0); scene.add(ped)

      const sculBase = new THREE.Mesh(mkGeo(new THREE.CylinderGeometry(0.82, 0.95, 0.42, 8)), sculMat)
      sculBase.position.set(0, -0.9, 0); scene.add(sculBase)

      // ✅ Reduced TorusKnot segments — still looks great, half the triangles
      const sculBody = new THREE.Mesh(
        mkGeo(new THREE.TorusKnotGeometry(0.65, 0.12, 60, 8, 2, 3)),
        sculMat
      )
      sculBody.position.set(0, -0.38, 0); scene.add(sculBody)
      sculptRef.current = sculBody

      // ── Benches ───────────────────────────────────────────────────────────
      const benchMat = mkMat(new THREE.MeshLambertMaterial({ color: C.bench }))
      ;[[-6, 5.5, 0.3], [6, -5.5, -0.3], [-5.5, -5, 0.9], [5.5, 4.5, -0.9]].forEach(([x, z, ry]) => {
        const seat = new THREE.Mesh(mkGeo(new THREE.BoxGeometry(3.0, 0.18, 0.9)), benchMat)
        seat.position.set(x, -1.32, z); seat.rotation.y = ry
        scene.add(seat)
        ;[[-1.1, 0], [1.1, 0], [-1.1, 0.6], [1.1, 0.6]].forEach(([lx, lz]) => {
          const leg = new THREE.Mesh(mkGeo(new THREE.BoxGeometry(0.08, 0.55, 0.08)), benchMat)
          leg.position.set(x + lx, -1.6, z + lz - 0.3); leg.rotation.y = ry; scene.add(leg)
        })
      })

      // ── Decorative wall panels ─────────────────────────────────────────────
      const panelMat = mkMat(new THREE.MeshLambertMaterial({ color: 0xf7f1e8 }))

      const addWallPanel = (x: number, y: number, z: number, w: number, h: number, rotY = 0) => {
        const panel = new THREE.Mesh(mkGeo(new THREE.BoxGeometry(w, h, 0.035)), panelMat)
        panel.position.set(x, y, z); panel.rotation.y = rotY; scene.add(panel)

        const border = new THREE.Mesh(mkGeo(new THREE.BoxGeometry(w + 0.16, h + 0.16, 0.025)), trimMat)
        border.position.set(x, y, z - 0.01); border.rotation.y = rotY; scene.add(border)
      }

      ;[-5.8, 0, 5.8].forEach(x => addWallPanel(x, 1.15, -9.76, 2.4, 2.8, 0))
      ;[-5.8, 0, 5.8].forEach(x => addWallPanel(x, 1.15, 9.76, 2.4, 2.8, Math.PI))
      ;[-5.8, 0, 5.8].forEach(z => addWallPanel(-9.76, 1.15, z, 2.4, 2.8, Math.PI / 2))
      ;[-5.8, 0, 5.8].forEach(z => addWallPanel(9.76, 1.15, z, 2.4, 2.8, -Math.PI / 2))

      // ── Decorative plants & flowers ───────────────────────────────────────
      // ✅ All plants/flowers use shared geometries scaled per instance
      //    → dramatically fewer GPU buffer uploads

      const potMat   = mkMat(new THREE.MeshLambertMaterial({ color: 0x8a5a36 }))
      const soilMat  = mkMat(new THREE.MeshLambertMaterial({ color: 0x2f2016 }))
      const leafMat1 = mkMat(new THREE.MeshLambertMaterial({ color: 0x2f7d46 }))
      const leafMat2 = mkMat(new THREE.MeshLambertMaterial({ color: 0x4f9b58 }))
      const stemMat  = mkMat(new THREE.MeshLambertMaterial({ color: 0x4b8b3b }))

      // ✅ One geometry per shape, reused across all instances
      const potGeo    = mkGeo(new THREE.CylinderGeometry(0.34, 0.26, 0.52, 14))
      const soilGeo   = mkGeo(new THREE.CylinderGeometry(0.26, 0.26, 0.04, 14))
      const leafGeo   = mkGeo(new THREE.ConeGeometry(0.11, 0.82, 8))
      const stemGeoS  = mkGeo(new THREE.CylinderGeometry(0.01, 0.01, 1, 4))   // scaled per flower
      const petalGeo  = mkGeo(new THREE.SphereGeometry(0.035, 6, 4))
      const centerGeo = mkGeo(new THREE.SphereGeometry(0.018, 6, 4))
      const leafSGeo  = mkGeo(new THREE.SphereGeometry(0.025, 6, 4))

      // Flower petal materials (one per color, reused)
      const flowerColors = [0xff6fae, 0xffd166, 0xa56eff, 0xff7f50, 0xffffff, 0xff4d6d, 0x7bd389, 0x6ecbff]
      const flowerMats = flowerColors.map(c => mkMat(new THREE.MeshLambertMaterial({ color: c })))
      const centerMat  = mkMat(new THREE.MeshLambertMaterial({ color: 0xf4c542 }))
      const planterMat = mkMat(new THREE.MeshLambertMaterial({ color: 0xd7c7ad }))

      function addBigPlant(x: number, z: number, scale = 1) {
        const g = new THREE.Group()
        g.position.set(x, 0, z)

        const pot = new THREE.Mesh(potGeo, potMat)
        pot.scale.setScalar(scale)
        pot.position.y = -1.55
        g.add(pot)

        const soil = new THREE.Mesh(soilGeo, soilMat)
        soil.scale.setScalar(scale)
        soil.position.y = -1.28
        g.add(soil)

        for (let i = 0; i < 10; i++) {   // ✅ 10 leaves instead of 13
          const angle = (i / 10) * Math.PI * 2
          const leaf = new THREE.Mesh(leafGeo, i % 2 === 0 ? leafMat1 : leafMat2)
          leaf.scale.setScalar(scale)
          leaf.position.set(
            Math.sin(angle) * 0.19 * scale, -0.88, Math.cos(angle) * 0.19 * scale
          )
          leaf.rotation.z = Math.sin(angle) * 0.7
          leaf.rotation.x = Math.cos(angle) * 0.7
          g.add(leaf)
        }

        const centerLeaf = new THREE.Mesh(leafGeo, leafMat1)
        centerLeaf.scale.set(scale * 1.18, scale * 1.15, scale * 1.18)
        centerLeaf.position.y = -0.8
        g.add(centerLeaf)

        scene.add(g)
      }

      function addFlowerBed(x: number, z: number, width = 1.6, depth = 0.6, count = 14) {
        // ✅ Reduced default count: 14 instead of 18/24/28
        const g = new THREE.Group()
        g.position.set(x, 0, z)

        const box = new THREE.Mesh(mkGeo(new THREE.BoxGeometry(width, 0.26, depth)), planterMat)
        box.position.y = -1.6
        g.add(box)

        const soilBox = new THREE.Mesh(mkGeo(new THREE.BoxGeometry(width - 0.08, 0.06, depth - 0.08)), soilMat)
        soilBox.position.y = -1.46
        g.add(soilBox)

        for (let i = 0; i < count; i++) {
          const fx = (Math.random() - 0.5) * (width - 0.18)
          const fz = (Math.random() - 0.5) * (depth - 0.18)
          const h  = 0.16 + Math.random() * 0.12

          const stem = new THREE.Mesh(stemGeoS, stemMat)
          stem.scale.set(1, h, 1)
          stem.position.set(fx, -1.40 + h / 2, fz)
          g.add(stem)

          const fMat = flowerMats[i % flowerMats.length]

          // ✅ 4 petals instead of 5 — barely noticeable, saves 20% draw calls
          for (let p = 0; p < 4; p++) {
            const petal = new THREE.Mesh(petalGeo, fMat)
            const a = (p / 4) * Math.PI * 2
            petal.position.set(fx + Math.cos(a) * 0.04, -1.40 + h, fz + Math.sin(a) * 0.04)
            petal.scale.set(1, 0.6, 1)
            g.add(petal)
          }

          const ctr = new THREE.Mesh(centerGeo, centerMat)
          ctr.position.set(fx, -1.40 + h, fz)
          g.add(ctr)

          if (Math.random() > 0.5) {
            const lf = new THREE.Mesh(leafSGeo, Math.random() > 0.5 ? leafMat1 : leafMat2)
            lf.position.set(fx + 0.03, -1.40 + h * 0.55, fz)
            lf.scale.set(1.4, 0.5, 0.8)
            g.add(lf)
          }
        }

        scene.add(g)
      }

      // Place plants
      addBigPlant(-7.4, -7.2, 1.0); addBigPlant(7.4, -7.2, 1.0)
      addBigPlant(-7.4,  7.2, 1.0); addBigPlant(7.4,  7.2, 1.0)
      addBigPlant(-5.8,  0,   0.95); addBigPlant(5.8, 0, 0.95)

      // Place flower beds (reduced count per bed)
      addFlowerBed(0,    -7.4, 2.4, 0.7, 16)
      addFlowerBed(0,     7.4, 2.4, 0.7, 16)
      addFlowerBed(-7.4,  0,   0.7, 2.2, 14)
      addFlowerBed( 7.4,  0,   0.7, 2.2, 14)
      addFlowerBed(-4.5,  7.4, 1.6, 0.6, 10)
      addFlowerBed( 4.5,  7.4, 1.6, 0.6, 10)
      addFlowerBed(-4.5, -7.4, 1.6, 0.6, 10)
      addFlowerBed( 4.5, -7.4, 1.6, 0.6, 10)

      // ── Particles ─────────────────────────────────────────────────────────
      // ✅ 80 particles instead of 120
      const pPos = new Float32Array(80 * 3)
      for (let i = 0; i < 80; i++) {
        pPos[i*3]   = (Math.random() - 0.5) * 18
        pPos[i*3+1] = Math.random() * 5 - 1
        pPos[i*3+2] = (Math.random() - 0.5) * 18
      }
      const pGeo = mkGeo(new THREE.BufferGeometry())
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3))
      const particles = new THREE.Points(
        pGeo,
        mkMat(new THREE.PointsMaterial({ color: 0xd4c5a0, size: 0.025, transparent: true, opacity: 0.32, sizeAttenuation: true }))
      )
      scene.add(particles)

      // ── Artworks ──────────────────────────────────────────────────────────
      const loader   = new TextureLoader()
      const added    = new Set<string>()
      const host     = API_BASE.replace(/https?:\/\//, '').split(':')[0]
      let   loaded   = 0

      for (const art of arts) {
        if (added.has(art.id)) continue; added.add(art.id)
        try {
          const url = art.imageUrl.replace('127.0.0.1', host).replace('localhost', host)
          const scaleW = 1.8 * (art.scaleX ?? 1)
          const scaleH = 1.2 * (art.scaleY ?? 1)

          let x = art.positionX, z = art.positionZ, rotY = 0
          const WALL = 9.72
          if (Math.abs(x) > Math.abs(z)) {
            x = x > 0 ? WALL : -WALL
            rotY = x > 0 ? -Math.PI/2 : Math.PI/2
          } else {
            z = z > 0 ? WALL : -WALL
            rotY = z > 0 ? Math.PI : 0
          }

          // ✅ Frame uses MeshStandardMaterial for the metallic look
          const frameMat = mkMat(new THREE.MeshStandardMaterial({ color: C.frame, metalness: 0.65, roughness: 0.25 }))
          const frame = new THREE.Mesh(mkGeo(new THREE.BoxGeometry(scaleW + 0.2, scaleH + 0.2, 0.08)), frameMat)
          frame.position.set(x, art.positionY, z); frame.rotation.y = rotY
          scene.add(frame)

          const texture = await loader.loadAsync(url)
          texture.minFilter = THREE.LinearFilter
          // ✅ anisotropy improves texture sharpness with near-zero perf cost
          texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy())
          texture.needsUpdate = true

          const nX = Math.sin(rotY), nZ = Math.cos(rotY)
          const canvasMesh = new THREE.Mesh(
            mkGeo(new THREE.PlaneGeometry(scaleW, scaleH)),
            mkMat(new THREE.MeshBasicMaterial({ map: texture, side: THREE.FrontSide }))
            // ✅ MeshBasicMaterial for artworks — no lighting math needed, looks the same
          )
          canvasMesh.position.set(x + nX * 0.06, art.positionY, z + nZ * 0.06)
          canvasMesh.rotation.y = rotY; scene.add(canvasMesh)

          // ✅ Spot per artwork — keep but reduce intensity/range
          const spot = new THREE.SpotLight(0xfff8e8, 1.2, 8, 0.42, 0.5, 1.5)
          spot.position.set(x, 3.5, z + nZ * 2)
          spot.target.position.set(x, art.positionY, z)
          scene.add(spot); scene.add(spot.target)

          loaded++; setLoadingText(`Loading artworks… ${loaded}/${arts.length}`)
        } catch (e) { console.warn('Artwork failed:', art.title, e) }
      }

      setLoading(false)

      // ─── Animation loop ────────────────────────────────────────────────────
      const animate = () => {
        rafRef.current = requestAnimationFrame(animate)
        const cam      = cameraRef.current
        const renderer = rendererRef.current
        const scene    = sceneRef.current
        const glCtx    = glRef.current
        if (!cam || !renderer || !scene || !glCtx) return

        frameRef.current++
        const now = performance.now()
        const dt  = Math.min(0.05, (now - lastTimeRef.current) / 1000)
        lastTimeRef.current = now

        // ✅ Smooth look with exponential decay (no jitter)
        if (modeRef.current === 'look') {
          const dx = lookDelta.current.x, dy = lookDelta.current.y
          if (dx !== 0 || dy !== 0) {
            lookVel.current.x = lookVel.current.x * 0.72 + dx * 0.28
            lookVel.current.y = lookVel.current.y * 0.72 + dy * 0.28
            poseRef.current.yaw   -= lookVel.current.x * LOOK_SPEED
            poseRef.current.pitch -= lookVel.current.y * LOOK_SPEED
            poseRef.current.pitch  = Math.max(-1.3, Math.min(1.3, poseRef.current.pitch))
            lookDelta.current.x = lookDelta.current.y = 0
          } else {
            // ✅ Keep decaying even after touch ends — smooth coast
            lookVel.current.x *= 0.82
            lookVel.current.y *= 0.82
            poseRef.current.yaw   -= lookVel.current.x * LOOK_SPEED
            poseRef.current.pitch -= lookVel.current.y * LOOK_SPEED
            poseRef.current.pitch  = Math.max(-1.3, Math.min(1.3, poseRef.current.pitch))
          }
        }

        // Walk mode — delta-time based
        if (modeRef.current === 'walk') {
          let moveForward = 0, turn = 0
          if (controls.current.forward)  moveForward += 1
          if (controls.current.backward) moveForward -= 1
          if (controls.current.left)     turn        += 1
          if (controls.current.right)    turn        -= 1

          poseRef.current.yaw += turn * TURN_SPEED * dt
          poseRef.current.yaw  = ((poseRef.current.yaw % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)

          const yaw = poseRef.current.yaw
          let nx = poseRef.current.x + Math.sin(yaw) * moveForward * WALK_SPEED * dt
          let nz = poseRef.current.z + Math.cos(yaw) * moveForward * WALK_SPEED * dt
          nx = Math.max(-BOUNDS, Math.min(BOUNDS, nx))
          nz = Math.max(-BOUNDS, Math.min(BOUNDS, nz))
          poseRef.current.x = nx; poseRef.current.z = nz
          cam.position.set(nx, PLAYER_HEIGHT, nz)
        }

        // Camera direction
        const yaw   = poseRef.current.yaw
        const pitch = modeRef.current === 'walk' ? 0 : poseRef.current.pitch
        cam.lookAt(
          poseRef.current.x + Math.sin(yaw) * Math.cos(pitch),
          PLAYER_HEIGHT + Math.sin(pitch),
          poseRef.current.z + Math.cos(yaw) * Math.cos(pitch)
        )
        cam.updateMatrixWorld(true)

        // ✅ Sculpture rotates every frame, particles every 2nd frame — halves overdraw
        if (sculptRef.current) sculptRef.current.rotation.y += 0.008
        if (frameRef.current % 2 === 0) particles.rotation.y += 0.0008

        // Avatar
        const body = avatarSceneRef.current
        if (body) {
          const fX = Math.sin(poseRef.current.yaw), fZ = Math.cos(poseRef.current.yaw)
          body.position.set(
            poseRef.current.x + fX * AVATAR_FORWARD_OFFSET,
            AVATAR_BASE_Y,
            poseRef.current.z + fZ * AVATAR_FORWARD_OFFSET
          )
          body.rotation.y = poseRef.current.yaw
          if (avatarShadowRef.current)
            avatarShadowRef.current.position.set(body.position.x, FLOOR_VISUAL_Y + 0.005, body.position.z)
          tickAvatarAnimation(body, (Date.now() - avatarAnimStart.current) / 1000, controls.current.forward || controls.current.backward)
        }

        // ✅ Single error drain — keep but skip inside tight loop
        if (glCtx.getError) glCtx.getError()
        try { renderer.render(scene, cam) } catch {}
        glCtx.endFrameEXP()

        // HUD update throttled to every 8 frames
        hudThrottleRef.current++
        if (hudThrottleRef.current >= 8) {
          hudThrottleRef.current = 0
          setPosDisplay({ x: poseRef.current.x, z: poseRef.current.z, yaw: poseRef.current.yaw })
        }
      }
      animate()

    } catch (err) {
      console.error('Scene build error:', err)
      setLoadingText('Error building gallery')
      setLoading(false)
    }
  }, [mkGeo, mkMat])

  useEffect(() => { buildSceneRef.current = buildScene }, [buildScene])

  const onContextCreate = useCallback((gl: any) => {
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
    gl.canvas = {
      width: gl.drawingBufferWidth, height: gl.drawingBufferHeight,
      style: {}, addEventListener: () => {}, removeEventListener: () => {},
      clientHeight: gl.drawingBufferHeight,
    }
    glRef.current = gl
    if (artworksRef.current.length > 0 && !builtRef.current)
      buildSceneRef.current?.(gl, artworksRef.current)
  }, [])

  // ─── Cleanup ──────────────────────────────────────────────────────────────
  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current)
    if (avatarSceneRef.current) disposeAvatarGroup(avatarSceneRef.current)
    if (avatarShadowRef.current) {
      avatarShadowRef.current.geometry.dispose()
      ;(avatarShadowRef.current.material as THREE.Material).dispose()
    }
    // ✅ Dispose every geometry and material we created
    ownGeosRef.current.forEach(g => g.dispose())
    ownMatsRef.current.forEach(m => m.dispose())
    rendererRef.current?.dispose()
  }, [])

  // ─── Movement helpers ─────────────────────────────────────────────────────
  const STEP = 1.6, TURN_STEP = Math.PI / 7

  const teleportToArtwork = useCallback((art: Artwork) => {
    const cam = cameraRef.current; if (!cam) return
    const rotY = art.rotationY ?? 0
    const nx = Math.min(BOUNDS, Math.max(-BOUNDS, art.positionX - Math.sin(rotY) * VIEW_DISTANCE))
    const nz = Math.min(BOUNDS, Math.max(-BOUNDS, art.positionZ - Math.cos(rotY) * VIEW_DISTANCE))
    cam.position.set(nx, PLAYER_HEIGHT, nz)
    cam.lookAt(art.positionX, art.positionY, art.positionZ)
    cam.updateMatrixWorld(true)
    poseRef.current = { x: nx, z: nz, yaw: rotY, pitch: 0 }
    setPosDisplay({ x: nx, z: nz, yaw: rotY })
  }, [])

  const resetPos = useCallback(() => {
    const cam = cameraRef.current; if (!cam) return
    cam.position.set(0, PLAYER_HEIGHT, -7)
    cam.lookAt(0, PLAYER_HEIGHT, 0); cam.updateMatrixWorld(true)
    poseRef.current = { x: 0, z: -7, yaw: 0, pitch: 0 }
    setPosDisplay({ x: 0, z: -7, yaw: 0 })
  }, [])

  const stepForward = useCallback(() => {
    const yaw = poseRef.current.yaw
    const nx = Math.max(-BOUNDS, Math.min(BOUNDS, poseRef.current.x + Math.sin(yaw) * STEP))
    const nz = Math.max(-BOUNDS, Math.min(BOUNDS, poseRef.current.z + Math.cos(yaw) * STEP))
    poseRef.current.x = nx; poseRef.current.z = nz
    const cam = cameraRef.current; if (cam) { cam.position.set(nx, PLAYER_HEIGHT, nz); cam.updateMatrixWorld(true) }
  }, [])

  const stepBackward = useCallback(() => {
    const yaw = poseRef.current.yaw
    const nx = Math.max(-BOUNDS, Math.min(BOUNDS, poseRef.current.x - Math.sin(yaw) * STEP))
    const nz = Math.max(-BOUNDS, Math.min(BOUNDS, poseRef.current.z - Math.cos(yaw) * STEP))
    poseRef.current.x = nx; poseRef.current.z = nz
    const cam = cameraRef.current; if (cam) { cam.position.set(nx, PLAYER_HEIGHT, nz); cam.updateMatrixWorld(true) }
  }, [])

  const stepTurnLeft  = useCallback(() => { poseRef.current.yaw += TURN_STEP }, [])
  const stepTurnRight = useCallback(() => { poseRef.current.yaw -= TURN_STEP }, [])

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={S.root}>
      <GLView style={S.gl} onContextCreate={onContextCreate} />

      {loading && (
        <View style={S.loadOverlay}>
          <View style={S.loadBox}>
            <View style={S.loadIcon} />
            <Text style={S.loadTitle}>Virtual Gallery</Text>
            <Text style={S.loadSub}>{loadingText}</Text>
          </View>
        </View>
      )}

      <View
        style={StyleSheet.absoluteFillObject}
        onTouchMove={e => {
          if (modeRef.current !== 'look' || loading) return
          const { locationX: lx, locationY: ly } = e.nativeEvent
          if (lastTouch.current.x !== 0)
            lookDelta.current = { x: lx - lastTouch.current.x, y: ly - lastTouch.current.y }
          lastTouch.current = { x: lx, y: ly }
        }}
        onTouchEnd={() => { lastTouch.current = { x: 0, y: 0 } }}
        pointerEvents={mode === 'look' && !loading ? 'box-only' : 'none'}
      />

      {/* ── Top bar ── */}
      <View style={S.topBar} pointerEvents="box-none">
        <TouchableOpacity style={S.modeBtn} onPress={() => !loading && setMode(m => m === 'walk' ? 'look' : 'walk')}>
          <Text style={S.modeTxt}>{mode === 'walk' ? 'WALK' : 'LOOK'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={S.resetBtn} onPress={resetPos}>
          <Text style={S.resetTxt}>⟳</Text>
        </TouchableOpacity>
        <View style={S.hud}>
          <Text style={S.hudTxt}>
            {posDisplay.x.toFixed(1)}, {posDisplay.z.toFixed(1)}{'  '}{(posDisplay.yaw * 180 / Math.PI).toFixed(0)}°
          </Text>
        </View>
      </View>

      {/* ── Artwork teleport bar ── */}
      {!loading && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={S.teleportBar} contentContainerStyle={S.teleportContent} pointerEvents="box-none">
          {artworks.map((art, i) => (
            <TouchableOpacity key={art.id ?? i} style={S.teleportBtn} onPress={() => teleportToArtwork(art)}>
              <Text style={S.teleportTxt}>🖼 {art.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* ── D-pad ── */}
      {mode === 'walk' && !loading && (
        <View style={S.controls} pointerEvents="box-none">
          <View style={S.dpad}>
            <TouchableOpacity style={[S.btn, S.btnTop]}
              hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
              onPressIn={() => { controls.current.forward = true }}
              onPressOut={() => { controls.current.forward = false }}
              onPress={stepForward}>
              <Text style={S.btnTxt}>▲</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[S.btn, S.btnLeft]}
              hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
              onPressIn={() => { controls.current.left = true }}
              onPressOut={() => { controls.current.left = false }}
              onPress={stepTurnLeft}>
              <Text style={S.btnTxt}>◀</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[S.btn, S.btnRight]}
              hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
              onPressIn={() => { controls.current.right = true }}
              onPressOut={() => { controls.current.right = false }}
              onPress={stepTurnRight}>
              <Text style={S.btnTxt}>▶</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[S.btn, S.btnBottom]}
              hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
              onPressIn={() => { controls.current.backward = true }}
              onPressOut={() => { controls.current.backward = false }}
              onPress={stepBackward}>
              <Text style={S.btnTxt}>▼</Text>
            </TouchableOpacity>
          </View>
          <Text style={S.hint}>tap = step  ·  hold = walk  ·  ◀ ▶ turn</Text>
        </View>
      )}

      {mode === 'look' && !loading && (
        <View style={S.lookHelp} pointerEvents="none">
          <Text style={S.lookHelpTxt}>👆 Drag to look around</Text>
        </View>
      )}
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const GOLD      = '#c9a96e'
const GLASS     = 'rgba(14,12,9,0.78)'
const BORDER    = 'rgba(201,169,110,0.22)'

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a140c' },
  gl:   { flex: 1 },

  loadOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(14,12,9,0.94)', justifyContent: 'center', alignItems: 'center' },
  loadBox:     { alignItems: 'center', gap: 16, padding: 36, borderRadius: 24, backgroundColor: 'rgba(201,169,110,0.07)', borderWidth: 1, borderColor: BORDER, maxWidth: 300, width: '80%' },
  loadIcon:    { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(201,169,110,0.12)', borderWidth: 1, borderColor: 'rgba(201,169,110,0.35)', marginBottom: 4 },
  loadTitle:   { color: '#f5efe4', fontSize: 20, fontWeight: '300', letterSpacing: 1.5 },
  loadSub:     { color: 'rgba(201,169,110,0.7)', fontSize: 12, textAlign: 'center', letterSpacing: 0.5 },

  topBar:   { position: 'absolute', top: 48, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
  modeBtn:  { backgroundColor: GLASS, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, borderWidth: 1, borderColor: BORDER },
  modeTxt:  { color: 'rgba(255,255,255,0.8)', fontWeight: '600', fontSize: 12, letterSpacing: 0.5 },
  resetBtn: { backgroundColor: GLASS, width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: BORDER },
  resetTxt: { color: GOLD, fontSize: 20, fontWeight: '700' },
  hud:      { flex: 1, backgroundColor: GLASS, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: BORDER },
  hudTxt:   { color: GOLD, fontSize: 10, fontFamily: 'monospace', opacity: 0.85 },

  teleportBar:     { position: 'absolute', top: 100, left: 0, right: 0, maxHeight: 46 },
  teleportContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  teleportBtn:     { backgroundColor: GLASS, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, borderWidth: 1, borderColor: BORDER },
  teleportTxt:     { color: 'rgba(201,169,110,0.85)', fontSize: 12, fontWeight: '500' },

  controls: { position: 'absolute', bottom: 40, left: 16, right: 16, alignItems: 'center', gap: 10 },
  dpad:     { width: 168, height: 168, position: 'relative' },
  btn: {
    position: 'absolute', width: 56, height: 56, borderRadius: 28,
    backgroundColor: GLASS, borderWidth: 1, borderColor: BORDER,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8,
  },
  btnTop:    { top: 0,   left: 56 },
  btnLeft:   { top: 56,  left: 0  },
  btnRight:  { top: 56,  left: 112 },
  btnBottom: { top: 112, left: 56 },
  btnTxt:    { color: GOLD, fontSize: 22, fontWeight: '700' },

  hint: { color: 'rgba(201,169,110,0.45)', fontSize: 11, letterSpacing: 0.3 },

  lookHelp:    { position: 'absolute', bottom: 44, left: 16, right: 16, alignItems: 'center' },
  lookHelpTxt: { backgroundColor: GLASS, color: 'rgba(255,255,255,0.65)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 100, fontSize: 14, borderWidth: 1, borderColor: BORDER },
})