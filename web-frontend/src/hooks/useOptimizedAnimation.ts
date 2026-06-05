import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnimationOptions {
  /**
   * Pause the callback when the browser tab is hidden.
   * Prevents wasted CPU on invisible scenes.
   * Default: true
   */
  pauseWhenHidden?: boolean

  /**
   * Maximum delta in seconds passed to the callback.
   * Clamps lag spikes (e.g. tab switch, debugger pause) so animations
   * don't jump forward by multiple seconds after a freeze.
   * Default: 0.1 (100ms = ~6 missed frames at 60fps)
   */
  maxDelta?: number

  /**
   * Minimum milliseconds between callback invocations.
   * Use this ONLY when the callback itself is expensive (physics step,
   * pathfinding, AI tick) and you want to run it less than 60×/sec.
   * DO NOT use to "reduce GPU load" — throttling useFrame doesn't save
   * any render calls, only skips your CPU callback.
   * Default: 0 (every frame)
   */
  throttleMs?: number

  /** Disable entirely. Default: true */
  enabled?: boolean
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Runs a callback every render frame via useFrame with production-grade
 * delta clamping and optional tab-visibility pausing.
 *
 * @param callback - receives clamped delta in seconds
 * @param options  - see AnimationOptions
 *
 * @example
 * // Rotate an object
 * useOptimizedAnimation((delta) => {
 *   meshRef.current.rotation.y += delta * Math.PI * 0.5
 * })
 *
 * @example
 * // Expensive AI tick at max 10fps
 * useOptimizedAnimation(runAI, { throttleMs: 100 })
 */
export function useOptimizedAnimation(
  callback:  (delta: number) => void,
  options:   AnimationOptions = {}
) {
  const {
    pauseWhenHidden = true,
    maxDelta        = 0.1,
    throttleMs      = 0,
    enabled         = true,
  } = options

  // Tab visibility state — avoids animating hidden scenes
  const isVisible = useRef(true)

  useEffect(() => {
    if (!pauseWhenHidden) return
    const onVisibilityChange = () => {
      isVisible.current = document.visibilityState === 'visible'
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [pauseWhenHidden])

  // Throttle tracking — only used when throttleMs > 0
  const lastCallTime = useRef(0)
  // Accumulated delta across skipped frames — correct way to carry time forward
  const accumulated  = useRef(0)

  useFrame((_, rawDelta) => {
    if (!enabled || !isVisible.current) return

    // Clamp delta to avoid spiral-of-death after tab switches or lag spikes.
    // Without this, a 2-second freeze produces delta=2.0 → objects teleport.
    const delta = Math.min(rawDelta, maxDelta)

    // No throttle → call every frame (most common case)
    if (throttleMs <= 0) {
      callback(delta)
      return
    }

    // Throttle: accumulate delta across skipped frames so total time is preserved.
    // Note: this only throttles the CPU callback — the GPU renders every frame regardless.
    accumulated.current += delta
    const now = performance.now()

    if (now - lastCallTime.current < throttleMs) return

    callback(accumulated.current)
    accumulated.current = 0
    lastCallTime.current = now
  })
}