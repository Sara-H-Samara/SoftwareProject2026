import * as THREE from 'three'
import type { Avatar } from '@/types/avatar'

// ─── Geometry cache ────────────────────────────────────────────────────────────
const GEO_CACHE = new Map<string, THREE.BufferGeometry>()
function geo<T extends THREE.BufferGeometry>(key: string, fn: () => T): T {
  if (!GEO_CACHE.has(key)) GEO_CACHE.set(key, fn())
  return GEO_CACHE.get(key) as T
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

function darken(hex: string, amt: number): THREE.ColorRepresentation {
  const c = new THREE.Color(hex)
  const h = { h: 0, s: 0, l: 0 }
  c.getHSL(h)
  return new THREE.Color().setHSL(h.h, h.s, Math.max(0, h.l - amt)).getHex()
}

function mat(
  p: ConstructorParameters<typeof THREE.MeshStandardMaterial>[0],
  role?: string,
): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial(p)
  if (role) m.userData = { role }
  return m
}

// ─── Proportions (Y-up, feet at y = 0, height ≈ 1.75 m) ─────────────────────
// Fixed from original: head too low, torso too short, arms too wide
const Y_GROUND   = 0.00
const Y_ANKLE    = 0.06
const Y_KNEE     = 0.46   // ankle + shin 0.40
const Y_HIP      = 0.87   // knee  + thigh 0.41
const Y_WAIST    = 1.00   // hip   + pelvis 0.13
const Y_SHOULDER = 1.50   // waist + torso 0.50
const Y_NECK     = 1.52
const Y_HEAD     = 1.67   // neck  + 0.09 + head radius 0.115 * 0.88

// ─── Materials ────────────────────────────────────────────────────────────────
interface M {
  skin: THREE.MeshStandardMaterial
  skinDark: THREE.MeshStandardMaterial
  hair: THREE.MeshStandardMaterial
  shirt: THREE.MeshStandardMaterial
  shirtDark: THREE.MeshStandardMaterial
  pants: THREE.MeshStandardMaterial
  pantsDark: THREE.MeshStandardMaterial
  shoes: THREE.MeshStandardMaterial
  accessory: THREE.MeshStandardMaterial
  eyeWhite: THREE.MeshStandardMaterial
  pupil: THREE.MeshStandardMaterial
}

function makeMats(av: Avatar): M {
  return {
    skin:      mat({ color: av.skinColor,             roughness: 0.60, metalness: 0.0 }, 'skin'),
    skinDark:  mat({ color: darken(av.skinColor, .12), roughness: 0.70, metalness: 0.0 }, 'skin'),
    hair:      mat({ color: av.hairColor,              roughness: 0.70, metalness: 0.0 }, 'hair'),
    shirt:     mat({ color: av.shirtColor,             roughness: 0.82, metalness: 0.0 }, 'shirt'),
    shirtDark: mat({ color: darken(av.shirtColor,.10), roughness: 0.82, metalness: 0.0 }, 'shirt'),
    pants:     mat({ color: av.pantsColor,             roughness: 0.82, metalness: 0.0 }, 'pants'),
    pantsDark: mat({ color: darken(av.pantsColor,.10), roughness: 0.82, metalness: 0.0 }, 'pants'),
    shoes:     mat({ color: av.shoesColor,             roughness: 0.45, metalness: 0.1 }, 'shoes'),
    accessory: mat({ color: av.accessoryColor,         roughness: 0.30, metalness: 0.3 }, 'accessory'),
    eyeWhite:  mat({ color: 0xf5f0e8,                 roughness: 0.10, metalness: 0.0 }),
    pupil:     mat({ color: 0x0a0608,                 roughness: 0.06, metalness: 0.0 }),
  }
}

// ─── Main builder ─────────────────────────────────────────────────────────────
export function buildAvatarGroup(avatar: Avatar): THREE.Group {
  const root = new THREE.Group()
  root.name  = 'avatar'
  const M    = makeMats(avatar)

  buildLegs(root, M, avatar)
  buildPelvis(root, M, avatar)
  buildTorso(root, M, avatar)
  buildArms(root, M, avatar)
  buildNeck(root, M)
  buildHead(root, M, avatar)

  root.scale.setScalar(Math.max(0.85, Math.min(1.15, avatar.height ?? 1.0)))
  return root
}

