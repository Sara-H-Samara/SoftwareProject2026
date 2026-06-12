import * as THREE from 'three'
import type { Avatar } from '@/types'

/**
 * Procedural humanoid avatar builder (Y-up, ~1.75 m, feet at y=0).
 *
 * Lathe torso/pelvis, capsule limbs, joint sphere fillers, and a
 * face-cutout hair shell keep the silhouette continuous from every angle.
 */

interface MatBundle {
  skin:      THREE.MeshStandardMaterial
  skinDark:  THREE.MeshStandardMaterial
  hair:      THREE.MeshStandardMaterial
  shirt:     THREE.MeshStandardMaterial
  shirtDark: THREE.MeshStandardMaterial
  pants:     THREE.MeshStandardMaterial
  pantsDark: THREE.MeshStandardMaterial
  shoes:     THREE.MeshStandardMaterial
  accessory: THREE.MeshStandardMaterial
  eyeWhite:  THREE.MeshStandardMaterial
  pupil:     THREE.MeshStandardMaterial
  mouth:     THREE.MeshStandardMaterial
}

/** Tag materials for AvatarPreview3D in-place recoloring. */
function withRole(m: THREE.MeshStandardMaterial, role: string): THREE.MeshStandardMaterial {
  m.userData = { ...(m.userData ?? {}), role }
  return m
}

function darkenHex(hex: string, amount: number): number {
  const c = new THREE.Color(hex)
  c.r = Math.max(0, c.r - amount)
  c.g = Math.max(0, c.g - amount)
  c.b = Math.max(0, c.b - amount)
  return c.getHex()
}

function makeMaterials(avatar: Avatar): MatBundle {
  return {
    skin:      withRole(new THREE.MeshStandardMaterial({ color: avatar.skinColor,     roughness: 0.55, metalness: 0.02 }), 'skin'),
    skinDark:  withRole(new THREE.MeshStandardMaterial({ color: darkenHex(avatar.skinColor, 0.20), roughness: 0.65, metalness: 0.0 }), 'skinDark'),
    hair:      withRole(new THREE.MeshStandardMaterial({ color: avatar.hairColor,     roughness: 0.65, metalness: 0.06 }), 'hair'),
    shirt:     withRole(new THREE.MeshStandardMaterial({ color: avatar.shirtColor,    roughness: 0.82, metalness: 0.0 }), 'shirt'),
    shirtDark: withRole(new THREE.MeshStandardMaterial({ color: darkenHex(avatar.shirtColor, 0.12), roughness: 0.82, metalness: 0.0 }), 'shirtDark'),
    pants:     withRole(new THREE.MeshStandardMaterial({ color: avatar.pantsColor,    roughness: 0.80, metalness: 0.0 }), 'pants'),
    pantsDark: withRole(new THREE.MeshStandardMaterial({ color: darkenHex(avatar.pantsColor, 0.15), roughness: 0.80, metalness: 0.0 }), 'pantsDark'),
    shoes:     withRole(new THREE.MeshStandardMaterial({ color: avatar.shoesColor,    roughness: 0.35, metalness: 0.15 }), 'shoes'),
    accessory: withRole(new THREE.MeshStandardMaterial({ color: avatar.accessoryColor, roughness: 0.30, metalness: 0.30 }), 'accessory'),
    eyeWhite:  new THREE.MeshStandardMaterial({ color: 0xfaf6ef, roughness: 0.12, metalness: 0.0 }),
    pupil:     new THREE.MeshStandardMaterial({ color: 0x0a0608, roughness: 0.08, metalness: 0.0 }),
    mouth:     new THREE.MeshStandardMaterial({ color: 0x8a3d3a, roughness: 0.55, metalness: 0.0 }),
  }
}

const TORSO_Z_SCALE = 0.72
const HEAD_Y_SCALE  = 1.05
const HEAD_Z_SCALE  = 0.96

