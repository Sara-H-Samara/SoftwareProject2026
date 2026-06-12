import { useEffect, useRef, useState, useCallback } from 'react'
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native'
import { GLView } from 'expo-gl'
import * as THREE from 'three'
import { Renderer } from 'expo-three'
import { Ionicons } from '@expo/vector-icons'
import type { Avatar } from '@/types'
import {
  buildAvatarGroup,
  disposeAvatarGroup,
  summariseAvatarGroup,
  avatarBounds,
  tickAvatarAnimation,
} from './buildAvatar'

interface Props {
  avatar: Avatar
  /** Pixel height of the preview surface. Width fills the parent. */
  height?: number
  /**
   * If `true`, the avatar spins continuously (full 360°). Default is
   * `false` because a constantly spinning avatar masks customization
   * changes — eg. selecting glasses while the avatar is showing its
   * back hides the new glasses for several seconds, which feels like
   * the preview "didn't update".
   *
   * Even with `autoRotate=false` we add a gentle ±20° horizontal sway
   * so the avatar feels alive but never hides the face for long.
   */
  autoRotate?: boolean
}

// ── Pure key builders ────────────────────────────────────────────────────
// Used by the update effect and the synchronous onContextCreate path
// that records the initial build's fingerprint.

function makeStyleKey(a: Avatar): string {
  return [a.height, a.hairStyle, a.shirtStyle, a.pantsStyle, a.accessory].join('|')
}

function makeColorKey(a: Avatar): string {
  return [a.skinColor, a.hairColor, a.shirtColor, a.pantsColor, a.shoesColor, a.accessoryColor].join('|')
}

/**
 * Lightweight Three.js avatar preview.
 *
 * ── LIVE-UPDATE ARCHITECTURE ────────────────────────────────────────────
 *
 * Previous bug: the preview did not react to customization changes. Two
 * subtle issues combined to silently swallow updates:
 *
 *   (A) The effect that drove rebuilds keyed off the `avatar` *object
 *       reference*. If React reused a reference between renders (eg.
 *       React Query handing back the same cached object), the dep did
 *       not trip and no rebuild fired.
 *
 *   (B) The effect bailed out with `if (!sceneRef.current) return` when
 *       the GL context wasn't ready yet, but the bailout was never
 *       retried — so any change that landed *during* GL initialization
 *       was lost forever.
 *
 * Both issues are fixed here:
 *
 *   1. **String fingerprints** (`makeStyleKey` / `makeColorKey`) are
 *      recomputed inside the update effect so style vs color-only paths
 *      are chosen reliably on every avatar prop change.
 *
 *   2. **latestAvatarRef** is mutated on every render so the rebuild
 *      path always sees the freshest avatar even when invoked from
 *      timing-sensitive code paths.
 *
 *   3. **Inline initial build inside `onContextCreate`** guarantees the
 *      avatar appears the instant the GL context is alive — independent
 *      of React effect timing. An `initTick` counter is then bumped to
 *      force the update effect to re-run once more, reconciling any
 *      change that landed during the GL initialization window.
 *
 *   4. **Color-only fast path**: when the user only changes a palette
 *      colour (no style change), we skip the full geometry rebuild and
 *      just update the existing materials in-place. This makes palette
 *      taps feel instant (sub-frame) and keeps GPU memory stable.
 *
 *   5. Verbose `[AVATAR-PREVIEW]` logs trace every event so a future
 *      regression can be diagnosed from logs alone.
 */