// ─── Pelvis ───────────────────────────────────────────────────────────────────
function buildPelvis(root: THREE.Group, M: M, avatar: Avatar) {
  // Lathe gives smooth organic hip-to-waist curve
  const pts = [
    new THREE.Vector2(0.00, Y_HIP),
    new THREE.Vector2(0.05, Y_HIP  + 0.02),
    new THREE.Vector2(0.10, Y_HIP  + 0.06),
    new THREE.Vector2(0.13, Y_HIP  + 0.10),
    new THREE.Vector2(0.14, Y_WAIST - 0.01),
    new THREE.Vector2(0.13, Y_WAIST),
  ]
  const g = new THREE.LatheGeometry(pts, 30)
  g.scale(1, 1, 0.78)   // flatten Z slightly — pelvis is not circular
  g.computeVertexNormals()
  root.add(new THREE.Mesh(g, M.pants))

  // Belt
 
}

// ─── Torso ────────────────────────────────────────────────────────────────────
function buildTorso(root: THREE.Group, M: M, avatar: Avatar) {
  const pivot = new THREE.Group()
  pivot.name  = 'torso'
  root.add(pivot)

  // Lathe profile: waist → chest → shoulder notch
  // Fixed: original profile was too narrow at chest (0.185 max → now 0.195)
  // and shoulder dip was too abrupt
  const pts = [
    new THREE.Vector2(0.130, Y_WAIST),
    new THREE.Vector2(0.138, Y_WAIST + 0.10),
    new THREE.Vector2(0.168, Y_WAIST + 0.22),
    new THREE.Vector2(0.195, Y_WAIST + 0.34),
    new THREE.Vector2(0.198, Y_WAIST + 0.42),
    new THREE.Vector2(0.185, Y_WAIST + 0.48),
    new THREE.Vector2(0.110, Y_SHOULDER + 0.005),
    new THREE.Vector2(0.058, Y_SHOULDER + 0.010),
  ]
  const g = new THREE.LatheGeometry(pts, 30)
  g.scale(1, 1, 0.72)
  g.computeVertexNormals()
  pivot.add(new THREE.Mesh(g, M.shirt))

  // Style details
  if (avatar.shirtStyle === 'hoodie' || avatar.shirtStyle === 'jacket') {
    const collar = new THREE.Mesh(
      geo('collar', () => new THREE.TorusGeometry(0.088, 0.016, 8, 22)),
      M.shirtDark,
    )
    collar.rotation.x = Math.PI / 2
    collar.position.set(0, Y_SHOULDER + 0.008, 0)
    collar.scale.set(1, 1, 0.80)
    pivot.add(collar)
  }

  if (avatar.shirtStyle === 'hoodie') {
    const hood = new THREE.Mesh(
      new THREE.SphereGeometry(0.155, 22, 18, 0, Math.PI * 2, 0, Math.PI / 1.65),
      M.shirt,
    )
    hood.position.set(0, Y_SHOULDER + 0.07, -0.055)
    hood.scale.set(1.02, 0.88, 1.08)
    pivot.add(hood)
  }

  if (avatar.shirtStyle === 'jacket') {
    // Zip line
    const zip = new THREE.Mesh(
      geo('zip', () => new THREE.CylinderGeometry(0.003, 0.003, 0.38, 6)),
      M.shirtDark,
    )
    zip.position.set(0, Y_WAIST + 0.19, 0.148)
    pivot.add(zip)
    // Lapels
    for (const s of [-1, 1] as const) {
      const lapel = new THREE.Mesh(
        geo('lapel', () => new THREE.BoxGeometry(0.048, 0.130, 0.016)),
        M.shirtDark,
      )
      lapel.position.set(s * 0.050, Y_WAIST + 0.38, 0.145)
      lapel.rotation.z = s * 0.20
      pivot.add(lapel)
    }
  }
}

// ─── Neck ─────────────────────────────────────────────────────────────────────
function buildNeck(root: THREE.Group, M: M) {
  const neck = new THREE.Mesh(
    geo('neck', () => new THREE.CylinderGeometry(0.040, 0.054, 0.092, 16)),
    M.skin,
  )
  neck.position.set(0, Y_NECK + 0.046, 0)
  neck.scale.set(1, 1, 0.88)
  root.add(neck)
}