export function buildAvatarGroup(avatar: Avatar): THREE.Group {
  const group = new THREE.Group()
  group.name = 'avatar'
  const M = makeMaterials(avatar)

  // ── Pelvis (lathe, closed crotch) ────────────────────────────────────
  const pelvisProfile = [
    new THREE.Vector2(0.00, 0.72),
    new THREE.Vector2(0.04, 0.76),
    new THREE.Vector2(0.09, 0.82),
    new THREE.Vector2(0.130, 0.88),
    new THREE.Vector2(0.150, 0.95),
    new THREE.Vector2(0.150, 1.05),
    new THREE.Vector2(0.142, 1.09),
  ]
  const pelvisGeom = new THREE.LatheGeometry(pelvisProfile, 28)
  pelvisGeom.scale(1.0, 1.0, TORSO_Z_SCALE)
  pelvisGeom.computeVertexNormals()
  const pelvis = new THREE.Mesh(pelvisGeom, M.pants)
  pelvis.name = 'pelvis'
  group.add(pelvis)

  // ── Shirt torso (lathe, breathing pivot) ─────────────────────────────
  const torsoPivot = new THREE.Group()
  torsoPivot.name = 'torso'
  group.add(torsoPivot)

  const shirtProfile = [
    new THREE.Vector2(0.138, 1.08),
    new THREE.Vector2(0.135, 1.18),
    new THREE.Vector2(0.150, 1.28),
    new THREE.Vector2(0.185, 1.38),
    new THREE.Vector2(0.190, 1.42),
    new THREE.Vector2(0.170, 1.46),
    new THREE.Vector2(0.105, 1.485),
    new THREE.Vector2(0.062, 1.50),
  ]
  const shirtGeom = new THREE.LatheGeometry(shirtProfile, 28)
  shirtGeom.scale(1.0, 1.0, TORSO_Z_SCALE)
  shirtGeom.computeVertexNormals()
  torsoPivot.add(new THREE.Mesh(shirtGeom, M.shirt))

  if (avatar.pantsStyle !== 'skirt') {
    const beltMat = new THREE.MeshStandardMaterial({ color: 0x1f140f, roughness: 0.5, metalness: 0.15 })
    const belt = new THREE.Mesh(new THREE.TorusGeometry(0.142, 0.012, 8, 28), beltMat)
    belt.position.y = 1.09
    belt.rotation.x = Math.PI / 2
    belt.scale.set(1, 1, TORSO_Z_SCALE + 0.04)
    group.add(belt)
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.024, 0.008), beltMat)
    buckle.position.set(0, 1.09, 0.125)
    group.add(buckle)
  }

  if (avatar.shirtStyle === 'jacket' || avatar.shirtStyle === 'hoodie') {
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.018, 8, 22), M.shirtDark)
    collar.position.y = 1.485
    collar.rotation.x = Math.PI / 2
    collar.scale.set(1, 1, TORSO_Z_SCALE + 0.08)
    group.add(collar)

    if (avatar.shirtStyle === 'hoodie') {
      const hood = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 22, 18, 0, Math.PI * 2, 0, Math.PI / 1.6),
        M.shirt,
      )
      hood.position.set(0, 1.56, -0.06)
      hood.scale.set(1.0, 0.85, 1.05)
      group.add(hood)
    }
  }

  if (avatar.shirtStyle === 'jacket') {
    const zip = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.36, 0.004), M.shirtDark)
    zip.position.set(0, 1.27, 0.150)
    torsoPivot.add(zip)
  }

  // ── Neck ─────────────────────────────────────────────────────────────
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.048, 0.062, 0.12, 18),
    M.skin,
  )
  neck.position.y = 1.49
  neck.scale.set(1, 1, TORSO_Z_SCALE + 0.10)
  group.add(neck)

  // ── Head ─────────────────────────────────────────────────────────────
  const headPivot = new THREE.Group()
  headPivot.name = 'headPivot'
  headPivot.position.set(0, 1.65, 0)
  group.add(headPivot)

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.122, 32, 26), M.skin)
  skull.name = 'head'
  skull.scale.set(1.0, HEAD_Y_SCALE, HEAD_Z_SCALE)
  headPivot.add(skull)

  for (const sign of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.024, 14, 12), M.skin)
    ear.position.set(sign * 0.118, 0.0, -0.005)
    ear.scale.set(0.5, 1.2, 0.7)
    headPivot.add(ear)
    const inner = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8), M.skinDark)
    inner.position.set(sign * 0.124, 0.0, 0.0)
    inner.scale.set(0.40, 1.0, 0.5)
    headPivot.add(inner)
  }

  // Face (+Z). Eyes at z=0.115.
  for (const sign of [-1, 1]) {
    const eye = new THREE.Group()
    eye.position.set(sign * 0.041, 0.022, 0.115)
    headPivot.add(eye)

    const white = new THREE.Mesh(new THREE.SphereGeometry(0.024, 18, 14), M.eyeWhite)
    white.scale.set(1.0, 0.80, 0.55)
    eye.add(white)

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.0085, 12, 10), M.pupil)
    pupil.position.set(0, -0.001, 0.013)
    pupil.scale.set(1, 1, 0.6)
    eye.add(pupil)
  }

  for (const sign of [-1, 1]) {
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.008, 0.010), M.hair)
    brow.position.set(sign * 0.044, 0.058, 0.116)
    brow.rotation.z = sign * 0.10
    headPivot.add(brow)
  }

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.014, 14, 12), M.skin)
  nose.position.set(0, -0.012, 0.122)
  nose.scale.set(0.85, 1.4, 0.95)
  headPivot.add(nose)

  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.005, 0.008), M.mouth)
  mouth.position.set(0, -0.055, 0.117)
  headPivot.add(mouth)
  const lowerLip = new THREE.Mesh(new THREE.BoxGeometry(0.040, 0.011, 0.010), M.skin)
  lowerLip.position.set(0, -0.064, 0.117)
  headPivot.add(lowerLip)

  if (avatar.hairStyle !== 'bald') {
    const hair = buildHair(avatar.hairStyle, M.hair)
    hair.name = 'hair'
    headPivot.add(hair)
  }

  if (avatar.accessory !== 'none') {
    const accessory = buildAccessory(avatar.accessory, M, avatar)
    accessory.name = 'accessory'
    headPivot.add(accessory)
  }

  // ── Limbs ────────────────────────────────────────────────────────────
  const leftArm  = buildArm(-1, M, avatar.shirtStyle); leftArm.name  = 'leftArm';  group.add(leftArm)
  const rightArm = buildArm( 1, M, avatar.shirtStyle); rightArm.name = 'rightArm'; group.add(rightArm)
  const leftLeg  = buildLeg(-1, M, avatar.pantsStyle); leftLeg.name  = 'leftLeg';  group.add(leftLeg)
  const rightLeg = buildLeg( 1, M, avatar.pantsStyle); rightLeg.name = 'rightLeg'; group.add(rightLeg)

  if (avatar.pantsStyle === 'skirt') {
    const skirtMat = withRole(
      new THREE.MeshStandardMaterial({
        color: avatar.pantsColor, roughness: 0.80, metalness: 0.0, side: THREE.DoubleSide,
      }),
      'pants',
    )
    const skirt = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.32, 24, 1, true), skirtMat)
    skirt.position.set(0, 0.88, 0)
    skirt.scale.set(1, 1, TORSO_Z_SCALE + 0.06)
    group.add(skirt)
  }

  const userScale = Math.max(0.85, Math.min(1.15, avatar.height || 1.0))
  group.scale.setScalar(userScale)

  return group
}

