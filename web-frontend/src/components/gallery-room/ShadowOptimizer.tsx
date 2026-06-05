/**
 * ShadowOptimizer.ts
 *
 * Shadow casting/receiving rules for every room element.
 *
 * Why each rule is what it is:
 *
 *   floor      castShadow=false  — flat plane, casts nothing useful
 *              receiveShadow=true — must show pillar / artwork shadows
 *
 *   walls      castShadow=false  — vertical planes rarely cast useful shadows
 *              receiveShadow=true — show artwork frame shadows against the wall
 *
 *   pillars    castShadow=true   — cast long shadows on floor (architectural drama)
 *              receiveShadow=true — receive shadows from other pillars
 *
 *   ceiling    castShadow=false  — never visible from below in first-person view
 *              receiveShadow=false — no shadow above the camera eye
 *
 *   trackLights castShadow=false — tiny geometry, shadow cost > visual benefit
 *               receiveShadow=false — small metal head, not worth the sample
 *
 *   artwork    castShadow=true   — frame casts a subtle shadow on the wall
 *              receiveShadow=false — canvas surface is the subject, not a shadow receiver
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShadowConfig {
  castShadow:    boolean
  receiveShadow: boolean
}

export type ShadowRole =
  | 'floor'
  | 'walls'
  | 'pillars'
  | 'ceiling'
  | 'trackLights'
  | 'artwork'
  | 'trimMoldings'

// ─── Rules ────────────────────────────────────────────────────────────────────

export const SHADOW_RULES: Record<ShadowRole, ShadowConfig> = {
  floor:        { castShadow: false, receiveShadow: true  },
  walls:        { castShadow: false, receiveShadow: true  },
  pillars:      { castShadow: true,  receiveShadow: true  },
  ceiling:      { castShadow: false, receiveShadow: false },
  trackLights:  { castShadow: false, receiveShadow: false },
  artwork:      { castShadow: true,  receiveShadow: false },
  trimMoldings: { castShadow: false, receiveShadow: false },
} as const

// ─── Spread helper ────────────────────────────────────────────────────────────
// Returns castShadow + receiveShadow props ready to spread onto a mesh.
//
// Usage:
//   <mesh {...shadowProps('floor')} ...>
//   <mesh {...shadowProps('artwork')} ...>

export function shadowProps(role: ShadowRole): ShadowConfig {
  return SHADOW_RULES[role]
}

// ─── Performance preset ───────────────────────────────────────────────────────
// On low-end devices, disable all shadow casting to maintain frame rate.
// Pass the result of qualityShadowProps(isHighEnd) to override SHADOW_RULES.

export function qualityShadowProps(
  role:       ShadowRole,
  highQuality: boolean
): ShadowConfig {
  if (!highQuality) return { castShadow: false, receiveShadow: false }
  return SHADOW_RULES[role]
}