// ─── Head ─────────────────────────────────────────────────────────────────────
function buildHead(root: THREE.Group, M: M, avatar: Avatar) {
  const pivot = new THREE.Group()
  pivot.name  = 'headPivot'
  pivot.position.set(0, Y_HEAD, 0)
  root.add(pivot)

  // Skull: slightly taller than wide, shallower than wide
  const skull = new THREE.Mesh(
    geo('skull', () => new THREE.SphereGeometry(0.115, 28, 22)),
    M.skin,
  )
  skull.scale.set(1.00, 1.06, 0.92)
  pivot.add(skull)

  // Ears
  for (const s of [-1, 1] as const) {
    const ear = new THREE.Mesh(
      geo('ear', () => new THREE.SphereGeometry(0.022, 12, 10)),
      M.skin,
    )
    ear.position.set(s * 0.112, 0, -0.004)
    ear.scale.set(0.46, 1.18, 0.62)
    pivot.add(ear)
  }

  // Eyes — white + pupil + tiny gloss dot
  for (const s of [-1, 1] as const) {
    const eg = new THREE.Group()
    eg.position.set(s * 0.040, 0.020, 0.104)
    pivot.add(eg)

    const white = new THREE.Mesh(
      geo('eye-white', () => new THREE.SphereGeometry(0.022, 16, 12)),
      M.eyeWhite,
    )
    white.scale.set(1, 0.78, 0.52)
    eg.add(white)

    const pupil = new THREE.Mesh(
      geo('pupil', () => new THREE.SphereGeometry(0.009, 10, 8)),
      M.pupil,
    )
    pupil.position.z = 0.012
    pupil.scale.z = 0.5
    eg.add(pupil)

    // Catch-light
    const gloss = new THREE.Mesh(
      geo('gloss', () => new THREE.SphereGeometry(0.004, 6, 5)),
      mat({ color: 0xffffff, roughness: 0.0, metalness: 0.0, transparent: true, opacity: 0.7 }),
    )
    gloss.position.set(s * -0.005, 0.007, 0.018)
    eg.add(gloss)

    // Eyelid shadow line
    const lid = new THREE.Mesh(
      geo('eyelid', () => new THREE.TorusGeometry(0.020, 0.004, 5, 18, Math.PI)),
      M.skinDark,
    )
    lid.position.set(0, 0.002, 0.012)
    lid.rotation.z = Math.PI
    lid.scale.set(1, 0.6, 0.38)
    eg.add(lid)
  }

  // Brows — thin arch using TubeGeometry for natural curve
  for (const s of [-1, 1] as const) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(s * -0.020, -0.001, 0),
      new THREE.Vector3(0,           0.005, 0),
      new THREE.Vector3(s *  0.020, -0.001, 0),
    ])
    const brow = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 8, 0.0042, 5, false),
      M.hair,
    )
    brow.position.set(s * 0.041, 0.056, 0.108)
    pivot.add(brow)
  }

  // Nose
  const nose = new THREE.Mesh(
    geo('nose', () => new THREE.SphereGeometry(0.013, 12, 10)),
    M.skin,
  )
  nose.position.set(0, -0.010, 0.112)
  nose.scale.set(0.88, 1.40, 0.85)
  pivot.add(nose)

  // Lips — upper tube + lower sphere
  const lipCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.028,  0.003, 0),
    new THREE.Vector3(-0.010,  0.007, 0),
    new THREE.Vector3( 0,      0.004, 0),
    new THREE.Vector3( 0.010,  0.007, 0),
    new THREE.Vector3( 0.028,  0.003, 0),
  ])
  const upperLip = new THREE.Mesh(
    new THREE.TubeGeometry(lipCurve, 12, 0.0046, 5, false),
    mat({ color: darken(avatar.skinColor, 0.10), roughness: 0.40, metalness: 0 }),
  )
  upperLip.position.set(0, -0.050, 0.108)
  pivot.add(upperLip)

  const lowerLip = new THREE.Mesh(
    geo('lower-lip', () => new THREE.SphereGeometry(0.016, 12, 8)),
    mat({ color: darken(avatar.skinColor, 0.08), roughness: 0.38, metalness: 0 }),
  )
  lowerLip.position.set(0, -0.060, 0.110)
  lowerLip.scale.set(1.50, 0.60, 0.48)
  pivot.add(lowerLip)

  // Hair
  if (avatar.hairStyle !== 'bald') {
    const hairG = buildHair(avatar.hairStyle, M.hair)
    hairG.name  = 'hair'
    pivot.add(hairG)
  }

  // Accessory
  if (avatar.accessory !== 'none') {
    const acc = buildAccessory(avatar.accessory, M, avatar)
    acc.name  = 'accessory'
    pivot.add(acc)
  }
}