// ── Hair (288° shell + style extras) ───────────────────────────────────

function buildHair(style: Avatar['hairStyle'], material: THREE.Material): THREE.Object3D {
  const node = new THREE.Group()

  const makeBase = (extraScaleY = 1.05) => {
    const geom = new THREE.SphereGeometry(
      0.130, 30, 24,
      Math.PI * 0.70,
      Math.PI * 1.60,
      0,
      Math.PI * 0.78,
    )
    const mesh = new THREE.Mesh(geom, material)
    mesh.scale.set(1.0, extraScaleY, HEAD_Z_SCALE + 0.02)
    return mesh
  }

  const makeBangs = (height = 0.025) => {
    const bang = new THREE.Mesh(new THREE.BoxGeometry(0.18, height, 0.045), material)
    bang.position.set(0, 0.082, 0.106)
    bang.rotation.x = -0.30
    return bang
  }

  switch (style) {
    case 'short':
      node.add(makeBase(1.04), makeBangs(0.022))
      break
    case 'long': {
      node.add(makeBase(1.06), makeBangs(0.026))
      const drape = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.105, 0.55, 22, 1, true),
        material,
      )
      drape.position.set(0, -0.28, -0.06)
      drape.rotation.x = 0.08
      node.add(drape)
      ;[-1, 1].forEach((sign) => {
        const side = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.20, 0.03), material)
        side.position.set(sign * 0.115, -0.05, 0.06)
        side.rotation.z = sign * 0.18
        side.rotation.y = sign * -0.10
        node.add(side)
      })
      break
    }
    case 'curly': {
      node.add(makeBase(1.05))
      const puffs: Array<[number, number, number, number]> = [
        [ 0.00, 0.090,  0.00, 0.048],
        [ 0.07, 0.080,  0.02, 0.044],
        [-0.07, 0.080,  0.02, 0.044],
        [ 0.10, 0.060, -0.04, 0.040],
        [-0.10, 0.060, -0.04, 0.040],
        [ 0.05, 0.090, -0.07, 0.044],
        [-0.05, 0.090, -0.07, 0.044],
        [ 0.08, 0.040, -0.13, 0.045],
        [-0.08, 0.040, -0.13, 0.045],
        [ 0.00, 0.000, -0.15, 0.045],
      ]
      puffs.forEach(([x, y, z, r]) => {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), material)
        puff.position.set(x, y, z)
        node.add(puff)
      })
      break
    }
    case 'ponytail': {
      node.add(makeBase(1.04), makeBangs(0.025))
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.010, 8, 14), material)
      band.position.set(0, -0.04, -0.12)
      band.rotation.x = Math.PI / 2.4
      node.add(band)
      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.022, 0.32, 16), material)
      tail.position.set(0, -0.17, -0.20)
      tail.rotation.x = 0.50
      node.add(tail)
      break
    }
  }

  return node
}

