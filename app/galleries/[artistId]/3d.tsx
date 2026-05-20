import { useEffect, useRef, useState, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Animated,
} from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { GLView } from 'expo-gl'
import * as THREE from 'three'
import { Renderer, TextureLoader } from 'expo-three'

// ─── Config ───────────────────────────────────────────────────────────────────
// FIX #6: no hardcoded IP — use env variable or relative URL
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.1.95:5005'

const WALK_SPEED    = 0.5
const TURN_SPEED    = 0.08
const LOOK_SPEED    = 0.004
const BOUNDS        = 9.2
const PLAYER_HEIGHT = 1.65
const VIEW_DISTANCE = 2.5   // how far in front of the artwork the camera will stand

// ─── Types ────────────────────────────────────────────────────────────────────



interface Artwork {
  id:         string
  title:      string
  imageUrl:   string
  positionX:  number
  positionY:  number
  positionZ:  number
  rotationY:  number   // direction the artwork is facing (outward from wall)
  scaleX?:    number
  scaleY?:    number
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ArtGallery3D() {
  
  const { artistId } = useLocalSearchParams<{ artistId: string }>()

  const [artworks,    setArtworks]    = useState<Artwork[]>([])
  const [mode,        setMode]        = useState<'walk' | 'look'>('walk')
  const [loading,     setLoading]     = useState(true)
  const [loadingText, setLoadingText] = useState('Loading gallery...')
  const [posDisplay,  setPosDisplay]  = useState({ x: 0, z: 0, yaw: 0 })

  // ── Scene refs (never triggers re-render) ──────────────────────────────────
  const glRef        = useRef<any>(null)
  const cameraRef    = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef  = useRef<Renderer | null>(null)
  const sceneRef     = useRef<THREE.Scene | null>(null)
  const sculptRef    = useRef<THREE.Mesh | null>(null)
  const rafRef       = useRef<number>(0)
  const builtRef     = useRef(false)   // FIX #1: guard against double buildScene

  // ── Pose ref (avoids stale closure in animation loop) ─────────────────────
  const poseRef  = useRef({ x: 0, z: 0, yaw: 0, pitch: 0 })
  const modeRef  = useRef<'walk' | 'look'>('walk')
  useEffect(() => { modeRef.current = mode }, [mode])

  // ── Look drag state ────────────────────────────────────────────────────────
  const lastTouch = useRef({ x: 0, y: 0 })
  const lookDelta = useRef({ x: 0, y: 0 })

  const controls = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
  })


  // ─── Fetch artworks ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!artistId) return
    fetch(`${API_BASE}/api/galleries/${artistId}/artworks`)
      .then(r => r.json())
      .then((data: Artwork[]) => {
        setArtworks(data)
        setLoadingText(`Found ${data.length} artworks, building scene…`)
      })
      .catch(err => {
        console.error('Fetch artworks failed:', err)
        setLoadingText('Failed to load artworks')
      })
  }, [artistId])

  // ─── Build scene once GL + artworks are both ready ─────────────────────────
  const buildScene = useCallback(async (gl: any, arts: Artwork[]) => {
    if (builtRef.current) return
    builtRef.current = true

    try {
      const W = gl.drawingBufferWidth
      const H = gl.drawingBufferHeight

      // ── Renderer ──────────────────────────────────────────────────────────
      const renderer = new Renderer({ gl })
      renderer.setSize(W, H)
      renderer.setClearColor(0x0a0a1a)
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type    = THREE.PCFSoftShadowMap
      rendererRef.current = renderer

      // ── Scene ─────────────────────────────────────────────────────────────
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x0a0a1a)
      scene.fog        = new THREE.FogExp2(0x0a0a1a, 0.006)
      sceneRef.current = scene

      // ── Camera ────────────────────────────────────────────────────────────
      const camera = new THREE.PerspectiveCamera(70, W / H, 0.05, 200)
      camera.position.set(0, 1.7, 8)
      camera.lookAt(0, PLAYER_HEIGHT, 0)
      cameraRef.current = camera
      poseRef.current = { x: 0, z: 8, yaw: Math.PI, pitch: 0 }
      setPosDisplay({ x: 0, z: -7, yaw: 0 })
      console.log(poseRef.current)

      // ── Lights ────────────────────────────────────────────────────────────
      scene.add(new THREE.AmbientLight(0xfff5e6, 0.9))

      const sun = new THREE.DirectionalLight(0xfff8f0, 2.2)
      sun.position.set(3, 8, 4)
      sun.castShadow = true
      sun.shadow.mapSize.set(1024, 1024)
      sun.shadow.camera.near = 0.5
      sun.shadow.camera.far  = 40
      scene.add(sun)

      // Track lights — two rails
      ;[-4, 4].forEach(x =>
        [-5, 0, 5].forEach(z => {
          const spot = new THREE.PointLight(0xfff0d8, 1.0, 14, 1.4)
          spot.position.set(x, 4.5, z)
          scene.add(spot)
        })
      )

      const fill = new THREE.PointLight(0xd4b896, 0.4, 20, 2)
      fill.position.set(0, 2, 0)
      scene.add(fill)

      // ── Materials (shared) ────────────────────────────────────────────────
      const wallMat  = new THREE.MeshStandardMaterial({ color: 0xede8e0, roughness: 0.85, metalness: 0.02 })
      const floorMat = new THREE.MeshStandardMaterial({ color: 0x3a2d24, roughness: 0.4,  metalness: 0.15 })
      const ceilMat  = new THREE.MeshStandardMaterial({ color: 0xf2ede8, roughness: 0.9 })
      const trimMat  = new THREE.MeshStandardMaterial({ color: 0xc8aa6a, metalness: 0.55, roughness: 0.30 })

      // ── Floor ─────────────────────────────────────────────────────────────
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), floorMat)
      floor.rotation.x   = -Math.PI / 2
      floor.position.y   = -1.8
      floor.receiveShadow = true
      scene.add(floor)

      // Tile lines (subtle, not a debug grid)
      const tileGrid = new THREE.GridHelper(20, 10, 0x5a4535, 0x4a3525)
      tileGrid.position.y = -1.79
      ;(tileGrid.material as THREE.Material).opacity     = 0.25
      ;(tileGrid.material as THREE.Material).transparent = true
      scene.add(tileGrid)

      // ── Ceiling ───────────────────────────────────────────────────────────
      const ceil = new THREE.Mesh(new THREE.PlaneGeometry(20.5, 20.5), ceilMat)
      ceil.rotation.x = Math.PI / 2
      ceil.position.y = 3.9
      scene.add(ceil)

      // ── Walls ─────────────────────────────────────────────────────────────
      const roomH = 6
      const halfY = 1.2
      const wallDefs = [
        { pos: [0,  halfY, -9.9] as const, size: [20, roomH, 0.22] as const },
        { pos: [0,  halfY,  9.9] as const, size: [20, roomH, 0.22] as const },
        { pos: [-9.9, halfY, 0 ] as const, size: [0.22, roomH, 20] as const },
        { pos: [ 9.9, halfY, 0 ] as const, size: [0.22, roomH, 20] as const },
      ]
      // FIXED: TypeScript error TS2556 – avoid spread, use explicit indices
      wallDefs.forEach(({ pos, size }) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), wallMat)
        mesh.position.set(pos[0], pos[1], pos[2])
        mesh.receiveShadow = true
        scene.add(mesh)
      })

      // ── Crown moldings & baseboards ────────────────────────────────────────
      const addStrip = (w: number, h: number, d: number, x: number, y: number, z: number, ry = 0) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), trimMat)
        m.position.set(x, y, z)
        if (ry) m.rotation.y = ry
        scene.add(m)
      }
      const crownY = 3.72, baseY = -1.66
      addStrip(20, 0.16, 0.18, 0, crownY,  -9.89)
      addStrip(20, 0.16, 0.18, 0, crownY,   9.89)
      addStrip(20, 0.16, 0.18, 0, crownY,   0, Math.PI / 2)
      addStrip(20, 0.16, 0.18, 0, crownY,   0, -Math.PI / 2)
      addStrip(20, 0.14, 0.12, 0, baseY,  -9.89)
      addStrip(20, 0.14, 0.12, 0, baseY,   9.89)
      addStrip(20, 0.14, 0.12, 0, baseY,   0, Math.PI / 2)
      addStrip(20, 0.14, 0.12, 0, baseY,   0, -Math.PI / 2)

      // ── Center pedestal + sculpture ────────────────────────────────────────
      const pedMat  = new THREE.MeshStandardMaterial({ color: 0xd0c8bc, roughness: 0.25, metalness: 0.35 })
      const sculMat = new THREE.MeshStandardMaterial({ color: 0xc8a843, metalness: 0.72, roughness: 0.15 })

      const ped = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.65, 3.4), pedMat)
      ped.position.set(0, -1.48, 0)
      ped.castShadow = ped.receiveShadow = true
      scene.add(ped)

      const sculBase = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.95, 0.42, 8), sculMat)
      sculBase.position.set(0, -0.9, 0)
      scene.add(sculBase)

      const sculBody = new THREE.Mesh(new THREE.TorusKnotGeometry(0.65, 0.12, 80, 10, 2, 3), sculMat)
      sculBody.position.set(0, -0.38, 0)
      sculBody.castShadow = true
      scene.add(sculBody)
      sculptRef.current = sculBody

      // ── Benches ───────────────────────────────────────────────────────────
      const benchMat = new THREE.MeshStandardMaterial({ color: 0x7a4e2b, roughness: 0.65 })
      ;[[-6, 5.5, 0.3], [6, -5.5, -0.3], [-5.5, -5, 0.9], [5.5, 4.5, -0.9]].forEach(([x, z, ry]) => {
        const seat = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.18, 0.9), benchMat)
        seat.position.set(x, -1.32, z)
        seat.rotation.y = ry
        seat.castShadow = seat.receiveShadow = true
        scene.add(seat)
        // Legs
        ;[[-1.1, 0], [1.1, 0], [-1.1, 0.6], [1.1, 0.6]].forEach(([lx, lz]) => {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.55, 0.08), benchMat)
          leg.position.set(x + lx, -1.6, z + lz - 0.3)
          leg.rotation.y = ry
          scene.add(leg)
        })
      })

      // ── Particles ─────────────────────────────────────────────────────────
      const pCount = 300
      const pPos   = new Float32Array(pCount * 3)
      for (let i = 0; i < pCount; i++) {
        pPos[i * 3]     = (Math.random() - 0.5) * 18
        pPos[i * 3 + 1] = Math.random() * 5 - 1
        pPos[i * 3 + 2] = (Math.random() - 0.5) * 18
      }
      const pGeo = new THREE.BufferGeometry()
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3))
      const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
        color: 0xd4c5a0, size: 0.025, transparent: true, opacity: 0.35,
      }))
      scene.add(particles)

      // ── Artworks ──────────────────────────────────────────────────────────
      const loader    = new TextureLoader()
      const addedIds  = new Set<string>()
      let   loaded    = 0

      for (const art of arts) {

        if (addedIds.has(art.id)) continue
        addedIds.add(art.id)
      
        try {
      
          const url = art.imageUrl
            .replace(
              '127.0.0.1',
              API_BASE.replace(/https?:\/\//, '').split(':')[0]
            )
            .replace(
              'localhost',
              API_BASE.replace(/https?:\/\//, '').split(':')[0]
            )
      
          const scaleW = 1.8 * (art.scaleX ?? 1)
          const scaleH = 1.2 * (art.scaleY ?? 1)
      
          // ─────────────────────────────────────────
          // FORCE ARTWORK ONTO NEAREST WALL
          // ─────────────────────────────────────────
      
          let x = art.positionX
          let z = art.positionZ
      
          let rotY = 0
      
          const absX = Math.abs(x)
          const absZ = Math.abs(z)
      
          const WALL_OFFSET = 9.72
      
          // closer to left/right wall
          if (absX > absZ) {
      
            x = x > 0 ? WALL_OFFSET : -WALL_OFFSET
      
            rotY = x > 0
              ? -Math.PI / 2
              : Math.PI / 2
          }
      
          // closer to front/back wall
          else {
      
            z = z > 0 ? WALL_OFFSET : -WALL_OFFSET
      
            rotY = z > 0
              ? Math.PI
              : 0
          }
      
          // ─────────────────────────────────────────
          // FRAME
          // ─────────────────────────────────────────
      
          const frame = new THREE.Mesh(
            new THREE.BoxGeometry(
              scaleW + 0.2,
              scaleH + 0.2,
              0.08
            ),
            new THREE.MeshStandardMaterial({
              color: 0xc4a96a,
              metalness: 0.65,
              roughness: 0.25,
            })
          )
      
          frame.position.set(
            x,
            art.positionY,
            z
          )
      
          frame.rotation.y = rotY
      
          frame.castShadow = true
      
          scene.add(frame)
      
          // ─────────────────────────────────────────
          // TEXTURE
          // ─────────────────────────────────────────
      
          const texture = await loader.loadAsync(url)
      
          texture.minFilter = THREE.LinearFilter
      
          const canvas = new THREE.Mesh(
            new THREE.PlaneGeometry(scaleW, scaleH),
            new THREE.MeshStandardMaterial({
              map: texture,
              side: THREE.FrontSide,
            })
          )
      
          const normalX = Math.sin(rotY)
          const normalZ = Math.cos(rotY)
      
          const offsetAmount = 0.06
      
          canvas.position.set(
            x + normalX * offsetAmount,
            art.positionY,
            z + normalZ * offsetAmount
          )
      
          canvas.rotation.y = rotY
      
          scene.add(canvas)
      
          // ─────────────────────────────────────────
          // SPOTLIGHT
          // ─────────────────────────────────────────
      
          const spot = new THREE.SpotLight(
            0xfff8e8,
            1.8,
            10,
            0.4,
            0.5,
            1.5
          )
      
          spot.position.set(
            x,
            3.5,
            z + Math.cos(rotY) * 2
          )
      
          spot.target.position.set(
            x,
            art.positionY,
            z
          )
      
          scene.add(spot)
          scene.add(spot.target)
      
          loaded++
          setLoadingText(`Loading artworks… ${loaded}/${arts.length}`)
        } catch (e) {
          console.warn('Artwork load failed:', art.title, e)
        }
      }

      setLoading(false)

      // ── Animation loop ────────────────────────────────────────────────────
      // ── Animation loop ────────────────────────────────────────────────────
      

      const animate = () => {
      
        rafRef.current = requestAnimationFrame(animate)
      
        const cam = cameraRef.current
        const renderer = rendererRef.current
        const scene = sceneRef.current
      
        if (!cam || !renderer || !scene) return
      
       
      
        // ───────── LOOK ─────────
        const dx = lookDelta.current.x
        const dy = lookDelta.current.y
      
        if (dx !== 0 || dy !== 0) {
      
          poseRef.current.yaw -= dx * LOOK_SPEED
      
          poseRef.current.pitch -= dy * LOOK_SPEED
      
          poseRef.current.pitch = Math.max(
            -1.3,
            Math.min(1.3, poseRef.current.pitch)
          )
      
          lookDelta.current.x = 0
          lookDelta.current.y = 0
        }
      
        // ───────── MOVEMENT ─────────
        // ───────── MOVEMENT ─────────

        let moveForward = 0
      
        
        if (controls.current.forward) moveForward += 1
        if (controls.current.backward) moveForward -= 1
        if (controls.current.left) {
          poseRef.current.yaw += 0.04
        }
        
        if (controls.current.right) {
          poseRef.current.yaw -= 0.04
        }

const yaw = poseRef.current.yaw

const forwardX = Math.sin(yaw)
const forwardZ = Math.cos(yaw)


const MOVE_SPEED = 0.12

let nx =
  poseRef.current.x +
  forwardX * moveForward * MOVE_SPEED

let nz =
  poseRef.current.z +
  forwardZ * moveForward * MOVE_SPEED

nx = Math.max(-BOUNDS, Math.min(BOUNDS, nx))
nz = Math.max(-BOUNDS, Math.min(BOUNDS, nz))

poseRef.current.x = nx
poseRef.current.z = nz
      
        // ───────── CAMERA ─────────
        cam.position.set(
          nx,
          PLAYER_HEIGHT,
          nz
        )
      
        const lookX =
          nx +
          Math.sin(yaw) *
          Math.cos(poseRef.current.pitch)
      
        const lookY =
          PLAYER_HEIGHT +
          Math.sin(poseRef.current.pitch)
      
        const lookZ =
          nz +
          Math.cos(yaw) *
          Math.cos(poseRef.current.pitch)
      
        cam.lookAt(lookX, lookY, lookZ)
      
        // ───────── SCULPTURE ─────────
        if (sculptRef.current) {
          sculptRef.current.rotation.y += 0.01
        }
      
        // ───────── RENDER ─────────
        renderer.render(scene, cam)
      
        gl.endFrameEXP()
      
        setPosDisplay({
          x: nx,
          z: nz,
          yaw,
        })

       
      }
      
      animate()

    } catch (err) {
      console.error('Scene build error:', err)
      setLoadingText('Error building gallery')
      setLoading(false)
    }
  }, [])

  // ─── GL context ready ─────────────────────────────────────────────────────
  const onContextCreate = useCallback((gl: any) => {

    gl.viewport(
      0,
      0,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight
    )

    gl.canvas = {
      width: gl.drawingBufferWidth,
      height: gl.drawingBufferHeight,
      style: {},
      addEventListener: () => {},
      removeEventListener: () => {},
      clientHeight: gl.drawingBufferHeight,
    }
  
    glRef.current = gl
  
    if (artworks.length > 0) {
      buildScene(gl, artworks)
    }
  
  }, [artworks, buildScene])

  // Cleanup
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current)
      rendererRef.current?.dispose()
    }
  }, [])

  // ─── Movement helpers ─────────────────────────────────────────────────────
  

  // Old teleport (kept for reference, not used by UI)
  const teleport = useCallback((x: number, z: number) => {
    const cam = cameraRef.current
    if (!cam) return
    const nx   = Math.min(BOUNDS, Math.max(-BOUNDS, x))
    const nz   = Math.min(BOUNDS, Math.max(-BOUNDS, z))
    const yaw  = Math.atan2(-nx, -nz)
    cam.position.set(nx, PLAYER_HEIGHT, nz)
    cam.lookAt(nx + Math.sin(yaw), PLAYER_HEIGHT, nz + Math.cos(yaw))
    poseRef.current = { x: nx, z: nz, yaw, pitch: 0 }
    setPosDisplay({ x: nx, z: nz, yaw })
  }, [])

  // NEW: teleport to artwork – places camera a comfortable distance in front, facing it
  const teleportToArtwork = useCallback((art: Artwork) => {
    const cam = cameraRef.current
    if (!cam) return
  
    const rotY = art.rotationY ?? 0
  
    const dirX = Math.sin(rotY)
    const dirZ = Math.cos(rotY)
  
    const camX = art.positionX - dirX * VIEW_DISTANCE
    const camZ = art.positionZ - dirZ * VIEW_DISTANCE
  
    const nx = Math.min(BOUNDS, Math.max(-BOUNDS, camX))
    const nz = Math.min(BOUNDS, Math.max(-BOUNDS, camZ))
  
    cam.position.set(nx, PLAYER_HEIGHT, nz)
  
    cam.lookAt(
      art.positionX,
      art.positionY,
      art.positionZ
    )
  
    poseRef.current = {
      x: nx,
      z: nz,
      yaw: rotY,
      pitch: 0,
    }
  
    setPosDisplay({
      x: nx,
      z: nz,
      yaw: rotY,
    })
  }, [])

  const resetPos = useCallback(() => {
    const cam = cameraRef.current
    if (!cam) return
    cam.position.set(0, PLAYER_HEIGHT, -7)
    cam.lookAt(0, PLAYER_HEIGHT, 0)
    poseRef.current = { x: 0, z: -7, yaw: 0, pitch: 0 }
    setPosDisplay({ x: 0, z: -7, yaw: 0 })
  }, [])

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={S.root}>
      <GLView
  style={S.gl}
  onContextCreate={onContextCreate}
  onLayout={() => {
    builtRef.current = false
  }}