// ─── Hair ─────────────────────────────────────────────────────────────────────
function buildHair(style: Avatar['hairStyle'], hair: THREE.MeshStandardMaterial): THREE.Group {
  const g = new THREE.Group()

  // Cap: partial sphere over top + sides + back
  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(0.122, 28, 22, Math.PI * 0.68, Math.PI * 1.64, 0, Math.PI * 0.72),
    hair,
  )
  cap.scale.set(1, 1.05, 0.94)
  g.add(cap)

  // Fringe (all styles except bald)
  const fringe = new THREE.Mesh(
    new THREE.BoxGeometry(0.170, 0.022, 0.040),
    hair,
  )
  fringe.position.set(0, 0.080, 0.098)
  fringe.rotation.x = -0.28
  g.add(fringe)

  if (style === 'long') {
    const drape = new THREE.Mesh(
      new THREE.CylinderGeometry(0.130, 0.095, 0.50, 20, 1, true),
      hair,
    )
    drape.position.set(0, -0.260, -0.055)
    drape.rotation.x = 0.08
    g.add(drape)
    for (const s of [-1, 1] as const) {
      const side = new THREE.Mesh(new THREE.BoxGeometry(0.040, 0.185, 0.028), hair)
      side.position.set(s * 0.112, -0.045, 0.055)
      side.rotation.z = s * 0.16
      g.add(side)
    }
  }

  if (style === 'curly') {
    const puffs: [number, number, number, number][] = [
      [  0.00,  0.088,  0.00, 0.046], [ 0.068,  0.078,  0.018, 0.042],
      [ -0.068, 0.078,  0.018, 0.042], [ 0.100,  0.055, -0.038, 0.040],
      [ -0.100, 0.055, -0.038, 0.040], [ 0.048,  0.086, -0.068, 0.043],
      [ -0.048, 0.086, -0.068, 0.043], [ 0.078,  0.036, -0.125, 0.043],
      [ -0.078, 0.036, -0.125, 0.043], [ 0.00,  -0.004, -0.142, 0.043],
    ]
    for (const [x, y, z, r] of puffs) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), hair)
      p.position.set(x, y, z)
      g.add(p)
    }
  }

  if (style === 'ponytail') {
    const band = new THREE.Mesh(
      geo('pt-band', () => new THREE.TorusGeometry(0.026, 0.009, 7, 16)),
      mat({ color: 0x111111, roughness: 0.70, metalness: 0 }),
    )
    band.position.set(0, -0.038, -0.112)
    band.rotation.x = Math.PI / 2.3
    g.add(band)

    const tail = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.032, 0.260, 3, 12),
      hair,
    )
    tail.position.set(0, -0.165, -0.195)
    tail.rotation.x = 0.52
    g.add(tail)
  }

  return g
}

