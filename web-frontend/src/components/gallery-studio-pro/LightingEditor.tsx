// src/components/gallery-studio-pro/LightingEditor.tsx
import { useCallback } from 'react'
import { useGalleryDesignStore } from '@/store/galleryDesignStore'

export default function LightingEditor() {
  const { customization, updatePart } = useGalleryDesignStore()
  const lighting = customization.lighting

  const updateLighting = useCallback((key: string, value: any) => {
    updatePart('lighting', { ...lighting, [key]: value })
  }, [lighting, updatePart])

  const updateAmbient = useCallback((key: string, value: any) => {
    updatePart('lighting', {
      ...lighting,
      ambientLight: { ...lighting.ambientLight, [key]: value }
    })
  }, [lighting, updatePart])

  const updateSpotlights = useCallback((key: string, value: any) => {
    updatePart('lighting', {
      ...lighting,
      spotlights: { ...lighting.spotlights, [key]: value }
    })
  }, [lighting, updatePart])

  return (
    <div className="space-y-5">
      {/* Ambient Light */}
      <div>
        <label className="text-xs font-medium text-stone-500 uppercase tracking-wide block mb-3">
          Ambient Light
        </label>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-stone-600">Intensity</span>
              <span className="text-purple-600 font-medium">{lighting.ambientLight.intensity.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={1.5}
              step={0.05}
              value={lighting.ambientLight.intensity}
              onChange={(e) => updateAmbient('intensity', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-stone-200 rounded-full appearance-none cursor-pointer accent-purple-600"
            />
          </div>
          <div>
            <label className="text-xs text-stone-500 block mb-1">Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={lighting.ambientLight.color}
                onChange={(e) => updateAmbient('color', e.target.value)}
                className="w-10 h-10 rounded-lg border border-stone-200 cursor-pointer"
              />
              <span className="text-sm text-stone-600 font-mono">{lighting.ambientLight.color}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Lighting Type */}
      <div>
        <label className="text-xs font-medium text-stone-500 uppercase tracking-wide block mb-2">
          Main Lighting
        </label>
        <div className="grid grid-cols-4 gap-2">
          {['recessed', 'pendant', 'track', 'natural'].map((type) => (
            <button
              key={type}
              onClick={() => updateLighting('mainLighting', { ...lighting.mainLighting, type })}
              className={`px-2 py-1.5 rounded-lg text-xs capitalize transition-all
                ${lighting.mainLighting.type === type 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Main Light Intensity */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-stone-600">Light Intensity</span>
          <span className="text-purple-600 font-medium">{lighting.mainLighting.intensity.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min={0.3}
          max={1.5}
          step={0.05}
          value={lighting.mainLighting.intensity}
          onChange={(e) => updateLighting('mainLighting', { ...lighting.mainLighting, intensity: parseFloat(e.target.value) })}
          className="w-full h-1.5 bg-stone-200 rounded-full appearance-none cursor-pointer accent-purple-600"
        />
      </div>

      {/* Spotlights Toggle */}
      <div className="flex items-center justify-between pt-2 border-t border-stone-100">
        <div>
          <p className="text-sm font-medium text-stone-700">Spotlights</p>
          <p className="text-xs text-stone-400">Dramatic artwork illumination</p>
        </div>
        <button
          onClick={() => updateSpotlights('enabled', !lighting.spotlights.enabled)}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all
            ${lighting.spotlights.enabled 
              ? 'bg-purple-600 text-white' 
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
        >
          {lighting.spotlights.enabled ? 'On' : 'Off'}
        </button>
      </div>

      {/* Spotlight Intensity */}
      {lighting.spotlights.enabled && (
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-stone-600">Spotlight Intensity</span>
            <span className="text-purple-600 font-medium">{lighting.spotlights.intensity.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.1}
            value={lighting.spotlights.intensity}
            onChange={(e) => updateSpotlights('intensity', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-stone-200 rounded-full appearance-none cursor-pointer accent-purple-600"
          />
        </div>
      )}
    </div>
  )
}