import { useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useGalleryDesignStore } from '@/store/galleryDesignStore'
import { ViewfinderCircleIcon, Squares2X2Icon } from '@heroicons/react/24/outline'
import type { Structure } from '@/types/gallery-customization'
import { SHAPE_RATIOS } from '@/utils/galleryRoom.utils'

// ─── Custom SVG shape icons ───────────────────────────────────────────────────
// Each renders a scaled-down version of the actual room footprint.
// Stroke only — fill on active state via CSS.

function ShapeIcon({ shape, active }: { shape: Structure['shape']; active: boolean }) {
  const stroke = active ? '#7c3aed' : '#78716c'
  const fill   = active ? '#ede9fe' : 'transparent'
  const sw     = 3    // strokeWidth in viewBox units

  switch (shape) {
    case 'rectangle':
      return (
        <svg viewBox="0 0 40 28" className="w-8 h-6">
          <rect x={sw/2} y={sw/2} width={40-sw} height={28-sw} rx="2" fill={fill} stroke={stroke} strokeWidth={sw}/>
        </svg>
      )
    case 'square':
      return (
        <svg viewBox="0 0 30 30" className="w-6 h-6">
          <rect x={sw/2} y={sw/2} width={30-sw} height={30-sw} rx="2" fill={fill} stroke={stroke} strokeWidth={sw}/>
        </svg>
      )
    case 'l_shaped': {
      // L = full rect minus top-right
      const ws = 40 * 0.45, wd = 34 * 0.45
      const pts = `${sw},${sw} ${40-ws},${sw} ${40-ws},${wd} ${40-sw/2},${wd} ${40-sw/2},${34-sw} ${sw},${34-sw}`
      return (
        <svg viewBox="0 0 40 34" className="w-8 h-7">
          <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
        </svg>
      )
    }
    case 't_shaped': {
      const sw2 = 40 * 0.35 / 2, sd = 34 * 0.40, sbD = 34 - sd
      const pts = `${sw/2},${sw/2} ${40-sw/2},${sw/2} ${40-sw/2},${sbD} ${20+sw2},${sbD} ${20+sw2},${34-sw/2} ${20-sw2},${34-sw/2} ${20-sw2},${sbD} ${sw/2},${sbD}`
      return (
        <svg viewBox="0 0 40 34" className="w-8 h-7">
          <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
        </svg>
      )
    }
    case 'u_shaped': {
      const ow = 40 * 0.40, ad = 34 * 0.40, ox = ow/2
      const pts = `${sw/2},${sw/2} ${40-sw/2},${sw/2} ${40-sw/2},${34-sw/2} ${20+ox},${34-sw/2} ${20+ox},${34-ad} ${20-ox},${34-ad} ${20-ox},${34-sw/2} ${sw/2},${34-sw/2}`
      return (
        <svg viewBox="0 0 40 34" className="w-8 h-7">
          <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
        </svg>
      )
    }
    case 'circular':
      return (
        <svg viewBox="0 0 30 30" className="w-6 h-6">
          <circle cx="15" cy="15" r={15-sw/2} fill={fill} stroke={stroke} strokeWidth={sw}/>
        </svg>
      )
    case 'octagonal': {
      const r = 14, cx = 15, cy = 15
      const pts = Array.from({length:8}, (_,i) => {
        const a = (i/8)*Math.PI*2 - Math.PI/8
        return `${cx + r*Math.cos(a)},${cy + r*Math.sin(a)}`
      }).join(' ')
      return (
        <svg viewBox="0 0 30 30" className="w-6 h-6">
          <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
        </svg>
      )
    }
    default: return null
  }
}

// ─── Shape metadata ───────────────────────────────────────────────────────────

