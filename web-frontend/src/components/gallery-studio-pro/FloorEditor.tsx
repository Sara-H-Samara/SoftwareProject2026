// src/components/gallery-studio-pro/FloorEditor.tsx
import { useCallback } from 'react'
import { useGalleryDesignStore } from '@/store/galleryDesignStore'

const FLOOR_MATERIALS = [
  { id: 'wood', name: 'Wood', roughness: 0.5, gloss: 0.3 },
  { id: 'marble', name: 'Marble', roughness: 0.3, gloss: 0.6 },
  { id: 'concrete', name: 'Concrete', roughness: 0.7, gloss: 0.2 },
  { id: 'tile', name: 'Tile', roughness: 0.4, gloss: 0.5 },
]

export default function FloorEditor() {
  const { customization, updatePart } = useGalleryDesignStore()
  const floor = customization.floor

  const updateFloor = useCallback((key: string, value: any) => {
    updatePart('floor', { ...floor, [key]: value })
  }, [floor, updatePart])

  return (
    <div className="space-y-5">
      {/* Material Selector */}
      <div>
        <label className="text-xs font-medium text-stone-500 uppercase tracking-wide block mb-2">
          Floor Material
        </label>
        <div className="grid grid-cols-2 gap-2">
          {FLOOR_MATERIALS.map((mat) => (
            <button
              key={mat.id}
              onClick={() => {
                updateFloor('material', mat.id)
                updateFloor('roughness', mat.roughness)
              }}
              className={`p-2 rounded-lg border transition-all text-left
                ${floor.material === mat.id 
                  ? 'border-purple-500 bg-purple-50' 
                  : 'border-stone-200 hover:border-stone-300'
                }`}
            >
              <div>
                <div className="text-sm font-medium text-stone-700">{mat.name}</div>
                <div className="text-[10px] text-stone-400">Roughness: {mat.roughness}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Floor Color */}
      <div>
        <label className="text-xs font-medium text-stone-500 uppercase tracking-wide block mb-2">
          Floor Color
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={floor.color}
            onChange={(e) => updateFloor('color', e.target.value)}
            className="w-10 h-10 rounded-lg border border-stone-200 cursor-pointer"
          />
          <span className="text-sm text-stone-600 font-mono">{floor.color}</span>
        </div>
      </div>

      {/* Roughness */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-stone-600">Roughness</span>
          <span className="text-purple-600 font-medium">{floor.roughness.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={floor.roughness}
          onChange={(e) => updateFloor('roughness', parseFloat(e.target.value))}
          className="w-full h-1.5 bg-stone-200 rounded-full appearance-none cursor-pointer accent-purple-600"
        />
      </div>

      {/* Gloss / Shininess */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-stone-600">Gloss Level</span>
          <span className="text-purple-600 font-medium">{((floor.gloss || 0.4) * 100).toFixed(0)}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={floor.gloss || 0.4}
          onChange={(e) => updateFloor('gloss', parseFloat(e.target.value))}
          className="w-full h-1.5 bg-stone-200 rounded-full appearance-none cursor-pointer accent-purple-600"
        />
      </div>
    </div>
  )
}