// ── Accessories ──────────────────────────────────────────────────────────

function buildAccessory(style: Avatar['accessory'], M: MatBundle, avatar: Avatar): THREE.Object3D {
  const node = new THREE.Group()

  switch (style) {
    case 'glasses':
    case 'sunglasses': {
      const frameMat = M.accessory
      const lensMat = style === 'sunglasses'
        ? new THREE.MeshStandardMaterial({
            color: 0x0a0a14, roughness: 0.10, metalness: 0.5,
            transparent: true, opacity: 0.82,
          })
        : null
      const ringGeom = new THREE.TorusGeometry(0.034, 0.005, 12, 24)
      const ringPosFor = (sign: number) => new THREE.Vector3(sign * 0.041, 0.024, 0.137)
      const earPosFor  = (sign: number) => new THREE.Vector3(sign * 0.118, 0.005, -0.002)

      ;[-1, 1].forEach((sign) => {
        const ring = new THREE.Mesh(ringGeom, frameMat)
        ring.position.copy(ringPosFor(sign))
        node.add(ring)
        if (lensMat) {
          const lens = new THREE.Mesh(new THREE.CircleGeometry(0.031, 22), lensMat)
          lens.position.copy(ringPosFor(sign)).z += 0.001
          node.add(lens)
        }
      })

      const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.020, 8), frameMat)
      bridge.rotation.z = Math.PI / 2
      bridge.position.set(0, 0.024, 0.137)
      node.add(bridge)

      const yUnit = new THREE.Vector3(0, 1, 0)
      ;[-1, 1].forEach((sign) => {
        const from = ringPosFor(sign)
        const to   = earPosFor(sign)
        const dir  = new THREE.Vector3().subVectors(to, from)
        const len  = dir.length()
        dir.normalize()
        const temple = new THREE.Mesh(
          new THREE.CylinderGeometry(0.0045, 0.0045, len, 8),
          frameMat,
        )
        temple.position.copy(from).addScaledVector(dir, len / 2)
        temple.quaternion.setFromUnitVectors(yUnit, dir)
        node.add(temple)
      })
      break
    }
    case 'hat': {
      const brim  = new THREE.Mesh(new THREE.CylinderGeometry(0.180, 0.180, 0.012, 32), M.accessory)
      brim.position.y = 0.084
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.108, 0.114, 0.130, 28), M.accessory)
      crown.position.y = 0.160
      const top   = new THREE.Mesh(new THREE.CylinderGeometry(0.106, 0.108, 0.008, 28), M.accessory)
      top.position.y  = 0.230
      const bandMat = new THREE.MeshStandardMaterial({
        color: darkenHex(avatar.accessoryColor, 0.20), roughness: 0.6, metalness: 0.05,
      })
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.016, 28), bandMat)
      band.position.y = 0.095
      node.add(brim, crown, top, band)
      break
    }
    case 'beanie': {
      const beanie = new THREE.Mesh(
        new THREE.SphereGeometry(0.140, 28, 22, 0, Math.PI * 2, 0, Math.PI / 1.7),
        M.accessory,
      )
      beanie.scale.set(1.04, 1.0, 1.06)
      beanie.position.y = 0.018
      node.add(beanie)
      const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.140, 0.140, 0.038, 28), M.accessory)
      cuff.position.y = 0.005
      node.add(cuff)
      const pomMat = new THREE.MeshStandardMaterial({
        color: darkenHex(avatar.accessoryColor, -0.15), roughness: 0.9, metalness: 0.0,
      })
      const pom = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 14), pomMat)
      pom.position.set(0, 0.20, 0)
      node.add(pom)
      break
    }
    case 'headphones': {
      const BAND_R = 0.128
      const CUP_Y  = 0.012
      const CUP_Z  = -0.005
      const CUP_X  = 0.128

      const band = new THREE.Mesh(
        new THREE.TorusGeometry(BAND_R, 0.014, 12, 36, Math.PI),
        M.accessory,
      )
      band.position.set(0, CUP_Y, CUP_Z)
      node.add(band)

      const cupGeom = new THREE.SphereGeometry(0.052, 20, 16)
      const padMat = new THREE.MeshStandardMaterial({ color: 0x18181a, roughness: 0.85, metalness: 0.0 })
      ;[-1, 1].forEach((sign) => {
        const cup = new THREE.Mesh(cupGeom, M.accessory)
        cup.position.set(sign * CUP_X, CUP_Y, CUP_Z)
        cup.scale.set(1.0, 1.05, 0.62)
        node.add(cup)
        const pad = new THREE.Mesh(new THREE.SphereGeometry(0.044, 16, 12), padMat)
        pad.position.set(sign * (CUP_X - 0.012), CUP_Y, CUP_Z)
        pad.scale.set(1.0, 0.95, 0.55)
        node.add(pad)
      })
      break
    }
    case 'earrings': {
      ;[-1, 1].forEach((sign) => {
        const stud = new THREE.Mesh(new THREE.SphereGeometry(0.012, 14, 12), M.accessory)
        stud.position.set(sign * 0.128, -0.024, 0.005)
        node.add(stud)
        const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.030, 8), M.accessory)
        chain.position.set(sign * 0.128, -0.044, 0.005)
        node.add(chain)
        const drop = new THREE.Mesh(new THREE.SphereGeometry(0.011, 14, 12), M.accessory)
        drop.position.set(sign * 0.128, -0.064, 0.005)
        node.add(drop)
      })
      break
    }
    case 'mask': {
      const mask = new THREE.Mesh(
        new THREE.SphereGeometry(
          0.128, 24, 18,
          Math.PI / 4.5, Math.PI / 2.25,
          1.55, 0.85,
        ),
        M.accessory,
      )
      mask.position.set(0, 0, 0.020)
      node.add(mask)
      ;[-1, 1].forEach((sign) => {
        const loop = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.003, 6, 18), M.accessory)
        loop.position.set(sign * 0.118, -0.018, -0.002)
        loop.rotation.y = Math.PI / 2
        node.add(loop)
      })
      break
    }
  }

  return node
}