// ─── Accessories ──────────────────────────────────────────────────────────────
function buildAccessory(style: Avatar['accessory'], M: M, avatar: Avatar): THREE.Group {
  const g    = new THREE.Group()
  const Y_UP = new THREE.Vector3(0, 1, 0)

  switch (style) {
    case 'glasses':
    case 'sunglasses': {
      const lensMat = style === 'sunglasses'
        ? mat({ color: 0x090a14, roughness: 0.08, metalness: 0.5, transparent: true, opacity: 0.80 })
        : mat({ color: 0xcce4f8, roughness: 0.04, metalness: 0.0, transparent: true, opacity: 0.18 })

      for (const s of [-1, 1] as const) {
        const rim = new THREE.Mesh(
          geo('g-rim', () => new THREE.TorusGeometry(0.032, 0.0044, 10, 26)),
          M.accessory,
        )
        rim.position.set(s * 0.040, 0.022, 0.128)
        g.add(rim)

        const lens = new THREE.Mesh(
          geo('g-lens', () => new THREE.CircleGeometry(0.029, 26)),
          lensMat,
        )
        lens.position.set(s * 0.040, 0.022, 0.129)
        g.add(lens)

        // Temple arm
        const from = new THREE.Vector3(s * 0.072, 0.022, 0.128)
        const to   = new THREE.Vector3(s * 0.112,  0.004, -0.002)
        const dir  = to.clone().sub(from).normalize()
        const len  = to.distanceTo(from)
        const arm  = new THREE.Mesh(
          new THREE.CylinderGeometry(0.004, 0.004, len, 6),
          M.accessory,
        )
        arm.position.copy(from).addScaledVector(dir, len / 2)
        arm.quaternion.setFromUnitVectors(Y_UP, dir)
        g.add(arm)
      }

      const bridge = new THREE.Mesh(
        geo('g-bridge', () => new THREE.CylinderGeometry(0.0040, 0.0040, 0.018, 6)),
        M.accessory,
      )
      bridge.rotation.z = Math.PI / 2
      bridge.position.set(0, 0.022, 0.128)
      g.add(bridge)
      break
    }

    case 'hat': {
      const bandMat = mat({ color: darken(avatar.accessoryColor, 0.18), roughness: 0.60, metalness: 0.05 })
      ;[
        [geo('hat-brim',  () => new THREE.CylinderGeometry(0.178, 0.178, 0.011, 32)), M.accessory, 0.082],
        [geo('hat-crown', () => new THREE.CylinderGeometry(0.106, 0.112, 0.128, 28)), M.accessory, 0.156],
        [geo('hat-top',   () => new THREE.CylinderGeometry(0.104, 0.106, 0.007, 28)), M.accessory, 0.226],
        [geo('hat-band',  () => new THREE.CylinderGeometry(0.113, 0.113, 0.015, 28)), bandMat,     0.093],
      ].forEach(([geom, mат, y]) => {
        const m = new THREE.Mesh(geom as THREE.BufferGeometry, mат as THREE.MeshStandardMaterial)
        m.position.y = y as number
        g.add(m)
      })
      break
    }

    case 'beanie': {
      const pom = new THREE.Mesh(
        geo('b-pom', () => new THREE.SphereGeometry(0.032, 14, 12)),
        mat({ color: darken(avatar.accessoryColor, -0.14), roughness: 0.90, metalness: 0 }),
      )
      pom.position.y = 0.195

      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.136, 26, 20, 0, Math.PI * 2, 0, Math.PI / 1.70),
        M.accessory,
      )
      cap.scale.set(1.04, 0.99, 1.06)
      cap.position.y = 0.016

      const cuff = new THREE.Mesh(
        geo('b-cuff', () => new THREE.CylinderGeometry(0.138, 0.138, 0.036, 26)),
        M.accessory,
      )
      cuff.position.y = 0.004

      g.add(cap, cuff, pom)
      break
    }

    case 'headphones': {
      const padMat = mat({ color: 0x141416, roughness: 0.88, metalness: 0 })
      const band   = new THREE.Mesh(
        geo('hp-band', () => new THREE.TorusGeometry(0.124, 0.013, 10, 34, Math.PI)),
        M.accessory,
      )
      band.position.set(0, 0.010, -0.004)
      g.add(band)

      for (const s of [-1, 1] as const) {
        const cup = new THREE.Mesh(
          geo('hp-cup', () => new THREE.SphereGeometry(0.050, 18, 14)),
          M.accessory,
        )
        cup.position.set(s * 0.124, 0.010, -0.004)
        cup.scale.set(1, 1.04, 0.60)
        g.add(cup)

        const pad = new THREE.Mesh(
          geo('hp-pad', () => new THREE.SphereGeometry(0.042, 14, 10)),
          padMat,
        )
        pad.position.set(s * 0.112, 0.010, -0.004)
        pad.scale.set(1, 0.94, 0.52)
        g.add(pad)
      }
      break
    }

    case 'earrings': {
      for (const s of [-1, 1] as const) {
        ;[
          [new THREE.SphereGeometry(0.011, 12, 10), s * 0.124, -0.022, 0.004],
          [new THREE.CylinderGeometry(.0022,.0022,.028,6), s * 0.124, -0.040, 0.004],
          [new THREE.SphereGeometry(0.010, 12, 10), s * 0.124, -0.058, 0.004],
        ].forEach(([geom, x, y, z]) => {
          const m = new THREE.Mesh(geom as THREE.BufferGeometry, M.accessory)
          m.position.set(x as number, y as number, z as number)
          g.add(m)
        })
      }
      break
    }

    case 'mask': {
      const mask = new THREE.Mesh(
        new THREE.SphereGeometry(0.124, 22, 16, Math.PI / 4.4, Math.PI / 2.2, 1.52, 0.88),
        M.accessory,
      )
      mask.position.set(0, 0, 0.018)
      g.add(mask)
      for (const s of [-1, 1] as const) {
        const loop = new THREE.Mesh(
          geo('mask-loop', () => new THREE.TorusGeometry(0.040, 0.0026, 6, 16)),
          M.accessory,
        )
        loop.position.set(s * 0.114, -0.016, -0.002)
        loop.rotation.y = Math.PI / 2
        g.add(loop)
      }
      break
    }
  }

  return g
}