const SHAPE_TYPES: {
  id:          Structure['shape']
  name:        string
  hint:        string
  defaultDims: { width: number; depth: number }
  minW:        number
  minD:        number
}[] = [
  { id: 'rectangle', name: 'Rectangle', hint: 'Classic hall',          defaultDims: { width: 22, depth: 16 }, minW: 8,  minD: 8  },
  { id: 'square',    name: 'Square',    hint: 'Balanced space',        defaultDims: { width: 20, depth: 20 }, minW: 10, minD: 10 },
  { id: 'l_shaped',  name: 'L-Shape',   hint: 'Corner wing',           defaultDims: { width: 22, depth: 18 }, minW: 12, minD: 12 },
  { id: 't_shaped',  name: 'T-Shape',   hint: 'Bar + corridor',        defaultDims: { width: 22, depth: 20 }, minW: 14, minD: 14 },
  { id: 'u_shaped',  name: 'U-Shape',   hint: 'Courtyard opening',     defaultDims: { width: 22, depth: 18 }, minW: 14, minD: 14 },
  { id: 'circular',  name: 'Circular',  hint: 'Rotunda',               defaultDims: { width: 18, depth: 18 }, minW: 10, minD: 10 },
  { id: 'octagonal', name: 'Octagonal', hint: 'Symmetrical 8 walls',   defaultDims: { width: 18, depth: 18 }, minW: 12, minD: 12 },
]

const LAYOUT_TYPES: { id: Structure['layoutType']; name: string; desc: string }[] = [
  { id: 'single_room', name: 'Single Room', desc: 'Classic open space'      },
  { id: 'loft',        name: 'Loft',        desc: 'Industrial mezzanine'    },
  { id: 'courtyard',   name: 'Courtyard',   desc: 'Open-air central garden' },
]

const CEILING_TYPES: { id: Structure['ceilingType']; name: string; emoji: string }[] = [
  { id: 'flat',         name: 'Flat',     emoji: '▬' },
  { id: 'vaulted',      name: 'Vaulted',  emoji: '⌒' },
  { id: 'skylight',     name: 'Skylight', emoji: '☀' },
  { id: 'exposed_beam', name: 'Beams',    emoji: '═' },
  { id: 'domed',        name: 'Domed',    emoji: '⌢' },
]

// ─── Area calculator ──────────────────────────────────────────────────────────

function calcArea(shape: Structure['shape'], width: number, depth: number): number {
  switch (shape) {
    case 'circular':  return Math.PI * (width / 2) * (depth / 2)  // ellipse if non-equal
    case 'octagonal': return 2 * (1 + Math.SQRT2) * Math.pow(Math.min(width, depth) / 2, 2)
    case 'l_shaped':  return width * depth - (width * SHAPE_RATIOS.L_WING_W) * (depth * SHAPE_RATIOS.L_WING_D)
    case 't_shaped': {
      const stemW = width * SHAPE_RATIOS.T_STEM_W
      const stemD = depth * SHAPE_RATIOS.T_STEM_D
      return width * depth - 2 * ((width - stemW) / 2) * stemD
    }
    case 'u_shaped':
      return width * depth - (width * SHAPE_RATIOS.U_OPENING_W) * (depth * SHAPE_RATIOS.U_ARM_D)
    default:
      return width * depth
  }
}

// ─── Shape info panel ─────────────────────────────────────────────────────────
// Shows key sub-dimensions so user understands what they're editing

