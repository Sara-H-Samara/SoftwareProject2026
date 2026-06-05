import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { useNavigate, Link } from 'react-router-dom'
import { useMyArtworks, useBulkUpdatePositions } from '@/hooks/useArtworks'
import { useGalleryDesignStore } from '@/store/galleryDesignStore'
import { getWallMountPoints, SHAPE_RATIOS } from '@/utils/galleryRoom.utils'
import StyledGalleryRoom from '@/components/gallery/StyledGalleryRoom'
import { Spinner } from '@/components/common/Spinner'
import Button from '@/components/common/Button'
import ArtworkFrame from '@/components/gallery/ArtworkFrame'
import { aiApi } from '@/api/ai.api'
import type { Artwork, UpdateArtworkPositionRequest } from '@/types'
import type { WallMountPoint } from '@/utils/galleryRoom.utils'
import type { RoomShape } from '@/types/room-shape'
import {
  ViewColumnsIcon, CubeIcon, ArrowPathIcon,
  SparklesIcon, XMarkIcon,
} from '@heroicons/react/24/outline'
import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/utils/constants'
import { getImageUrl } from '@/utils/helpers'
import toast from 'react-hot-toast'

// ─── SVG floor plan polygon ────────────────────────────────────────────────────
function shapePoints(shape: RoomShape, roomW: number, roomD: number): string {
  const hW = roomW / 2
  const hD = roomD / 2
  switch (shape) {
    case 'l_shaped': {
      const stepX = hW - roomW * SHAPE_RATIOS.L_WING_W
      const stepZ = hD - roomD * SHAPE_RATIOS.L_WING_D
      return [[-hW,-hD],[hW,-hD],[hW,stepZ],[stepX,stepZ],[stepX,hD],[-hW,hD]]
        .map(([x,y]) => `${x},${y}`).join(' ')
    }
    case 't_shaped': {
      const shW = (roomW * SHAPE_RATIOS.T_STEM_W) / 2
      const sbZ = hD - roomD * SHAPE_RATIOS.T_STEM_D
      return [[-hW,-hD],[hW,-hD],[hW,sbZ],[shW,sbZ],[shW,hD],[-shW,hD],[-shW,sbZ],[-hW,sbZ]]
        .map(([x,y]) => `${x},${y}`).join(' ')
    }
    case 'u_shaped': {
      const oW  = roomW * SHAPE_RATIOS.U_OPENING_W
      const aW  = (roomW - oW) / 2
      const spZ = hD - roomD * SHAPE_RATIOS.U_ARM_D
      const lX  = -hW + aW
      const rX  =  hW - aW
      return [[-hW,-hD],[hW,-hD],[hW,hD],[rX,hD],[rX,spZ],[lX,spZ],[lX,hD],[-hW,hD]]
        .map(([x,y]) => `${x},${y}`).join(' ')
    }
    case 'circular':
      return Array.from({length:64},(_,i)=>{
        const a=(i/64)*Math.PI*2
        return `${hW*Math.cos(a)},${hD*Math.sin(a)}`
      }).join(' ')
    case 'octagonal': {
      const r=Math.min(hW,hD)
      return Array.from({length:8},(_,i)=>{
        const a=(i/8)*Math.PI*2-Math.PI/8
        return `${r*Math.cos(a)},${r*Math.sin(a)}`
      }).join(' ')
    }
    default:
      return `-${hW},-${hD} ${hW},-${hD} ${hW},${hD} -${hW},${hD}`
  }
}

function worldToSvgPct(x: number, z: number, roomW: number, roomD: number) {
  return {
    x: Math.min(95, Math.max(5, ((x + roomW/2) / roomW) * 100)),
    z: Math.min(95, Math.max(5, ((z + roomD/2) / roomD) * 100)),
  }
}

// ─── Floor plan map ────────────────────────────────────────────────────────────
interface FloorPlanMapProps {
  shape:            RoomShape
  roomW:            number
  roomD:            number
  mountPoints:      WallMountPoint[]
  publishedArtworks: Artwork[]
  draggedArtworkId: string | null
  onDrop:           (p: WallMountPoint) => void
  onRemove:         (id: string) => void
  positions:        Map<string, UpdateArtworkPositionRequest>
}