// ─── Arms ─────────────────────────────────────────────────────────────────────
function buildArms(root: THREE.Group, M: M, avatar: Avatar) {
  for (const s of [-1, 1] as const) {
    const arm = buildArm(s, M, avatar.shirtStyle)
    arm.name  = s === -1 ? 'leftArm' : 'rightArm'
    root.add(arm)
  }
}

function buildArm(s: -1 | 1, M: M, style: Avatar['shirtStyle']): THREE.Group {
  // Fixed: original arms were too wide (0.155) making avatar look like a gorilla.
  // Shoulder X is now derived from torso lathe max-radius (0.198) * Z-scale (0.72) + gap.
  const pivot = new THREE.Group()
  pivot.position.set(s * 0.210, Y_SHOULDER, 0)

  const long    = style === 'hoodie' || style === 'jacket'
  const slvMat  = style === 'tank' ? M.skin : M.shirt
  const foreMat = long ? M.shirt : M.skin

  const UL = 0.265, UR = 0.048
  const FL = 0.240, FR = 0.038

  // Deltoid sphere bridges torso-to-arm gap
  const deltoid = new THREE.Mesh(
    geo('deltoid', () => new THREE.SphereGeometry(0.060, 14, 10)),
    slvMat,
  )
  deltoid.scale.set(0.90, 0.82, 0.75)
  pivot.add(deltoid)

  const ua = new THREE.Mesh(
    geo('upper-arm', () => new THREE.CapsuleGeometry(UR, UL - UR * 2, 4, 12)),
    slvMat,
  )
  ua.position.y = -UL / 2
  pivot.add(ua)

  const elbow = new THREE.Mesh(
    geo('elbow', () => new THREE.SphereGeometry(0.048, 12, 10)),
    long ? M.shirt : M.skin,
  )
  elbow.position.y = -UL
  pivot.add(elbow)

  const fa = new THREE.Mesh(
    geo('fore-arm', () => new THREE.CapsuleGeometry(FR, FL - FR * 2, 4, 12)),
    foreMat,
  )
  fa.position.y = -(UL + FL / 2)
  pivot.add(fa)

  if (long) {
    const cuff = new THREE.Mesh(
      geo('cuff', () => new THREE.CylinderGeometry(FR + 0.004, FR + 0.002, 0.020, 12)),
      M.shirtDark,
    )
    cuff.position.y = -(UL + FL - 0.012)
    pivot.add(cuff)
  }

  const wrist = new THREE.Mesh(
    geo('wrist', () => new THREE.SphereGeometry(0.038, 10, 8)),
    M.skin,
  )
  wrist.position.y = -(UL + FL)
  pivot.add(wrist)

  // Hand — palm + 4 fingers + thumb
  const hand = new THREE.Group()
  hand.position.y = -(UL + FL + 0.048)
  pivot.add(hand)

  hand.add(new THREE.Mesh(geo('palm', () => new THREE.BoxGeometry(0.054, 0.056, 0.022)), M.skin))

  for (let i = 0; i < 4; i++) {
    const f = new THREE.Mesh(
      geo(`f${i}`, () => new THREE.CapsuleGeometry(0.0068, 0.032, 3, 6)),
      M.skin,
    )
    f.position.set(-0.016 + i * 0.011, -0.048, 0)
    hand.add(f)
  }

  const thumb = new THREE.Mesh(
    geo('thumb', () => new THREE.CapsuleGeometry(0.0072, 0.022, 3, 6)),
    M.skin,
  )
  thumb.position.set(s * 0.030, -0.018, 0.005)
  thumb.rotation.z = s * 0.82
  hand.add(thumb)

  return pivot
}