// ── Arm (shoulder pivot, capsule segments, joint fillers) ────────────────

function buildArm(sign: number, M: MatBundle, shirtStyle: Avatar['shirtStyle']): THREE.Group {
  const pivot = new THREE.Group()
  pivot.position.set(sign * 0.155, 1.42, 0)

  const longSleeve = shirtStyle === 'hoodie' || shirtStyle === 'jacket'
  const upperLen   = 0.28
  const forearmLen = 0.27
  const upperR     = 0.055
  const forearmR   = 0.048

  const shoulderMat = shirtStyle === 'tank' ? M.skin : M.shirt
  const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.064, 16, 12), shoulderMat)
  pivot.add(shoulder)

  const upperMat = shirtStyle === 'tank' ? M.skin : M.shirt
  const upper = new THREE.Mesh(
    new THREE.CapsuleGeometry(upperR, Math.max(0.05, upperLen - 2 * upperR), 4, 14),
    upperMat,
  )
  upper.position.set(0, -upperLen / 2, 0)
  pivot.add(upper)

  const elbowMat = longSleeve ? M.shirt : M.skin
  const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.053, 14, 12), elbowMat)
  elbow.position.set(0, -upperLen, 0)
  pivot.add(elbow)

  const forearmMat = longSleeve ? M.shirt : M.skin
  const forearm = new THREE.Mesh(
    new THREE.CapsuleGeometry(forearmR, Math.max(0.05, forearmLen - 2 * forearmR), 4, 14),
    forearmMat,
  )
  forearm.position.set(0, -upperLen - forearmLen / 2, 0)
  pivot.add(forearm)

  if (longSleeve) {
    const cuff = new THREE.Mesh(
      new THREE.CylinderGeometry(forearmR + 0.004, forearmR + 0.002, 0.022, 14),
      M.shirtDark,
    )
    cuff.position.set(0, -upperLen - forearmLen + 0.012, 0)
    pivot.add(cuff)
  }

  const wrist = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), M.skin)
  wrist.position.set(0, -upperLen - forearmLen, 0)
  pivot.add(wrist)

  const hand = new THREE.Group()
  hand.position.set(0, -upperLen - forearmLen - 0.055, 0)
  pivot.add(hand)
  hand.add(new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.060, 0.024), M.skin))
  for (let i = 0; i < 4; i++) {
    const finger = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.007, 0.045, 8), M.skin)
    finger.position.set(-0.018 + i * 0.012, -0.052, 0)
    hand.add(finger)
  }
  const thumb = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.007, 0.032, 8), M.skin)
  thumb.position.set(sign * 0.030, -0.020, 0.005)
  thumb.rotation.z = sign * 0.85
  hand.add(thumb)

  return pivot
}