function FloorPlanMap({
  shape, roomW, roomD, mountPoints, publishedArtworks,
  draggedArtworkId, onDrop, onRemove, positions,
}: FloorPlanMapProps) {
  const [hovered, setHovered] = useState<string|null>(null)
  const hW = roomW/2, hD = roomD/2

  return (
    <div
      className="relative w-full bg-stone-100 rounded-lg overflow-hidden select-none"
      style={{ aspectRatio: `${roomW}/${roomD}` }}
    >
      {/* SVG background */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`${-hW} ${-hD} ${roomW} ${roomD}`}
        preserveAspectRatio="none"
      >
        {Array.from({length: Math.ceil(roomW/2)+1},(_,i)=>{
          const x=-hW+i*2; return x<=hW
            ? <line key={`gx${i}`} x1={x} y1={-hD} x2={x} y2={hD} stroke="#e5e0d8" strokeWidth="0.08"/>
            : null
        })}
        {Array.from({length: Math.ceil(roomD/2)+1},(_,i)=>{
          const z=-hD+i*2; return z<=hD
            ? <line key={`gz${i}`} x1={-hW} y1={z} x2={hW} y2={z} stroke="#e5e0d8" strokeWidth="0.08"/>
            : null
        })}
        <polygon points={shapePoints(shape,roomW,roomD)} fill="#faf8f5" stroke="#d4cfc5" strokeWidth="0.15"/>
        <line x1="0" y1={-hD} x2="0" y2={hD} stroke="#d4cfc5" strokeWidth="0.06" strokeDasharray="0.4,0.4"/>
        <line x1={-hW} y1="0" x2={hW} y2="0" stroke="#d4cfc5" strokeWidth="0.06" strokeDasharray="0.4,0.4"/>
        <text x={-hW+0.3} y={-hD+0.8} fontSize="0.7" fill="#b0a898" fontWeight="bold">N↑</text>
      </svg>

      {/* Mount points */}
      {mountPoints.map(point => {
        const artworkHere = publishedArtworks.find(aw =>
          Math.abs((positions.get(aw.id)?.positionX ?? aw.positionX) - point.positionX) < 0.15 &&
          Math.abs((positions.get(aw.id)?.positionZ ?? aw.positionZ) - point.positionZ) < 0.15
        )
        const { x: pctX, z: pctZ } = worldToSvgPct(point.positionX, point.positionZ, roomW, roomD)

        return (
          <div
            key={point.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
            style={{ left: `${pctX}%`, top: `${pctZ}%` }}
            onDragOver={e => e.preventDefault()}
            onDrop={() => onDrop(point)}
          >
            {artworkHere ? (
              <div
                className="relative group"
                onMouseEnter={() => setHovered(artworkHere.id)}
                onMouseLeave={() => setHovered(null)}
              >
                <div className="w-14 h-14 rounded-lg shadow-md overflow-hidden border-2 border-gallery-500 cursor-pointer">
                  <img
                    src={getImageUrl(artworkHere.imageUrl)}
                    alt={artworkHere.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Remove button */}
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); onRemove(artworkHere.id) }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full
                             flex items-center justify-center text-xs font-bold
                             opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-600"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
                {hovered === artworkHere.id && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white
                                  text-xs px-2 py-1 rounded whitespace-nowrap z-30 pointer-events-none">
                    {artworkHere.title}
                  </div>
                )}
              </div>
            ) : (
              <div className={`
                w-11 h-11 rounded-lg border-2 border-dashed flex items-center justify-center
                transition-all cursor-pointer
                ${draggedArtworkId
                  ? 'border-gallery-400 bg-gallery-50 scale-105'
                  : 'border-stone-300 hover:border-gallery-400 hover:bg-stone-50'
                }
              `}>
                <span className="text-stone-400 text-lg leading-none">+</span>
              </div>
            )}
          </div>
        )
      })}

      {draggedArtworkId && (
        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded z-20 pointer-events-none">
          Drop on a wall position
        </div>
      )}
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function GalleryLayoutEditorPage() {
  const { isAuthenticated, accessToken } = useAuthStore()
  const navigate  = useNavigate()
  const [viewMode, setViewMode]   = useState<'2d'|'3d'>('2d')
  const [positions, setPositions] = useState<Map<string, UpdateArtworkPositionRequest>>(new Map())
  const [draggedId, setDraggedId] = useState<string|null>(null)
  const [isArranging, setIsArranging] = useState(false)
  const [curatorNote, setCuratorNote] = useState<string|null>(null)
  const pendingToast = useRef<string|null>(null)

  const { data: artworks, isLoading } = useMyArtworks()
  const { mutate: savePositions, isPending: isSaving } = useBulkUpdatePositions()
  const { customization } = useGalleryDesignStore()
  const wallMountPoints = getWallMountPoints(customization)

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated || !accessToken) navigate(ROUTES.LOGIN)
  }, [isAuthenticated, accessToken, navigate])

  // Reset positions when room shape changes
  const currentShape = customization.structure?.shape
  const prevShape    = useRef<string|undefined>(undefined)
  useEffect(() => {
    if (prevShape.current !== undefined && prevShape.current !== currentShape) {
      setPositions(new Map())
      setCuratorNote(null)
    }
    prevShape.current = currentShape
  }, [currentShape])

  // Flush pending toasts (after state update)
  useEffect(() => {
    if (pendingToast.current) {
      toast.success(pendingToast.current, { duration: 1500 })
      pendingToast.current = null
    }
  })

  // Merge DB positions with local unsaved changes
  const resolvedArtworks: Artwork[] = (artworks ?? []).map((aw: Artwork) => {
    const local = positions.get(aw.id)
    return local ? { ...aw, ...local } : aw
  })
  const publishedArtworks = resolvedArtworks.filter((a: Artwork) => a.isPublished)

  const roomW     = customization.structure?.roomWidth  ?? 22
  const roomD     = customization.structure?.roomDepth  ?? 22
  const roomShape = (customization.structure?.shape     ?? 'rectangle') as string

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSave = () => {
    const updates = Array.from(positions.values())
    if (updates.length === 0) { toast.error('No changes to save'); return }
    savePositions(updates, {
      onSuccess: () => {
        toast.success('Layout saved!')
        setPositions(new Map())
      },
      onError: () => toast.error('Failed to save. Please try again.'),
    })
  }

  const handleDragStart = useCallback((id: string) => setDraggedId(id), [])

  const handleDrop = useCallback((mountPoint: WallMountPoint) => {
    if (!draggedId) return
    const id   = draggedId
    const base = (artworks ?? []).find((a: Artwork) => a.id === id)
    setPositions(prev => {
      pendingToast.current = `Placed on ${mountPoint.label} wall`
      return new Map(prev).set(id, {
        artworkId:  id,
        positionX:  mountPoint.positionX,
        positionY:  mountPoint.positionY,
        positionZ:  mountPoint.positionZ,
        rotationX:  0,
        rotationY:  mountPoint.rotationY,
        rotationZ:  0,
        scaleX: base?.scaleX ?? 1,
        scaleY: base?.scaleY ?? 1,
        scaleZ: base?.scaleZ ?? 1,
      })
    })
    setDraggedId(null)
  }, [draggedId, artworks])

  const handleRemove = useCallback((artworkId: string) => {
    setPositions(prev => {
      const next = new Map(prev)
      next.delete(artworkId)
      pendingToast.current = 'Artwork removed from wall'
      return next
    })
  }, [])

  const handleExport = useCallback(() => {
    const layout = {
      room: { width: roomW, depth: roomD, shape: roomShape },
      artworks: Array.from(positions.values()),
      timestamp: new Date().toISOString(),
    }
    const a   = document.createElement('a')
    a.href    = URL.createObjectURL(new Blob([JSON.stringify(layout,null,2)], {type:'application/json'}))
    a.download = `gallery-layout-${Date.now()}.json`
    a.click()
    toast.success('Layout exported!')
  }, [positions, roomW, roomD, roomShape])

  // ── AI Auto Arrange ──────────────────────────────────────────────────────────
  const handleAutoArrange = useCallback(async () => {
    if (publishedArtworks.length === 0) {
      toast.error('No published artworks to arrange')
      return
    }
    if (wallMountPoints.length === 0) {
      toast.error('No wall positions available')
      return
    }

    setIsArranging(true)
    setCuratorNote(null)

    try {
      // ── Step 1: build wall data ──────────────────────────────────────────
      const distinctWalls  = [...new Set(wallMountPoints.map(p => p.wall))]
      const wallToPoints   = new Map<string, WallMountPoint[]>()
      distinctWalls.forEach(w =>
        wallToPoints.set(w, wallMountPoints.filter(p => p.wall === w))
      )

      const wallSegments = distinctWalls.map(wallId => ({
        wallId,
        label:         `${wallId.charAt(0).toUpperCase()}${wallId.slice(1)} Wall`,
        positionCount: wallToPoints.get(wallId)?.length ?? 0,
        startX: wallId === 'right' ?  roomW/2 : -roomW/2,
        startZ: wallId === 'back'  ?  roomD/2 : -roomD/2,
        endX:   wallId === 'left'  ? -roomW/2 :  roomW/2,
        endZ:   wallId === 'front' ? -roomD/2 :  roomD/2,
      }))

      // ── Step 2: call AI ──────────────────────────────────────────────────
      const result = await aiApi.arrangeArtworks({
        artworks: publishedArtworks.map(aw => ({
          id:                 aw.id,
          title:              aw.title,
          artworkType:        aw.artworkType    ?? 'Painting',
          materials:          aw.materials      ?? undefined,
          description:        aw.description    ?? undefined,
          dimensions:         aw.dimensions     ?? undefined,
          year:               aw.year           ?? undefined,
          price:              aw.price          ?? undefined,
          colorPalette:       undefined,
          tags:               undefined,
          // Visual analysis fields — used for smarter AI grouping
          colorMood:          aw.colorMood      ?? undefined,
          visualStyle:        aw.visualStyle    ?? undefined,
          subject:            aw.subject        ?? undefined,
          mood:               aw.mood           ?? undefined,
          dominantColors:     aw.dominantColors ?? undefined,
          isVisuallyAnalyzed: aw.isVisuallyAnalyzed ?? false,
        })),
        galleryLayout: {
          roomWidth:          roomW,
          roomDepth:          roomD,
          wallHeight:         customization.structure?.wallHeight ?? 4.8,
          shape:              roomShape,
          totalWallPositions: wallMountPoints.length,
          wallSegments,
        },
      })

      if (!result.placements?.length) {
        toast.error('AI returned no placements. Try again.')
        return
      }

      // ── Step 3: assign each artwork to a real mount point ────────────────
      // Sort placements to distribute evenly across walls
      const usedPointIds = new Set<string>()
      const newPositions = new Map<string, UpdateArtworkPositionRequest>()

      // Build wall→points index (handles any wall naming convention)
      const wallIndex = new Map<string, WallMountPoint[]>()
      wallMountPoints.forEach(p => {
        if (!wallIndex.has(p.wall)) wallIndex.set(p.wall, [])
        wallIndex.get(p.wall)!.push(p)
      })

      for (const placement of result.placements) {
        const aw = publishedArtworks.find(a => a.id === placement.artworkId)
        if (!aw) continue

        // Match wallId from AI response to our wall labels
        // AI returns: "front" | "back" | "left" | "right"
        // wallIndex keys: same values from WallMountPoint.wall
        const wallPoints = wallIndex.get(placement.wallId)
                        ?? wallMountPoints  // fallback: any available point

        // Pick first unused point on this wall
        const point = wallPoints.find(p => !usedPointIds.has(p.id))
                   ?? wallMountPoints.find(p => !usedPointIds.has(p.id))

        if (!point) continue

        usedPointIds.add(point.id)
        newPositions.set(aw.id, {
          artworkId: aw.id,
          positionX: point.positionX,
          positionY: point.positionY,
          positionZ: point.positionZ,
          rotationX: 0,
          rotationY: point.rotationY,
          rotationZ: 0,
          scaleX: aw.scaleX ?? 1,
          scaleY: aw.scaleY ?? 1,
          scaleZ: aw.scaleZ ?? 1,
        })
      }

      setPositions(newPositions)
      setCuratorNote(result.explanation ?? null)
      toast.success(`✨ ${newPositions.size} artwork${newPositions.size !== 1 ? 's' : ''} arranged by AI`)
    } catch {
      toast.error('AI arrangement failed. Please try again.')
    } finally {
      setIsArranging(false)
    }
  }, [publishedArtworks, wallMountPoints, artworks])

  // ─────────────────────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" />
    </div>
  )

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-4">

      {/* AI Curator Note */}
      {curatorNote && (
        <div className="flex items-start gap-3 bg-purple-50 border border-purple-200 rounded-xl px-4 py-3">
          <SparklesIcon className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
          <p className="text-xs text-purple-800 flex-1"><span className="font-semibold">AI Curator: </span>{curatorNote}</p>
          <button onClick={() => setCuratorNote(null)} className="text-purple-400 hover:text-purple-600">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between shrink-0 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
            <ViewColumnsIcon className="h-6 w-6 text-gallery-600" />
            Gallery Layout Editor
          </h1>
          <p className="text-sm text-stone-400 mt-0.5">
            {roomW}m × {roomD}m · {wallMountPoints.length} hanging positions
          </p>
        </div>

        <div className="flex gap-2 items-center flex-wrap">
          <Link
            to="/dashboard/studio-pro"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium
                       text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors"
          >
            <SparklesIcon className="w-3.5 h-3.5" />
            Edit Design
          </Link>

          <Button
            variant="secondary"
            onClick={handleAutoArrange}
            isLoading={isArranging}
            disabled={isArranging || publishedArtworks.length === 0}
            leftIcon={<SparklesIcon className="h-4 w-4" />}
          >
            {isArranging ? 'Arranging…' : 'AI Arrange'}
          </Button>

          <Button
            variant="secondary"
            onClick={handleExport}
            leftIcon={<ArrowPathIcon className="h-4 w-4" />}
          >
            Export
          </Button>

          <Button
            variant="secondary"
            onClick={() => setViewMode(v => v === '2d' ? '3d' : '2d')}
            leftIcon={<CubeIcon className="h-4 w-4" />}
          >
            {viewMode === '2d' ? 'Preview 3D' : 'Back to 2D'}
          </Button>

          <Button
            onClick={handleSave}
            isLoading={isSaving}
            disabled={positions.size === 0}
          >
            Save Layout
          </Button>
        </div>
      </div>

      {/* Body */}
      {viewMode === '2d' ? (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-0">

          {/* Artwork list */}
          <div className="lg:col-span-2 bg-white border border-stone-100 rounded-2xl shadow-sm flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-stone-100 text-sm font-medium bg-stone-50 flex items-center justify-between">
              <span>Published Artworks</span>
              <span className="text-xs text-stone-400">{publishedArtworks.length} artworks</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {publishedArtworks.length === 0 ? (
                <div className="text-center py-12 text-stone-400 text-sm">
                  No published artworks yet.
                  <Link to={ROUTES.DASHBOARD_ARTWORKS} className="block mt-2 text-gallery-600 text-xs hover:underline">
                    Publish artworks →
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {publishedArtworks.map(aw => {
                    const isPlaced =
                      positions.has(aw.id) ||
                      (aw.positionX !== 0 || aw.positionZ !== 0)
                    return (
                      <div
                        key={aw.id}
                        draggable
                        onDragStart={() => handleDragStart(aw.id)}
                        className={`p-2 rounded-xl border-2 cursor-move transition-all select-none ${
                          isPlaced
                            ? 'border-gallery-500 bg-gallery-50 shadow-sm'
                            : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <img
                          src={getImageUrl(aw.imageUrl)}
                          alt={aw.title}
                          className="w-full h-24 object-cover rounded-lg mb-2 pointer-events-none"
                        />
                        <p className="text-xs font-medium truncate text-stone-700">{aw.title}</p>
                        <p className="text-[10px] text-stone-400 truncate">{aw.artworkType}</p>
                        {isPlaced && (
                          <p className="text-[10px] text-gallery-500 font-medium mt-0.5">✓ Placed</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Floor plan */}
          <div className="lg:col-span-3 bg-white border border-stone-100 rounded-2xl shadow-sm overflow-hidden relative p-5 flex flex-col gap-2">
            <div className="flex items-center justify-between shrink-0">
              <span className="text-[11px] text-stone-400 font-mono">{roomW}m × {roomD}m</span>
              <span className="text-[11px] text-stone-400 capitalize">
                {roomShape.replace('_', ' ')}
              </span>
            </div>
            <FloorPlanMap
              shape={roomShape as RoomShape}
              roomW={roomW}
              roomD={roomD}
              mountPoints={wallMountPoints}
              publishedArtworks={publishedArtworks}
              draggedArtworkId={draggedId}
              onDrop={handleDrop}
              onRemove={handleRemove}
              positions={positions}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden relative">
          <Canvas
            key={`3d-${roomShape}`}
            shadows={false}
            camera={{ position: [0, 5, 14], fov: 55 }}
            gl={{ antialias: true, powerPreference: 'high-performance' }}
          >
            <PerspectiveCamera makeDefault position={[0, 5, 14]} fov={55} />
            <Suspense fallback={null}>
              <StyledGalleryRoom customization={customization} highQuality={false} enableBounds={false} />
              {publishedArtworks
                .filter(aw => aw.positionX !== 0 || aw.positionZ !== 0)
                .map(aw => (
                  <ArtworkFrame key={aw.id} artwork={aw} onClick={() => {}} roomShape={roomShape} />
                ))}
            </Suspense>
            <OrbitControls
              target={[0, 2, 0]}
              maxPolarAngle={Math.PI / 1.85}
              enableZoom enablePan={false}
              minDistance={3} maxDistance={24}
              autoRotate autoRotateSpeed={0.4}
              enableDamping dampingFactor={0.05}
            />
          </Canvas>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm
                          text-white/60 text-[11px] px-3 py-1.5 rounded-full pointer-events-none">
            Drag to orbit · Scroll to zoom
          </div>
        </div>
      )}
    </div>
  )
}