// ─── Legs ─────────────────────────────────────────────────────────────────────
function buildLegs(root: THREE.Group, M: M, avatar: Avatar) {
  for (const s of [-1, 1] as const) {
    const leg = buildLeg(s, M, avatar.pantsStyle)
    leg.name  = s === -1 ? 'leftLeg' : 'rightLeg'
    root.add(leg)
  }

  if (avatar.pantsStyle === 'skirt') {
    const skirt = new THREE.Mesh(
      new THREE.ConeGeometry(0.215, 0.310, 24, 1, true),
      mat({ color: avatar.pantsColor, roughness: 0.80, metalness: 0, side: THREE.DoubleSide }, 'pants'),
    )
    skirt.position.set(0, Y_HIP + 0.035, 0)
    skirt.scale.set(1, 1, 0.80)
    root.add(skirt)
  }
}

function buildLeg(s: -1 | 1, M: M, style: Avatar['pantsStyle']): THREE.Group {
  const pivot = new THREE.Group()
  // Fixed: original X offset 0.072 made legs too close together.
  pivot.position.set(s * 0.076, Y_KNEE, 0)

  const TL = 0.410, TR = 0.068
  const SL = 0.400, SR = 0.052

  const withPants  = style === 'pants' || style === 'shorts'
  const fullPants  = style === 'pants'
  const hipMat     = style === 'skirt' ? M.skin : M.pants
  const thighMat   = withPants ? M.pants : M.skin
  const kneeMat    = fullPants ? M.pants : M.skin
  const shinMat    = fullPants ? M.pants : M.skin

  // Hip sphere
  const hip = new THREE.Mesh(geo('hip', () => new THREE.SphereGeometry(0.080, 14, 10)), hipMat)
  hip.position.set(0, TL, 0)
  pivot.add(hip)

  const thigh = new THREE.Mesh(
    geo('thigh', () => new THREE.CapsuleGeometry(TR, TL - TR * 2, 4, 12)),
    thighMat,
  )
  thigh.position.y = TL / 2
  pivot.add(thigh)

  const knee = new THREE.Mesh(
    geo('knee', () => new THREE.SphereGeometry(0.064, 12, 10)),
    kneeMat,
  )
  pivot.add(knee)

  const shin = new THREE.Mesh(
    geo('shin', () => new THREE.CapsuleGeometry(SR, SL - SR * 2, 4, 12)),
    shinMat,
  )
  shin.position.y = -SL / 2
  pivot.add(shin)

  if (fullPants) {
    const cuff = new THREE.Mesh(
      geo('p-cuff', () => new THREE.CylinderGeometry(SR + 0.005, SR + 0.002, 0.022, 12)),
      M.pantsDark,
    )
    cuff.position.y = -(SL - 0.013)
    pivot.add(cuff)
  }

  const ankle = new THREE.Mesh(
    geo('ankle', () => new THREE.SphereGeometry(0.040, 10, 8)),
    M.skin,
  )
  ankle.position.y = -SL
  pivot.add(ankle)

  // Foot + shoe
  const foot = new THREE.Group()
  foot.position.set(0, -SL - 0.130, 0.036)
  pivot.add(foot)

  // Rounded shoe: sole (box) + upper (box) + toe cap (flattened sphere)
  const sole = new THREE.Mesh(geo('sole',  () => new THREE.BoxGeometry(0.090, 0.018, 0.190)), M.shoes)
  const upper = new THREE.Mesh(geo('s-up', () => new THREE.BoxGeometry(0.078, 0.050, 0.152)), M.shoes)
  const toe   = new THREE.Mesh(geo('toe',  () => new THREE.SphereGeometry(0.048, 12, 10)),    M.shoes)
  sole.position.set( 0, -0.009, 0)
  upper.position.set(0,  0.020, -0.009)
  toe.position.set(  0,  0.004,  0.075)
  toe.scale.set(0.90, 0.50, 0.76)
  foot.add(sole, upper, toe)

  return pivot
}