// ── Leg (hip pivot, capsule segments, joint fillers) ─────────────────────

function buildLeg(sign: number, M: MatBundle, pantsStyle: Avatar['pantsStyle']): THREE.Group {
  const pivot = new THREE.Group()
  pivot.position.set(sign * 0.072, 0.92, 0)

  const thighLen = 0.40
  const shinLen  = 0.36
  const thighR   = 0.078
  const shinR    = 0.060

  const hipMat = pantsStyle === 'skirt' ? M.skin : M.pants
  pivot.add(new THREE.Mesh(new THREE.SphereGeometry(0.084, 16, 12), hipMat))

  const thighIsCloth = pantsStyle === 'pants' || pantsStyle === 'shorts'
  const thighMat = thighIsCloth ? M.pants : M.skin
  const thigh = new THREE.Mesh(
    new THREE.CapsuleGeometry(thighR, Math.max(0.05, thighLen - 2 * thighR), 4, 14),
    thighMat,
  )
  thigh.position.set(0, -thighLen / 2, 0)
  pivot.add(thigh)

  const kneeMat = pantsStyle === 'pants' ? M.pants : M.skin
  const knee = new THREE.Mesh(new THREE.SphereGeometry(0.072, 14, 12), kneeMat)
  knee.position.set(0, -thighLen, 0)
  pivot.add(knee)

  const shinIsCloth = pantsStyle === 'pants'
  const shinMat = shinIsCloth ? M.pants : M.skin
  const shin = new THREE.Mesh(
    new THREE.CapsuleGeometry(shinR, Math.max(0.05, shinLen - 2 * shinR), 4, 14),
    shinMat,
  )
  shin.position.set(0, -thighLen - shinLen / 2, 0)
  pivot.add(shin)

  if (pantsStyle === 'pants') {
    const cuff = new THREE.Mesh(
      new THREE.CylinderGeometry(shinR + 0.005, shinR + 0.003, 0.024, 14),
      M.pantsDark,
    )
    cuff.position.set(0, -thighLen - shinLen + 0.014, 0)
    pivot.add(cuff)
  }

  const ankle = new THREE.Mesh(new THREE.SphereGeometry(0.046, 12, 10), M.skin)
  ankle.position.set(0, -thighLen - shinLen, 0)
  pivot.add(ankle)

  const foot = new THREE.Group()
  foot.position.set(0, -thighLen - shinLen - 0.138, 0.04)
  pivot.add(foot)
  const sole = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.022, 0.20), M.shoes)
  sole.position.set(0, -0.011, 0)
  foot.add(sole)
  const upper = new THREE.Mesh(new THREE.BoxGeometry(0.082, 0.055, 0.16), M.shoes)
  upper.position.set(0, 0.022, -0.01)
  foot.add(upper)
  const toe = new THREE.Mesh(new THREE.SphereGeometry(0.050, 14, 12), M.shoes)
  toe.position.set(0, 0.005, 0.08)
  toe.scale.set(0.95, 0.55, 0.8)
  foot.add(toe)

  return pivot
}