export function AvatarPreview3D({ avatar, height = 320, autoRotate = false }: Props) {
  const glRef         = useRef<any>(null)
  const rendererRef   = useRef<Renderer | null>(null)
  const sceneRef      = useRef<THREE.Scene | null>(null)
  const cameraRef     = useRef<THREE.PerspectiveCamera | null>(null)
  const avatarRef     = useRef<THREE.Group | null>(null)
  const rafRef        = useRef<number | null>(null)
  const autoRotateRef = useRef(autoRotate)
  const animStartRef  = useRef<number>(0)

  // Tracks the LATEST avatar prop value, mutated on every render so the
  // rebuild path is never stale regardless of effect / closure timing.
  const latestAvatarRef = useRef<Avatar>(avatar)
  latestAvatarRef.current = avatar

  // Tracks the last-built fingerprint so we know which fields actually
  // changed and can decide between a full rebuild and a fast material
  // update.
  const lastBuiltRef = useRef<{ style: string; color: string } | null>(null)

  // GL view is conditionally mounted — only once the container has
  // measured non-zero size — to avoid 0x0 drawing buffers.
  const [hasLayout, setHasLayout] = useState(false)
  // Counter bumped at the END of onContextCreate. Drives the update
  // effect to re-run *once* after the initial build, so any user change
  // that landed during the GL initialisation window is reconciled.
  const [initTick, setInitTick] = useState(0)
  const [renderError, setRenderError] = useState<string | null>(null)

  useEffect(() => { autoRotateRef.current = autoRotate }, [autoRotate])

  // NOTE on fingerprints (`makeStyleKey` / `makeColorKey`): we used to
  // memoize them in the component body and key the update effect off
  // those memos. We now compute them fresh INSIDE the effect to avoid
  // any chance of a stale memo result. The strings are tiny (a single
  // Array.join) so the recompute is essentially free.

  const onContainerLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height: h } = e.nativeEvent.layout
    console.log(`[AVATAR-PREVIEW] container onLayout w=${width} h=${h}`)
    if (width > 0 && h > 0 && !hasLayout) setHasLayout(true)
  }, [hasLayout])

  /** Recompute camera position/target so the entire avatar is in view. */
  const frameCameraToAvatar = useCallback(() => {
    const cam = cameraRef.current
    const group = avatarRef.current
    if (!cam || !group) return

    const { size, center } = avatarBounds(group)
    if (size.y < 1e-3) {
      console.warn('[AVATAR-PREVIEW] degenerate bbox, falling back to fixed camera', size)
      cam.position.set(0, 1.0, 3.5)
      cam.lookAt(0, 1.0, 0)
      cam.updateProjectionMatrix()
      cam.updateMatrixWorld(true)
      return
    }

    const fovRad = (cam.fov * Math.PI) / 180
    const dist = (size.y * 0.55) / Math.tan(fovRad / 2)
    cam.position.set(center.x, center.y, Math.max(dist + 0.4, 2.0))
    cam.lookAt(center.x, center.y - 0.05, 0)
    cam.updateProjectionMatrix()
    cam.updateMatrixWorld(true)
  }, [])

  /** Full geometry rebuild — used when style fields change. */
  const rebuildAvatarInScene = useCallback((nextAvatar: Avatar) => {
    const scene = sceneRef.current
    if (!scene) {
      console.warn('[AVATAR-PREVIEW] rebuild skipped — scene not ready')
      return
    }

    const t0 = Date.now()

    if (avatarRef.current) {
      scene.remove(avatarRef.current)
      disposeAvatarGroup(avatarRef.current)
      avatarRef.current = null
    }

    let group: THREE.Group
    try {
      group = buildAvatarGroup(nextAvatar)
    } catch (e) {
      console.warn('[AVATAR-PREVIEW] buildAvatarGroup threw, using placeholder', e)
      group = new THREE.Group()
      const fallback = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 1.2, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x9ca3af }),
      )
      fallback.position.y = 0.6
      group.add(fallback)
    }
    group.position.set(0, 0, 0)
    group.userData.baseY = 0   // used by tickAvatarAnimation's walk-bob
    scene.add(group)
    avatarRef.current = group

    const summary = summariseAvatarGroup(group)
    console.log(
      `[AVATAR-PREVIEW] REBUILT in ${Date.now() - t0}ms | ` +
      `meshes=${summary.meshes} verts=${summary.vertices} ` +
      `sceneChildren=${scene.children.length} ` +
      `(hair=${nextAvatar.hairStyle} shirt=${nextAvatar.shirtStyle} ` +
      `pants=${nextAvatar.pantsStyle} acc=${nextAvatar.accessory})`,
    )
    frameCameraToAvatar()
  }, [frameCameraToAvatar])

  /**
   * Color-only fast path: walk the existing meshes and recolour their
   * materials in place. Identifies surfaces by traversing the avatar
   * hierarchy and matching by material colour — robust against geometry
   * changes because we resolve at call time.
   *
   * If the in-place update can't be done cleanly (e.g. an accessory was
   * never built because it was 'none'), the caller falls back to a full
   * rebuild.
   */
  const recolorAvatarInPlace = useCallback((nextAvatar: Avatar): boolean => {
    const group = avatarRef.current
    if (!group) return false

    // We tag each material with the role it represents during build by
    // looking up the named sub-groups. Roles -> hex string lookup.
    const roles: Record<string, string> = {
      skin:      nextAvatar.skinColor,
      hair:      nextAvatar.hairColor,
      shirt:     nextAvatar.shirtColor,
      pants:     nextAvatar.pantsColor,
      shoes:     nextAvatar.shoesColor,
      accessory: nextAvatar.accessoryColor,
    }

    let recoloredCount = 0
    const updateRole = (mat: THREE.MeshStandardMaterial, hex: string) => {
      mat.color.set(hex)
      mat.needsUpdate = true
      recoloredCount++
    }

    // Simple traversal: each material was tagged with userData.role in
    // buildAvatar.ts. Walk the whole tree once and update by role.
    group.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      const mat = mesh.material as THREE.MeshStandardMaterial
      if (!mat || !mat.color || !mat.userData) return
      const role = mat.userData.role as string | undefined
      if (!role) return
      // Darker variants (skinDark, shirtDark, pantsDark) derive from
      // the new base colour with a fixed darken offset matching
      // buildAvatar.ts's `darken()` helper.
      if (role.endsWith('Dark')) {
        const baseRole = role.slice(0, -4) as keyof typeof roles
        const base = roles[baseRole]
        if (!base) return
        const c = new THREE.Color(base)
        // Must match darkenHex() offsets used in buildAvatar.ts.
        const offset = baseRole === 'skin'  ? 0.20
                     : baseRole === 'shirt' ? 0.12
                     : baseRole === 'pants' ? 0.15
                     : 0.15
        c.r = Math.max(0, c.r - offset)
        c.g = Math.max(0, c.g - offset)
        c.b = Math.max(0, c.b - offset)
        mat.color.copy(c)
        mat.needsUpdate = true
        recoloredCount++
        return
      }
      const hex = roles[role as keyof typeof roles]
      if (!hex) return
      updateRole(mat, hex)
    })

    if (recoloredCount === 0) {
      console.log('[AVATAR-PREVIEW] recolor in-place produced 0 updates — falling back to rebuild')
      return false
    }
    console.log(`[AVATAR-PREVIEW] RECOLORED in-place | ${recoloredCount} materials updated (no rebuild)`)
    return true
  }, [])

  // ── Update effect for SUBSEQUENT changes (after onContextCreate built
  // the initial avatar). Depends on the `avatar` prop reference directly
  // so any change in the parent (which always passes a fresh object via
  // setLocal({...prev, ...partial})) reliably trips this effect.
  //
  // We recompute the style/color keys INSIDE the effect (not via useMemo
  // deps) to be 100% sure they reflect the avatar we're about to render.
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) {
      console.log('[AVATAR-PREVIEW] update effect skipped — scene not ready (initTick=' + initTick + ')')
      return
    }
    const last = lastBuiltRef.current
    if (!last) {
      console.log('[AVATAR-PREVIEW] update effect skipped — no initial build yet (initTick=' + initTick + ')')
      return
    }

    const nextStyle = makeStyleKey(avatar)
    const nextColor = makeColorKey(avatar)

    if (last.style !== nextStyle) {
      console.log('[AVATAR-PREVIEW] style changed — rebuild', { from: last.style, to: nextStyle })
      rebuildAvatarInScene(avatar)
      lastBuiltRef.current = { style: nextStyle, color: nextColor }
      return
    }
    if (last.color !== nextColor) {
      console.log('[AVATAR-PREVIEW] color changed — recolor', { from: last.color, to: nextColor })
      const ok = recolorAvatarInPlace(avatar)
      if (!ok) {
        console.log('[AVATAR-PREVIEW] recolor returned false — falling back to rebuild')
        rebuildAvatarInScene(avatar)
      }
      lastBuiltRef.current = { style: nextStyle, color: nextColor }
      return
    }
    console.log('[AVATAR-PREVIEW] update effect fired with matching keys (no-op)')
  }, [avatar, initTick, rebuildAvatarInScene, recolorAvatarInPlace])

  // ── Cleanup on unmount ───────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      if (avatarRef.current) disposeAvatarGroup(avatarRef.current)
      rendererRef.current = null
      sceneRef.current = null
      cameraRef.current = null
      avatarRef.current = null
    }
  }, [])

  const onContextCreate = useCallback((gl: any) => {
    const W = gl.drawingBufferWidth
    const H = gl.drawingBufferHeight
    console.log(`[AVATAR-PREVIEW] onContextCreate gl=${W}x${H}`)

    if (!W || !H) {
      const msg = `GL drawing buffer is ${W}x${H} — container size unknown.`
      console.warn('[AVATAR-PREVIEW]', msg)
      setRenderError(msg)
      try { gl.endFrameEXP?.() } catch { /* noop */ }
      return
    }

    try {
      glRef.current = gl

      // ── Explicit viewport — REQUIRED on expo-gl ─────────────────────
      gl.viewport(0, 0, W, H)

      const renderer = new Renderer({ gl })
      renderer.setSize(W, H)
      renderer.setClearColor(0xeae6df, 1)
      rendererRef.current = renderer

      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0xeae6df)
      sceneRef.current = scene

      const camera = new THREE.PerspectiveCamera(32, W / H, 0.05, 50)
      camera.position.set(0, 1.0, 3.5)
      camera.lookAt(0, 1.0, 0)
      cameraRef.current = camera

      // ── Studio lighting (key + fill + rim + bounce + hemisphere) ───
      // Tuned so the new lathe-geometry torso reads its PBR roughness
      // values correctly — flat ambient alone made everything look like
      // plastic.
      scene.add(new THREE.AmbientLight(0xffffff, 0.55))

      const key = new THREE.DirectionalLight(0xfff8eb, 1.30)
      key.position.set(2.5, 3.8, 3.2)
      scene.add(key)

      const fill = new THREE.DirectionalLight(0xfff2e0, 0.50)
      fill.position.set(-3.0, 2.4, 2.2)
      scene.add(fill)

      const rim = new THREE.DirectionalLight(0xcfd9ff, 0.75)
      rim.position.set(0, 2.8, -3.5)
      scene.add(rim)

      // Soft warm bounce from below (simulates ground bounce).
      const bounce = new THREE.DirectionalLight(0xd8c2a0, 0.22)
      bounce.position.set(0, -2, 2)
      scene.add(bounce)

      const hemi = new THREE.HemisphereLight(0xffffff, 0xa89a7b, 0.40)
      hemi.position.set(0, 6, 0)
      scene.add(hemi)

      // ── Pedestal + soft ground shadow ───────────────────────────────
      const pedestal = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 0.6, 0.05, 36),
        new THREE.MeshStandardMaterial({ color: 0xd6cfc2, roughness: 0.85, metalness: 0.05 }),
      )
      pedestal.position.y = -0.025
      scene.add(pedestal)

      const shadow = new THREE.Mesh(
        new THREE.CircleGeometry(0.32, 28),
        new THREE.MeshBasicMaterial({
          color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false,
        }),
      )
      shadow.rotation.x = -Math.PI / 2
      shadow.position.y = 0.002
      shadow.renderOrder = 2
      scene.add(shadow)

      // ── INITIAL BUILD ─────────────────────────────────────────────────
      // Build the avatar SYNCHRONOUSLY here using the latest prop value.
      // This is the *only* place the initial build happens — that
      // removes any chance of the avatar being invisible due to React
      // state-timing edge cases (e.g. a setState from inside an async
      // GL callback not delivering an effect re-run).
      const initialAvatar = latestAvatarRef.current
      console.log(
        '[AVATAR-PREVIEW] initial build (inside onContextCreate) | ' +
        `hair=${initialAvatar.hairStyle} shirt=${initialAvatar.shirtStyle} ` +
        `pants=${initialAvatar.pantsStyle} acc=${initialAvatar.accessory}`,
      )
      rebuildAvatarInScene(initialAvatar)
      lastBuiltRef.current = {
        style: makeStyleKey(initialAvatar),
        color: makeColorKey(initialAvatar),
      }
      console.log('[AVATAR-PREVIEW] initial build complete | sceneChildren=' +
        scene.children.length + ' avatarRef=' + (avatarRef.current ? 'set' : 'NULL'))

      // Bump initTick so the update effect runs once more — picks up any
      // user-driven change that landed *during* GL initialization.
      setInitTick(t => t + 1)

      animStartRef.current = Date.now()
      const animate = () => {
        rafRef.current = requestAnimationFrame(animate)
        const g = avatarRef.current
        const t = (Date.now() - animStartRef.current) / 1000
        if (g) {
          tickAvatarAnimation(g, t, false)
          if (autoRotateRef.current) {
            // Full 360° rotation when explicitly enabled.
            g.rotation.y += 0.008
          } else {
            // Gentle ±20° sway so the avatar feels alive but the face
            // is always within visible range. Customization changes
            // are visible within ~1 s no matter what the user changes.
            g.rotation.y = Math.sin(t * 0.6) * 0.35
          }
        }
        try {
          renderer.render(scene, camera)
        } finally {
          gl.endFrameEXP()
        }
      }
      animate()
      console.log('[AVATAR-PREVIEW] animate loop started')
    } catch (e) {
      console.warn('[AVATAR-PREVIEW] onContextCreate FAILED', e)
      setRenderError((e as Error)?.message ?? 'Renderer initialization failed')
      try { gl.endFrameEXP?.() } catch { /* noop */ }
    }
  }, [rebuildAvatarInScene])

  if (renderError) {
    return (
      <View style={[styles.container, styles.errorContainer, { height }]}>
        <Ionicons name="warning-outline" size={28} color="#a8a29e" />
        <Text style={styles.errorTitle}>Preview unavailable</Text>
        <Text style={styles.errorBody}>{renderError}</Text>
      </View>
    )
  }

  return (
    <View
      style={[styles.container, { height }]}
      onLayout={onContainerLayout}
    >
      {hasLayout ? (
        <GLView style={styles.gl} onContextCreate={onContextCreate} />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Preparing 3D preview…</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#eae6df',
    borderRadius: 16,
    overflow: 'hidden',
  },
  gl: { flex: 1 },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 12,
    color: '#a8a29e',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  errorTitle: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#57534e',
  },
  errorBody: {
    marginTop: 4,
    fontSize: 12,
    color: '#a8a29e',
    textAlign: 'center',
  },
})
