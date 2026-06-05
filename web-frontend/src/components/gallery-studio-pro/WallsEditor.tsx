import { useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PaintBrushIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { useGalleryDesignStore } from '@/store/galleryDesignStore'
import type { Walls } from '@/types/gallery-customization'

// ─── Constants ────────────────────────────────────────────────────────────────

const MATERIALS: {
  id:        Walls['material']
  name:      string
  color:     string
  roughness: number
  metalness: number
}[] = [
  { id: 'plaster',     name: 'Plaster',     color: '#ece6dc', roughness: 0.72, metalness: 0.04 },
  { id: 'brick',       name: 'Brick',       color: '#b45309', roughness: 0.92, metalness: 0.04 },
  { id: 'wood_panels', name: 'Wood',        color: '#78350f', roughness: 0.55, metalness: 0.04 },
  { id: 'concrete',    name: 'Concrete',    color: '#78716c', roughness: 0.88, metalness: 0.04 },
  { id: 'glass',       name: 'Glass',       color: '#a5f3fc', roughness: 0.04, metalness: 0.90 },
  { id: 'mirror',      name: 'Mirror',      color: '#9ca3af', roughness: 0.01, metalness: 0.98 },
]

const WALL_OPTIONS: { value: Walls['accentWall']['wall']; label: string }[] = [
  { value: 'front', label: 'Front Wall'  },
  { value: 'back',  label: 'Back Wall'   },
  { value: 'left',  label: 'Left Wall'   },
  { value: 'right', label: 'Right Wall'  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function WallsEditor() {
  const walls      = useGalleryDesignStore(s => s.customization.walls)
  const updatePart = useGalleryDesignStore(s => s.updatePart)

  // FIX #1 + #4: single store update, typed Partial<Walls>
  const update = useCallback(
    (patch: Partial<Walls>) => updatePart('walls', { ...walls, ...patch }),
    [walls, updatePart]
  )

  // FIX #2: typed nested updates
  const updateAccent = useCallback(
    <K extends keyof Walls['accentWall']>(key: K, value: Walls['accentWall'][K]) =>
      updatePart('walls', { ...walls, accentWall: { ...walls.accentWall, [key]: value } }),
    [walls, updatePart]
  )

  // FIX #3: selectMaterial → single update (was 3-4 separate store writes)
  const selectMaterial = useCallback(
    (mat: typeof MATERIALS[number]) => {
      update({ material: mat.id, color: mat.color, roughness: mat.roughness })
    },
    [update]
  )

  // FIX #5: accent toggle synced with walls.accentWall.enabled (no separate useState)
  const toggleAccent = useCallback(
    () => updateAccent('enabled', !walls.accentWall.enabled),
    [walls.accentWall.enabled, updateAccent]
  )

  const isGlassLike = walls.material === 'glass' || walls.material === 'mirror'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
          <PaintBrushIcon className="w-4 h-4 text-purple-600" />
        </div>
        <div>
          <h3 className="font-medium text-stone-800 text-sm">Walls & Finishes</h3>
          <p className="text-xs text-stone-400">Customize wall appearance</p>
        </div>
      </div>

      {/* Material Selector */}
      <div>
        <label className="text-xs font-medium text-stone-500 uppercase tracking-wide block mb-3">
          Material
        </label>
        <div className="grid grid-cols-3 gap-2">
          {MATERIALS.map(mat => (
            <button
              key={mat.id}
              onClick={() => selectMaterial(mat)}
              className={`relative p-2 rounded-xl border transition-all duration-150 text-left
                ${walls.material === mat.id
                  ? 'border-purple-500 bg-purple-50 shadow-sm ring-1 ring-purple-200'
                  : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg border border-stone-200 shadow-inner shrink-0"
                  style={{ backgroundColor: mat.color }}
                />
                <span className={`text-xs font-medium ${walls.material === mat.id ? 'text-purple-700' : 'text-stone-600'}`}>
                  {mat.name}
                </span>
              </div>
              {walls.material === mat.id && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Glass / mirror hint */}
        <AnimatePresence>
          {isGlassLike && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 rounded-xl p-3 bg-purple-50 border border-purple-100"
            >
              <p className="text-xs text-purple-700">
                {walls.material === 'glass'
                  ? 'Glass appears transparent with realistic refraction'
                  : 'Mirror reflects the environment realistically'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Color */}
      <div>
        <label className="text-xs font-medium text-stone-500 uppercase tracking-wide block mb-2">
          Color
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={walls.color}
            onChange={e => update({ color: e.target.value })}
            className="w-10 h-10 rounded-lg border border-stone-200 cursor-pointer"
          />
          <span className="text-sm text-stone-600 font-mono bg-stone-50 px-2 py-1 rounded border border-stone-200">
            {walls.color.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Roughness — FIX #2: removed fake debounce (isChanging flag was blocking updates) */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-stone-600">Roughness</span>
          <span className="text-purple-600 font-medium" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {walls.roughness.toFixed(2)}
          </span>
        </div>
        <div className="relative">
          <input
            type="range" min={0} max={1} step={0.01}
            value={walls.roughness}
            onChange={e => update({ roughness: parseFloat(e.target.value) })}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-purple-600"
            style={{
              background: `linear-gradient(to right, #9333ea ${walls.roughness * 100}%, #e7e5e4 ${walls.roughness * 100}%)`,
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-stone-400 mt-1">
          <span>Smooth</span>
          <span>Rough</span>
        </div>
      </div>

      {/* Accent Wall — FIX #5: enabled synced with store, not local useState */}
      <div className="pt-2 border-t border-stone-100">
        <button
          onClick={toggleAccent}
          className="w-full flex items-center justify-between py-2 group"
        >
          <div className="text-left">
            <p className="text-sm font-medium text-stone-700 flex items-center gap-2">
              Accent Wall
              {walls.accentWall.enabled && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600">
                  Active
                </span>
              )}
            </p>
            <p className="text-xs text-stone-400">Highlight one wall with a different color</p>
          </div>
          <div className="text-stone-400 group-hover:text-stone-600 transition-colors">
            {walls.accentWall.enabled
              ? <ChevronUpIcon   className="w-4 h-4" />
              : <ChevronDownIcon className="w-4 h-4" />
            }
          </div>
        </button>

        <AnimatePresence>
          {walls.accentWall.enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pl-4 border-l-2 border-purple-200 space-y-3 pt-1">
                {/* Wall selector */}
                <div>
                  <label className="text-xs text-stone-500 block mb-1">Wall to Highlight</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {WALL_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => updateAccent('wall', opt.value)}
                        className={`py-1.5 rounded-lg border text-xs font-medium transition-all
                          ${walls.accentWall.wall === opt.value
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-stone-200 text-stone-600 hover:border-stone-300'
                          }`}
                      >
                        {opt.label.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accent color */}
                <div>
                  <label className="text-xs text-stone-500 block mb-1">Accent Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={walls.accentWall.color}
                      onChange={e => updateAccent('color', e.target.value)}
                      className="w-10 h-10 rounded-lg border border-stone-200 cursor-pointer"
                    />
                    <span className="text-sm text-stone-600 font-mono bg-stone-50 px-2 py-1 rounded border border-stone-200">
                      {walls.accentWall.color.toUpperCase()}
                    </span>
                  </div>
                  {/* Color preview strip */}
                  <div
                    className="mt-2 h-6 rounded-lg border border-stone-200 transition-colors duration-200"
                    style={{ backgroundColor: walls.accentWall.color }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Live preview indicator */}
      <div className="text-center pt-1">
        <span className="text-[10px] text-stone-400 bg-stone-50 px-2 py-1 rounded-full">
          Changes update in real-time
        </span>
      </div>
    </div>
  )
}