/>

      {/* Loading overlay */}
      {loading && (
        <View style={S.loadOverlay} >
          <View style={S.loadBox}>
            <Text style={S.loadTitle}>🖼 Virtual Gallery</Text>
            <Text style={S.loadSub}>{loadingText}</Text>
          </View>
        </View>
      )}

      {/* Look-mode drag catcher */}
      <View
        style={StyleSheet.absoluteFillObject}
        onTouchMove={e => {
          if (modeRef.current !== 'look' || loading) return
          const { locationX: lx, locationY: ly } = e.nativeEvent
          if (lastTouch.current.x !== 0) {
            lookDelta.current = {
              x: lx - lastTouch.current.x,
              y: ly - lastTouch.current.y,
            }
          }
          lastTouch.current = { x: lx, y: ly }
        }}
        onTouchEnd={() => { lastTouch.current = { x: 0, y: 0 } }}
        pointerEvents={mode === 'look' && !loading ? 'box-only' : 'none'}
      />

      {/* Top bar */}
      <View style={S.topBar} pointerEvents="box-none">
        <TouchableOpacity
          style={S.modeBtn}
          onPress={() => !loading && setMode(m => m === 'walk' ? 'look' : 'walk')}
        >
          <Text style={S.modeTxt}>{mode === 'walk' ? '🚶 WALK' : '🔍 LOOK'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={S.resetBtn} onPress={resetPos}>
          <Text style={S.resetTxt}>⟳</Text>
        </TouchableOpacity>

        <View style={S.hud}>
          <Text style={S.hudTxt}>
            {posDisplay.x.toFixed(1)},{posDisplay.z.toFixed(1)}
            {'  '}{(posDisplay.yaw * 180 / Math.PI).toFixed(0)}°
          </Text>
        </View>
      </View>

      {/* Artwork teleport bar - now uses the improved teleportToArtwork */}
      {!loading && (
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          style={S.teleportBar}
          contentContainerStyle={S.teleportContent}
          pointerEvents="box-none"
        >
          {artworks.map((art, i) => (
            <TouchableOpacity
              key={art.id ?? i}
              style={S.teleportBtn}
              onPress={() => teleportToArtwork(art)}
            >
              <Text style={S.teleportTxt}>🎨 {art.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Walk controls */}
      {mode === 'walk' && !loading && (
        <View style={S.controls} pointerEvents="box-none">
          <View style={S.dpad}>
            <TouchableOpacity style={[S.btn, S.top]}      onPressIn={() => controls.current.forward = true}
  onPressOut={() => controls.current.forward = false}>
              <Text style={S.btnTxt}>▲</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[S.btn, S.left]}       onPressIn={() => controls.current.left = true}
  onPressOut={() => controls.current.left = false}>
              <Text style={S.btnTxt}>◀</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[S.btn, S.right]}    onPressIn={() => controls.current.right = true}
  onPressOut={() => controls.current.right = false}>
              <Text style={S.btnTxt}>▶</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[S.btn, S.bottom]}   onPressIn={() => controls.current.backward = true}
  onPressOut={() => controls.current.backward = false}>
              <Text style={S.btnTxt}>▼</Text>
            </TouchableOpacity>
          </View>
          <Text style={S.hint}>◀ ▶ turn  ·  ▲ ▼ move</Text>
        </View>
      )}

      {mode === 'look' && !loading && (
        <View style={S.lookHelp} pointerEvents="none">
          <Text style={S.helpTxt}>👆 Drag to look around</Text>
        </View>
      )}
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#0a0a1a' },
  gl:           { flex: 1 },

  loadOverlay:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,26,0.92)', justifyContent: 'center', alignItems: 'center' },
  loadBox:      { alignItems: 'center', gap: 12, padding: 32, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)' },
  loadTitle:    { color: '#fff', fontSize: 22, fontWeight: '700' },
  loadSub:      { color: '#aaa', fontSize: 13, textAlign: 'center' },

  topBar:       { position: 'absolute', top: 44, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
  modeBtn:      { backgroundColor: 'rgba(0,0,0,0.72)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  modeTxt:      { color: '#fff', fontWeight: '700', fontSize: 13 },
  resetBtn:     { backgroundColor: 'rgba(0,0,0,0.72)', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  resetTxt:     { color: '#ffaa66', fontSize: 18, fontWeight: '700' },
  hud:          { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  hudTxt:       { color: '#4eff88', fontFamily: 'monospace', fontSize: 11 },

  teleportBar:  { position: 'absolute', top: 96, left: 0, right: 0, maxHeight: 48 },
  teleportContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  teleportBtn:  { backgroundColor: 'rgba(0,0,0,0.72)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  teleportTxt:  { color: '#ffcc88', fontSize: 12, fontWeight: '600' },

  controls:     { position: 'absolute', bottom: 36, left: 16, right: 16, alignItems: 'center', gap: 8 },
  dpad:         { width: 160, height: 160, position: 'relative' },
  btn:          { position: 'absolute', width: 56, height: 56, backgroundColor: 'rgba(0,0,0,0.72)', borderRadius: 28, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  top:          { top: 0,   left: 52 },
  left:         { top: 52,  left: 0  },
  right:        { top: 52,  left: 104 },
  bottom:       { top: 104, left: 52 },
  btnTxt:       { color: '#fff', fontSize: 24, fontWeight: '700' },
  hint:         { color: 'rgba(255,255,255,0.5)', fontSize: 11, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 14 },

  lookHelp:     { position: 'absolute', bottom: 40, left: 16, right: 16, alignItems: 'center' },
  helpTxt:      { backgroundColor: 'rgba(0,0,0,0.72)', color: '#fff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24, fontSize: 15 },
})