function ShapeInfoPanel({ shape, width, depth }: { shape: Structure['shape']; width: number; depth: number }) {
  const lines = useMemo((): { label: string; value: string }[] => {
    switch (shape) {
      case 'l_shaped': {
        const wingW = (width  * SHAPE_RATIOS.L_WING_W).toFixed(1)
        const wingD = (depth  * SHAPE_RATIOS.L_WING_D).toFixed(1)
        const mainW = (width  - width  * SHAPE_RATIOS.L_WING_W).toFixed(1)
        const mainD = (depth  - depth  * SHAPE_RATIOS.L_WING_D).toFixed(1)
        return [
          { label: 'Main body', value: `${mainW} × ${mainD} m` },
          { label: 'Wing void',  value: `${wingW} × ${wingD} m` },
        ]
      }
      case 't_shaped': {
        const stemW = (width  * SHAPE_RATIOS.T_STEM_W).toFixed(1)
        const stemD = (depth  * SHAPE_RATIOS.T_STEM_D).toFixed(1)
        const barD  = (depth  - depth  * SHAPE_RATIOS.T_STEM_D).toFixed(1)
        return [
          { label: 'Bar width',  value: `${width}m full` },
          { label: 'Bar depth',  value: `${barD} m` },
          { label: 'Stem',       value: `${stemW} × ${stemD} m` },
        ]
      }
      case 'u_shaped': {
        const openW = (width  * SHAPE_RATIOS.U_OPENING_W).toFixed(1)
        const armW  = ((width - width * SHAPE_RATIOS.U_OPENING_W) / 2).toFixed(1)
        const armD  = (depth  * SHAPE_RATIOS.U_ARM_D).toFixed(1)
        return [
          { label: 'Arm width',  value: `${armW} m each` },
          { label: 'Arm depth',  value: `${armD} m` },
          { label: 'Opening',    value: `${openW} m wide` },
        ]
      }
      case 'circular': {
        const r = (Math.min(width, depth) / 2).toFixed(1)
        return [{ label: 'Radius', value: `${r} m` }]
      }
      case 'octagonal': {
        const side = (2 * Math.min(width, depth) / 2 * Math.sin(Math.PI / 8)).toFixed(1)
        return [{ label: 'Wall segment', value: `${side} m each` }]
      }
      default: return []
    }
  }, [shape, width, depth])

  if (lines.length === 0) return null

  return (
    <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 grid grid-cols-3 gap-2">
      {lines.map(l => (
        <div key={l.label} className="text-center">
          <p className="text-[9px] text-purple-400 font-medium uppercase tracking-wide">{l.label}</p>
          <p className="text-xs font-bold text-purple-700 mt-0.5" style={{ fontVariantNumeric: 'tabular-nums' }}>{l.value}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Slider ───────────────────────────────────────────────────────────────────

function Slider({
  label, value, min, max, step, unit = 'm', onChange,
}: {
  label: string; value: number; min: number; max: number
  step: number; unit?: string; onChange: (v: number) => void
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-stone-600">{label}</span>
        <span className="text-sm font-semibold text-purple-600" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {value.toFixed(1)}{unit}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer accent-purple-600"
        style={{ background: `linear-gradient(to right, #9333ea ${pct}%, #e7e5e4 ${pct}%)` }}
      />
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function StructureEditor() {
  const structure  = useGalleryDesignStore(s => s.customization.structure)
  const updatePart = useGalleryDesignStore(s => s.updatePart)

  // Guard: shape may be undefined if store was persisted before this field existed
  const safeShape     = (structure.shape ?? 'rectangle') as Structure['shape']
  const safeStructure = { ...structure, shape: safeShape }

  const update = useCallback(
    (patch: Partial<Structure>) => updatePart('structure', { ...structure, ...patch }),
    [structure, updatePart],
  )

  const handleShapeChange = useCallback(
    (shape: Structure['shape']) => {
      const meta = SHAPE_TYPES.find(s => s.id === shape)
      update({ shape, roomWidth: meta?.defaultDims.width ?? 22, roomDepth: meta?.defaultDims.depth ?? 22 })
    },
    [update],
  )

  const meta       = SHAPE_TYPES.find(s => s.id === safeStructure.shape) ?? SHAPE_TYPES[0]
  const isSymmetric = safeStructure.shape === 'circular' || safeStructure.shape === 'square' || safeStructure.shape === 'octagonal'
  const floorArea  = useMemo(
    () => calcArea(safeStructure.shape, safeStructure.roomWidth, safeStructure.roomDepth),
    [safeStructure.shape, safeStructure.roomWidth, safeStructure.roomDepth],
  )

  return (
    <div className="space-y-6">

      {/* ── Shape selector ── */}
      <div>
        <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-3">
          Gallery Shape
        </label>
        <div className="grid grid-cols-4 gap-2">
          {SHAPE_TYPES.map(s => {
            const isActive = safeStructure.shape === s.id
            return (
              <button
                key={s.id}
                onClick={() => handleShapeChange(s.id)}
                title={s.hint}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all duration-150
                  ${isActive
                    ? 'border-purple-500 bg-purple-50 shadow-sm'
                    : 'border-stone-200 text-stone-500 hover:border-stone-300 hover:bg-stone-50'
                  }`}
              >
                <ShapeIcon shape={s.id} active={isActive} />
                <span className={`text-[10px] font-semibold leading-tight text-center
                  ${isActive ? 'text-purple-700' : 'text-stone-500'}`}>
                  {s.name}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Dimensions ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
            Dimensions
          </label>
          <motion.span
            key={floorArea.toFixed(0)}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-semibold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full"
          >
            {floorArea.toFixed(0)} m²
          </motion.span>
        </div>

        {isSymmetric ? (
          <Slider
            label={safeStructure.shape === 'circular' ? 'Diameter' : 'Side Length'}
            value={safeStructure.roomWidth}
            min={meta.minW} max={24} step={0.5}
            onChange={val => update({ roomWidth: val, roomDepth: val })}
          />
        ) : (
          <div className="space-y-3">
            <Slider label="Width" value={safeStructure.roomWidth}  min={meta.minW} max={30} step={0.5}
              onChange={val => update({ roomWidth: val })} />
            <Slider label="Depth" value={safeStructure.roomDepth}  min={meta.minD} max={30} step={0.5}
              onChange={val => update({ roomDepth: val })} />
          </div>
        )}

        {/* Shape sub-dimensions info */}
        <ShapeInfoPanel shape={safeStructure.shape} width={safeStructure.roomWidth} depth={safeStructure.roomDepth} />

        <Slider label="Wall Height" value={safeStructure.wallHeight} min={2.5} max={8} step={0.1}
          onChange={val => update({ wallHeight: val })} />
      </div>

      {/* ── Layout type ── */}
      <div>
        <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-3">
          Layout Type
        </label>
        <div className="grid grid-cols-3 gap-2">
          {LAYOUT_TYPES.map(layout => (
            <button
              key={layout.id}
              onClick={() => update({ layoutType: layout.id })}
              className={`p-3 rounded-xl border-2 text-center transition-all duration-150
                ${safeStructure.layoutType === layout.id
                  ? 'border-purple-500 bg-purple-50 shadow-sm'
                  : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                }`}
            >
              <p className={`text-sm font-semibold ${safeStructure.layoutType === layout.id ? 'text-purple-700' : 'text-stone-700'}`}>
                {layout.name}
              </p>
              <p className="text-[10px] text-stone-400 mt-0.5 leading-tight">{layout.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Ceiling style ── */}
      <div>
        <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-3">
          Ceiling Style
        </label>
        <div className="grid grid-cols-5 gap-2">
          {CEILING_TYPES.map(ceiling => (
            <button
              key={ceiling.id}
              onClick={() => update({ ceilingType: ceiling.id })}
              title={ceiling.name}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all duration-150
                ${safeStructure.ceilingType === ceiling.id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                }`}
            >
              <span className="text-lg leading-none">{ceiling.emoji}</span>
              <span className={`text-[10px] font-semibold text-center leading-tight
                ${safeStructure.ceilingType === ceiling.id ? 'text-purple-700' : 'text-stone-500'}`}>
                {ceiling.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Pillars toggle ── */}
      {(safeStructure.shape === 'rectangle' || safeStructure.shape === 'square' || safeStructure.layoutType === 'courtyard') && (
        <div className="flex items-center justify-between pt-4 border-t border-stone-100">
          <div>
            <p className="text-sm font-semibold text-stone-700">Decorative Pillars</p>
            <p className="text-xs text-stone-400 mt-0.5">Classical columns at room corners</p>
          </div>
          <button
            onClick={() => update({ pillars: !safeStructure.pillars })}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
              safeStructure.pillars ? 'bg-purple-500' : 'bg-stone-200'
            }`}
          >
            <motion.span
              className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm"
              animate={{ x: safeStructure.pillars ? 20 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
        </div>
      )}

      {/* ── Stats bar ── */}
      <div className="bg-stone-50 rounded-xl p-4 border border-stone-100 grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-xs text-stone-400">Floor Area</p>
          <p className="text-sm font-bold text-stone-700 mt-0.5" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {floorArea.toFixed(0)} m²
          </p>
        </div>
        <div>
          <p className="text-xs text-stone-400">Volume</p>
          <p className="text-sm font-bold text-stone-700 mt-0.5" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {(floorArea * safeStructure.wallHeight).toFixed(0)} m³
          </p>
        </div>
        <div>
          <p className="text-xs text-stone-400">Ceiling</p>
          <p className="text-sm font-bold text-stone-700 mt-0.5" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {safeStructure.wallHeight.toFixed(1)} m
          </p>
        </div>
      </div>
    </div>
  )
}