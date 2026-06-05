import {
  EffectComposer,
  Bloom,
  ToneMapping,
  Vignette,
  BrightnessContrast,
} from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import type { GalleryCustomization } from '@/types/gallery-customization'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PostProcessingProps {
  customization?: GalleryCustomization | null
  /** preview = Studio Pro (lighter, no vignette). visitor = VirtualGallery (full). */
  mode?:    'preview' | 'visitor'
  enabled?: boolean
}

// ─── Param resolver ───────────────────────────────────────────────────────────

interface Params {
  bloomIntensity:   number
  bloomThreshold:   number
  bloomSmoothing:   number
  middleGrey:       number
  maxLuminance:     number
  vignetteOffset:   number
  vignetteDarkness: number
  brightness:       number
  contrast:         number
}

function resolveParams(
  c?: GalleryCustomization | null,
  mode: 'preview' | 'visitor' = 'visitor'
): Params {
  const ambient   = c?.lighting?.ambientLight?.intensity ?? 0.75
  const lightType = c?.lighting?.mainLighting?.type      ?? 'recessed'
  const isDark    = ambient < 0.4

  return {
    // Bloom — high threshold so only emissive bulbs bloom, not walls
    bloomIntensity: isDark ? 0.55 : 0.18,
    bloomThreshold: isDark ? 0.78 : 0.88,
    bloomSmoothing: 0.04,

    // Tone mapping — dark rooms need lower midpoint to preserve blacks
    middleGrey:   isDark ? 0.42 : 0.58,
    maxLuminance: lightType === 'natural' ? 24 : 14,

    // Vignette — disabled in preview (offset 1.0 = no darkening)
    vignetteOffset:   mode === 'preview' ? 1.0 : isDark ? 0.35 : 0.55,
    vignetteDarkness: mode === 'preview' ? 0.0 : isDark ? 0.55 : 0.30,

    // Contrast boost in preview only (no ambient occlusion there)
    brightness: mode === 'preview' ? 0.02 : 0.0,
    contrast:   mode === 'preview' ? 0.08 : 0.0,
  }
}

// ─── Sub-composers ────────────────────────────────────────────────────────────
// EffectComposer requires every child to be a concrete Element — no null/false/undefined.
// We avoid conditional rendering inside EffectComposer by using separate components
// for each mode. Each component always renders all its effects.

function PreviewEffects({ p }: { p: Params }) {
  return (
    <EffectComposer multisampling={0} depthBuffer stencilBuffer={false}>
      <Bloom
        intensity={p.bloomIntensity}
        luminanceThreshold={p.bloomThreshold}
        luminanceSmoothing={p.bloomSmoothing}
        blendFunction={BlendFunction.SCREEN}
        mipmapBlur
        levels={4}
      />
      <ToneMapping
        mode={ToneMappingMode.ACES_FILMIC}
        adaptive
        resolution={512}
        middleGrey={p.middleGrey}
        maxLuminance={p.maxLuminance}
        averageLuminance={0.18}
        adaptationRate={2.0}
      />
      <Vignette
        offset={p.vignetteOffset}
        darkness={p.vignetteDarkness}
        blendFunction={BlendFunction.MULTIPLY}
      />
      <BrightnessContrast
        brightness={p.brightness}
        contrast={p.contrast}
      />
    </EffectComposer>
  )
}

function VisitorEffects({ p }: { p: Params }) {
  return (
    <EffectComposer multisampling={0} depthBuffer stencilBuffer={false}>
      <Bloom
        intensity={p.bloomIntensity}
        luminanceThreshold={p.bloomThreshold}
        luminanceSmoothing={p.bloomSmoothing}
        blendFunction={BlendFunction.SCREEN}
        mipmapBlur
        levels={4}
      />
      <ToneMapping
        mode={ToneMappingMode.ACES_FILMIC}
        adaptive
        resolution={512}
        middleGrey={p.middleGrey}
        maxLuminance={p.maxLuminance}
        averageLuminance={0.18}
        adaptationRate={2.0}
      />
      <Vignette
        offset={p.vignetteOffset}
        darkness={p.vignetteDarkness}
        blendFunction={BlendFunction.MULTIPLY}
      />
    </EffectComposer>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function PostProcessing({
  customization,
  mode    = 'visitor',
  enabled = true,
}: PostProcessingProps) {
  if (!enabled) return null

  const p = resolveParams(customization, mode)

  return mode === 'preview'
    ? <PreviewEffects p={p} />
    : <VisitorEffects p={p} />
}