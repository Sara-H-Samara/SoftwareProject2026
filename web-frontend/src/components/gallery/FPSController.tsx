// src/components/gallery/FPSController.tsx
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { getCameraBounds } from '@/utils/galleryRoom.utils'
import type { GalleryCustomization } from '@/types/gallery-customization'

interface FPSControllerProps {
  enabled: boolean
  customization?: GalleryCustomization | null
}

export function FPSController({ enabled, customization }: FPSControllerProps) {
  const { camera, gl } = useThree()
  const keys = useRef<Record<string, boolean>>({})
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))
  const drag = useRef(false)
  const lastXY = useRef({ x: 0, y: 0 })
  const vel = useRef(new THREE.Vector3())
  const bounds = getCameraBounds(customization)

  useEffect(() => {
    euler.current.setFromQuaternion(camera.quaternion, 'YXZ')
  }, [camera])

  useEffect(() => {
    if (!enabled) return
    
    const cv = gl.domElement
    const look = (dx: number, dy: number) => {
      euler.current.y -= dx * 0.0022
      euler.current.x = THREE.MathUtils.clamp(euler.current.x - dy * 0.0022, -Math.PI / 3, Math.PI / 3)
      camera.quaternion.setFromEuler(euler.current)
    }
    
    const kd = (e: KeyboardEvent) => { keys.current[e.code] = true }
    const ku = (e: KeyboardEvent) => { keys.current[e.code] = false }
    const md = (e: MouseEvent) => { 
      if (e.button === 0) { 
        drag.current = true
        lastXY.current = { x: e.clientX, y: e.clientY }
      }
    }
    const mu = () => { drag.current = false }
    const mm = (e: MouseEvent) => { 
      if (!drag.current) return
      look(e.clientX - lastXY.current.x, e.clientY - lastXY.current.y)
      lastXY.current = { x: e.clientX, y: e.clientY }
    }
    
    let lt = { x: 0, y: 0 }
    const ts = (e: TouchEvent) => { lt = { x: e.touches[0].clientX, y: e.touches[0].clientY } }
    const tm = (e: TouchEvent) => { 
      look(e.touches[0].clientX - lt.x, e.touches[0].clientY - lt.y)
      lt = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }

    window.addEventListener('keydown', kd)
    window.addEventListener('keyup', ku)
    cv.addEventListener('mousedown', md)
    window.addEventListener('mouseup', mu)
    window.addEventListener('mousemove', mm)
    cv.addEventListener('touchstart', ts, { passive: true })
    cv.addEventListener('touchmove', tm, { passive: true })

    return () => {
      window.removeEventListener('keydown', kd)
      window.removeEventListener('keyup', ku)
      cv.removeEventListener('mousedown', md)
      window.removeEventListener('mouseup', mu)
      window.removeEventListener('mousemove', mm)
      cv.removeEventListener('touchstart', ts)
      cv.removeEventListener('touchmove', tm)
    }
  }, [enabled, camera, gl])

  useFrame((_, dt) => {
    if (!enabled) return
    
    const k = keys.current
    const spd = 0.068 * (k['ShiftLeft'] ? 2 : 1)
    const fwd = new THREE.Vector3()
    camera.getWorldDirection(fwd)
    fwd.y = 0
    fwd.normalize()
    const rgt = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0))
    const des = new THREE.Vector3()

    if (k['KeyW'] || k['ArrowUp']) des.addScaledVector(fwd, spd)
    if (k['KeyS'] || k['ArrowDown']) des.addScaledVector(fwd, -spd)
    if (k['KeyA'] || k['ArrowLeft']) des.addScaledVector(rgt, -spd)
    if (k['KeyD'] || k['ArrowRight']) des.addScaledVector(rgt, spd)

    vel.current.lerp(des, Math.min(dt * 14, 1))
    const np = camera.position.clone().add(vel.current)

    np.x = THREE.MathUtils.clamp(np.x, bounds.minX, bounds.maxX)
    np.z = THREE.MathUtils.clamp(np.z, bounds.minZ, bounds.maxZ)
    np.y = bounds.eyeHeight

    camera.position.copy(np)
  })

  return null
}