// ── Public API ───────────────────────────────────────────────────────────

export function summariseAvatarGroup(group: THREE.Group): { meshes: number; vertices: number } {
  let meshes = 0
  let vertices = 0
  group.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (mesh.isMesh) {
      meshes++
      const pos = mesh.geometry?.getAttribute?.('position')
      if (pos) vertices += pos.count
    }
  })
  return { meshes, vertices }
}

export function avatarBounds(group: THREE.Group): { size: THREE.Vector3; center: THREE.Vector3 } {
  group.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(group)
  const size = new THREE.Vector3()
  const center = new THREE.Vector3()
  box.getSize(size)
  box.getCenter(center)
  return { size, center }
}

export function tickAvatarAnimation(group: THREE.Group, time: number, isWalking: boolean): void {
  const torso = group.getObjectByName('torso') as THREE.Object3D | undefined
  if (torso) torso.scale.set(1, 1 + Math.sin(time * 1.8) * 0.012, 1)

  const headPivot = group.getObjectByName('headPivot') as THREE.Object3D | undefined
  if (headPivot) {
    headPivot.rotation.y = Math.sin(time * 0.6) * 0.05
    headPivot.rotation.z = Math.sin(time * 0.45) * 0.025
  }

  const leftArm  = group.getObjectByName('leftArm')  as THREE.Object3D | undefined
  const rightArm = group.getObjectByName('rightArm') as THREE.Object3D | undefined
  const leftLeg  = group.getObjectByName('leftLeg')  as THREE.Object3D | undefined
  const rightLeg = group.getObjectByName('rightLeg') as THREE.Object3D | undefined

  if (isWalking) {
    const phase = time * 6.0
    const sw  = Math.sin(phase)
    const swO = Math.sin(phase + Math.PI)
    if (leftLeg)  leftLeg.rotation.x  = sw  * 0.50
    if (rightLeg) rightLeg.rotation.x = swO * 0.50
    if (leftArm)  leftArm.rotation.x  = swO * 0.34
    if (rightArm) rightArm.rotation.x = sw  * 0.34
    group.position.y = (group.userData.baseY ?? 0) + Math.abs(Math.sin(phase)) * 0.03
  } else {
    const damp = 0.18
    if (leftLeg)  leftLeg.rotation.x  = lerp(leftLeg.rotation.x,  0, damp)
    if (rightLeg) rightLeg.rotation.x = lerp(rightLeg.rotation.x, 0, damp)
    if (leftArm)  leftArm.rotation.x  = lerp(leftArm.rotation.x,  0, damp)
    if (rightArm) rightArm.rotation.x = lerp(rightArm.rotation.x, 0, damp)
    group.position.y = lerp(group.position.y, group.userData.baseY ?? 0, 0.12)
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function disposeAvatarGroup(group: THREE.Group): void {
  group.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (mesh.geometry) mesh.geometry.dispose()
    const mat = mesh.material as THREE.Material | THREE.Material[] | undefined
    if (Array.isArray(mat)) mat.forEach(m => m.dispose())
    else if (mat) mat.dispose()
  })
}

export const DEFAULT_AVATAR: Avatar = {
  id: '',
  userId: '',
  skinColor: '#E8B89E',
  height: 1.0,
  hairStyle: 'short',
  hairColor: '#3B2A1F',
  shirtStyle: 'tshirt',
  shirtColor: '#3F6FB5',
  pantsStyle: 'pants',
  pantsColor: '#2F2F35',
  shoesColor: '#101015',
  accessory: 'none',
  accessoryColor: '#222222',
  updatedAt: new Date().toISOString(),
}
