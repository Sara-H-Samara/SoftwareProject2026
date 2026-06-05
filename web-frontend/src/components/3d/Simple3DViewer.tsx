import { useEffect, useRef, useState, useCallback } from 'react'
import { XMarkIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline'
import { getImageUrl } from '@/utils/helpers'

interface Simple3DViewerProps {
  isOpen:      boolean
  onClose:     () => void
  imageUrl:    string
  title:       string
  artistName?: string
}

export function Simple3DViewer({
  isOpen, onClose, imageUrl, title, artistName,
}: Simple3DViewerProps) {
  const containerRef  = useRef<HTMLDivElement>(null)
  const hideTimerRef  = useRef<ReturnType<typeof setTimeout>>()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading,    setIsLoading   ] = useState(true)
  const [loadProgress, setLoadProgress] = useState(0)
  const [uiVisible,    setUiVisible   ] = useState(true)

  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', h)
    return () => document.removeEventListener('fullscreenchange', h)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    document.fullscreenElement
      ? document.exitFullscreen()
      : containerRef.current.requestFullscreen()
  }, [])

  const showUI = useCallback(() => {
    setUiVisible(true)
    clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => setUiVisible(false), 2500)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    showUI()
    return () => clearTimeout(hideTimerRef.current)
  }, [isOpen, showUI])

  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = 'hidden'
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', h) }
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen || !containerRef.current) return

    const resolvedImageUrl = getImageUrl(imageUrl)

    let cancelled   = false
    let animFrameId = 0
    const disposables: { dispose: () => void }[] = []

    const cleanup = () => {
      cancelled = true
      cancelAnimationFrame(animFrameId)
      for (const d of disposables) { try { d.dispose() } catch (_) {} }
      containerRef.current?.querySelector('canvas')?.remove()
    }

    const run = async () => {
      const THREE = await import('three')
      const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js')
      if (cancelled) return

      const el = containerRef.current!
      const W  = el.clientWidth
      const H  = el.clientHeight

      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0xf0ece4)
      disposables.push({ dispose: () => scene.clear() })

      const WALL_Z = -1.0
      const EYE_Y  =  1.55
      const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 100)
      camera.position.set(0, EYE_Y, 3.5)

      const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
      renderer.setSize(W, H)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.shadowMap.enabled   = true
      renderer.shadowMap.type      = THREE.PCFSoftShadowMap
      renderer.toneMapping         = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.15
      renderer.outputColorSpace    = THREE.SRGBColorSpace
      el.appendChild(renderer.domElement)
      disposables.push({ dispose: () => renderer.dispose() })

      const controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping   = true
      controls.dampingFactor   = 0.06
      controls.autoRotate      = true
      controls.autoRotateSpeed = 0.45
      controls.enableZoom      = true
      controls.enablePan       = false
      controls.zoomSpeed       = 0.7
      controls.rotateSpeed     = 0.7
      controls.minDistance     = 1.5
      controls.maxDistance     = 7.0
      controls.maxPolarAngle   = Math.PI * 0.65
      controls.target.set(0, EYE_Y, 0)
      controls.addEventListener('start', () => { controls.autoRotate = false })
      disposables.push({ dispose: () => controls.dispose() })

      // ── Lighting ─────────────────────────────────────────────────────────────
      scene.add(new THREE.AmbientLight(0xffffff, 1.2))

      const mainLight = new THREE.DirectionalLight(0xffffff, 2.2)
      mainLight.position.set(1.5, 3.2, 2.5)
      mainLight.castShadow = true
      mainLight.shadow.mapSize.set(2048, 2048)
      scene.add(mainLight)

      const fillLight = new THREE.DirectionalLight(0xffffff, 1.2)
      fillLight.position.set(-1.2, 1.8, 2)
      scene.add(fillLight)

      const spot = new THREE.SpotLight(0xffffff, 5.0)
      spot.position.set(0, 3.8, 2.2)
      spot.angle      = 0.45
      spot.penumbra   = 0.3
      spot.decay      = 1.0
      spot.distance   = 10
      spot.castShadow = true
      spot.shadow.mapSize.set(2048, 2048)
      spot.target.position.set(0, EYE_Y, WALL_Z)
      scene.add(spot, spot.target)

      const frontLight = new THREE.DirectionalLight(0xffffff, 1.8)
      frontLight.position.set(0, EYE_Y, 5)
      frontLight.target.position.set(0, EYE_Y, WALL_Z)
      scene.add(frontLight, frontLight.target)

      const backLight = new THREE.PointLight(0xe8d5b0, 0.35)
      backLight.position.set(0, 1.5, -2.2)
      scene.add(backLight)

      // ── Wall ─────────────────────────────────────────────────────────────────
      const wallMat = new THREE.MeshStandardMaterial({ color: 0xe8e0d5, roughness: 0.75, metalness: 0.00 })
      disposables.push({ dispose: () => wallMat.dispose() })
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 5.0), wallMat)
      wall.position.set(0, EYE_Y, WALL_Z)
      wall.receiveShadow = true
      scene.add(wall)

      // ── Floor ─────────────────────────────────────────────────────────────────
      const FLOOR_Y  = -0.85
      const floorMat = new THREE.MeshStandardMaterial({ color: 0xd4c8b0, roughness: 0.48, metalness: 0.04 })
      disposables.push({ dispose: () => floorMat.dispose() })
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(7, 5.5), floorMat)
      floor.rotation.x = -Math.PI / 2
      floor.position.y = FLOOR_Y
      floor.receiveShadow = true
      scene.add(floor)

      // ── Ceiling ───────────────────────────────────────────────────────────────
      const ceilingMat = new THREE.MeshStandardMaterial({ color: 0xf5f0ea, roughness: 0.85, metalness: 0.00 })
      const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(7, 5.5), ceilingMat)
      ceiling.rotation.x = Math.PI / 2
      ceiling.position.y = 2.6
      scene.add(ceiling)

      // ── Load texture ──────────────────────────────────────────────────────────
      let tex: THREE.Texture
      try {
        tex = await new Promise<THREE.Texture>((resolve, reject) => {
          new THREE.TextureLoader().load(
            resolvedImageUrl,
            t  => { if (!cancelled) { setLoadProgress(100); setTimeout(() => setIsLoading(false), 250) }; resolve(t) },
            ev => { if (!cancelled && ev.lengthComputable) setLoadProgress(ev.loaded / ev.total * 100) },
            reject
          )
        })
      } catch { if (!cancelled) setIsLoading(false); return }
      if (cancelled) { tex.dispose(); return }
      tex.colorSpace = THREE.SRGBColorSpace
      disposables.push({ dispose: () => tex.dispose() })

      // ── Frame dimensions ──────────────────────────────────────────────────────
      const iW = tex.image?.width  || 1
      const iH = tex.image?.height || 1
      let   fW = 1.55
      let   fH = fW * (iH / iW)
      if (fH > 2.0) { fH = 2.0; fW = fH * (iW / iH) }

      // ── Hang position ─────────────────────────────────────────────────────────
      const hangBottom  = FLOOR_Y + 0.30
      const hangCenterY = hangBottom + fH / 2

      controls.target.set(0, hangCenterY, 0)
      camera.position.set(0, hangCenterY + 0.1, 3.5)
      spot.target.position.set(0, hangCenterY, WALL_Z)
      frontLight.target.position.set(0, hangCenterY, WALL_Z)

      // ── Artwork group ─────────────────────────────────────────────────────────
      const artGroup = new THREE.Group()
      artGroup.position.set(0, hangCenterY, WALL_Z + 0.04)

      const wallShadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.08, depthWrite: false })
      disposables.push({ dispose: () => wallShadowMat.dispose() })
      const wallShadow = new THREE.Mesh(new THREE.PlaneGeometry(fW * 1.35, fH * 1.4), wallShadowMat)
      wallShadow.position.z = -0.035
      artGroup.add(wallShadow)

      const goldMat = new THREE.MeshStandardMaterial({ color: 0xc8aa6a, metalness: 0.72, roughness: 0.28 })
      disposables.push({ dispose: () => goldMat.dispose() })
      const frameOuter = new THREE.Mesh(new THREE.BoxGeometry(fW + 0.13, fH + 0.13, 0.068), goldMat)
      frameOuter.castShadow = true
      artGroup.add(frameOuter)

      const linerMat = new THREE.MeshStandardMaterial({ color: 0x8a6a3a, metalness: 0.45, roughness: 0.5 })
      disposables.push({ dispose: () => linerMat.dispose() })
      artGroup.add(new THREE.Mesh(new THREE.BoxGeometry(fW + 0.065, fH + 0.065, 0.058), linerMat))

      const matMat = new THREE.MeshStandardMaterial({ color: 0xf0ece4, roughness: 0.7, metalness: 0.00 })
      disposables.push({ dispose: () => matMat.dispose() })
      artGroup.add(new THREE.Mesh(new THREE.BoxGeometry(fW + 0.022, fH + 0.022, 0.048), matMat))

      const canvasMat = new THREE.MeshStandardMaterial({
        map:              tex,
        roughness:        0.22,
        metalness:        0.00,
        color:            0xffffff,
        emissiveMap:      tex,      
        emissive:         new THREE.Color(0x111111),
        emissiveIntensity: 0.15,     
      })
      disposables.push({ dispose: () => canvasMat.dispose() })
      const canvas3d = new THREE.Mesh(new THREE.PlaneGeometry(fW, fH), canvasMat)
      canvas3d.position.z = 0.036
      artGroup.add(canvas3d)

      const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.04, metalness: 0.03, roughness: 0.01 })
      disposables.push({ dispose: () => glassMat.dispose() })
      const glass3d = new THREE.Mesh(new THREE.PlaneGeometry(fW - 0.02, fH - 0.02), glassMat)
      glass3d.position.z = 0.062
      artGroup.add(glass3d)

      scene.add(artGroup)

      // ── Gallery label ─────────────────────────────────────────────────────────
      const labelMat = new THREE.MeshStandardMaterial({ color: 0xc8aa6a, metalness: 0.35, roughness: 0.4 })
      disposables.push({ dispose: () => labelMat.dispose() })
      const labelPlate = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.035, 0.012), labelMat)
      labelPlate.position.set(0, hangBottom - 0.12, WALL_Z + 0.045)
      scene.add(labelPlate)

      // ── Resize ────────────────────────────────────────────────────────────────
      const onResize = () => {
        if (!containerRef.current) return
        const w = containerRef.current.clientWidth
        const h = containerRef.current.clientHeight
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer.setSize(w, h)
      }
      window.addEventListener('resize', onResize)
      disposables.push({ dispose: () => window.removeEventListener('resize', onResize) })

      // ── Animation ─────────────────────────────────────────────────────────────
      let t = 0
      const animate = () => {
        animFrameId = requestAnimationFrame(animate)
        t += 0.004
        artGroup.rotation.y = Math.sin(t * 0.2) * 0.01
        controls.update()
        renderer.render(scene, camera)
      }
      animate()
    }

    run()
    return cleanup
  }, [isOpen, imageUrl])

  if (!isOpen) return null

  const fade = `transition-opacity duration-700 ${uiVisible ? 'opacity-100' : 'opacity-0'}`

  return (
    <div
      className="fixed inset-0 z-50"
      style={{ background: '#f5f0ea' }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseMove={showUI}
      onPointerDown={showUI}
    >
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center" style={{ background: '#f5f0ea' }}>
          <div className="relative" style={{ width: 52, height: 52 }}>
            <svg className="-rotate-90" width="52" height="52" viewBox="0 0 52 52">
              <circle cx="26" cy="26" r="22" fill="none" stroke="#e0d5c8" strokeWidth="2.5"/>
              <circle
                cx="26" cy="26" r="22"
                fill="none" stroke="#c8aa6a" strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 22}`}
                strokeDashoffset={`${2 * Math.PI * 22 * (1 - loadProgress / 100)}`}
                style={{ transition: 'stroke-dashoffset 0.35s ease' }}
              />
            </svg>
            <span
              className="absolute inset-0 flex items-center justify-center"
              style={{ fontSize: 10, fontWeight: 500, color: '#b89850', letterSpacing: '0.04em' }}
            >
              {Math.round(loadProgress)}%
            </span>
          </div>
          <p style={{ marginTop: 18, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#a09070' }}>
            Loading
          </p>
        </div>
      )}

      <div
        className={`absolute top-0 left-0 right-0 z-10 ${fade}`}
        style={{ background: 'linear-gradient(to bottom, rgba(245,240,234,0.95) 0%, transparent 100%)', padding: '20px 22px 44px' }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 style={{ margin: 0, fontSize: 13, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4a3a28' }}>
              {title}
            </h2>
            {artistName && (
              <p style={{ margin: '5px 0 0', fontSize: 11, letterSpacing: '0.1em', color: '#8a7a60' }}>
                {artistName}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {([
              { Icon: isFullscreen ? ArrowsPointingInIcon : ArrowsPointingOutIcon, label: isFullscreen ? 'Exit fullscreen' : 'Fullscreen', fn: toggleFullscreen },
              { Icon: XMarkIcon, label: 'Close', fn: onClose },
            ] as const).map(({ Icon, label, fn }) => (
              <button
                key={label}
                onClick={fn}
                aria-label={label}
                style={{
                  width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0,0,0,0.04)',
                  border: '0.5px solid rgba(0,0,0,0.08)',
                  color: '#8a7a60', transition: 'color 0.2s, background 0.2s',
                }}
                onMouseEnter={e => { const b = e.currentTarget; b.style.color = '#4a3a28'; b.style.background = 'rgba(0,0,0,0.08)' }}
                onMouseLeave={e => { const b = e.currentTarget; b.style.color = '#8a7a60'; b.style.background = 'rgba(0,0,0,0.04)' }}
              >
                <Icon style={{ width: 16, height: 16 }} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div ref={containerRef} className="w-full h-full" />

      <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none ${fade}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(245,240,234,0.7)', backdropFilter: 'blur(8px)', padding: '8px 18px', borderRadius: 40 }}>
          {['Drag · rotate', 'Scroll · zoom', 'Auto · rotates'].map((hint, i, a) => (
            <span key={hint} style={{ display: 'contents' }}>
              <span style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6a5a48' }}>
                {hint}
              </span>
              {i < a.length - 1 && (
                <span style={{ width: 1, height: 10, background: '#d0c8b8', display: 'block' }} />
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}