// ─── Animation ────────────────────────────────────────────────────────────────
export function tickAvatarAnimation(
  group: THREE.Group, time: number, isWalking: boolean,
): void {
  const torso = group.getObjectByName('torso')
  const head  = group.getObjectByName('headPivot')
  const lArm  = group.getObjectByName('leftArm')
  const rArm  = group.getObjectByName('rightArm')
  const lLeg  = group.getObjectByName('leftLeg')
  const rLeg  = group.getObjectByName('rightLeg')

  if (isWalking) {
    const sw = Math.sin(time * 5.8)
    if (lLeg)  lLeg.rotation.x  =  sw * 0.44
    if (rLeg)  rLeg.rotation.x  = -sw * 0.44
    if (lArm)  lArm.rotation.x  = -sw * 0.28
    if (rArm)  rArm.rotation.x  =  sw * 0.28
    if (torso) torso.rotation.z  =  sw * 0.022  // natural torso counter-rotation
    group.position.y = (group.userData.baseY ?? 0) + Math.abs(Math.sin(time * 5.8)) * 0.018
  } else {
    const d = 0.14
    if (lLeg)  lLeg.rotation.x  = lerp(lLeg.rotation.x,  0, d)
    if (rLeg)  rLeg.rotation.x  = lerp(rLeg.rotation.x,  0, d)
    if (lArm)  lArm.rotation.x  = lerp(lArm.rotation.x,  0, d)
    if (rArm)  rArm.rotation.x  = lerp(rArm.rotation.x,  0, d)
    if (torso) torso.rotation.z  = lerp((torso as any).rotation.z, 0, d)
    // Breathing
    if (torso) torso.scale.set(1, 1 + Math.sin(time * 1.5) * 0.007, 1)
    // Idle head micro-movement
    if (head)  head.rotation.y = Math.sin(time * 0.52) * 0.030
    group.position.y = lerp(group.position.y, group.userData.baseY ?? 0, 0.10)
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────
export function summariseAvatarGroup(g: THREE.Group) {
  let meshes = 0, verts = 0
  g.traverse(o => {
    const m = o as THREE.Mesh
    if (!m.isMesh) return
    meshes++
    verts += m.geometry?.getAttribute('position')?.count ?? 0
  })
  return { meshes, verts }
}

export function avatarBounds(g: THREE.Group) {
  g.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(g)
  return { size: box.getSize(new THREE.Vector3()), center: box.getCenter(new THREE.Vector3()) }
}

export function disposeAvatarGroup(group: THREE.Group): void {
  group.traverse(obj => {
    const m = obj as THREE.Mesh
    if (m.geometry && !GEO_CACHE.has(m.geometry.uuid)) m.geometry.dispose()
    const mat = m.material as THREE.Material | THREE.Material[] | undefined
    if (Array.isArray(mat)) mat.forEach(x => x.dispose())
    else mat?.dispose()
  })
}

export function clearGeometryCache(): void {
  GEO_CACHE.forEach(g => g.dispose())
  GEO_CACHE.clear()
}

export const DEFAULT_AVATAR: Avatar = {
  id:             '',
  userId:         '',
  skinColor:      '#D4956A',
  height:         1.0,
  hairStyle:      'short',
  hairColor:      '#2E1F14',
  shirtStyle:     'tshirt',
  shirtColor:     '#3A6CB0',
  pantsStyle:     'pants',
  pantsColor:     '#2B2B32',
  shoesColor:     '#0E0E12',
  accessory:      'none',
  accessoryColor: '#888888',
  updatedAt:      new Date().toISOString(),
}