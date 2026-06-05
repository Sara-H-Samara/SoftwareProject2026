// src/utils/galleryGeometry.utils.ts
import * as THREE from 'three'

export interface WallGeometryResult {
  wallMesh: THREE.BufferGeometry
  floorMesh: THREE.BufferGeometry
  ceilingMesh: THREE.BufferGeometry
  moldingsMesh?: THREE.BufferGeometry
}

export function generateRectangleGeometry(width: number, depth: number, height: number): WallGeometryResult {
  const wallMesh = new THREE.BufferGeometry()
  const floorMesh = new THREE.PlaneGeometry(width, depth)
  const ceilingMesh = new THREE.PlaneGeometry(width, depth)
  
  const vertices: number[] = []
  const indices: number[] = []
  const normals: number[] = []
  
  const halfW = width / 2
  const halfD = depth / 2
  
  const walls = [
    { points: [[-halfW, 0, -halfD], [halfW, 0, -halfD], [halfW, height, -halfD], [-halfW, height, -halfD]] }, // front
    { points: [[halfW, 0, -halfD], [halfW, 0, halfD], [halfW, height, halfD], [halfW, height, -halfD]] }, // right
    { points: [[-halfW, 0, halfD], [-halfW, 0, -halfD], [-halfW, height, -halfD], [-halfW, height, halfD]] }, // left
    { points: [[-halfW, 0, halfD], [halfW, 0, halfD], [halfW, height, halfD], [-halfW, height, halfD]] } // back
  ]
  
  let vertexOffset = 0
  walls.forEach(wall => {
    const [p0, p1, p2, p3] = wall.points
    
    const v0 = new THREE.Vector3(p0[0], p0[1], p0[2])
    const v1 = new THREE.Vector3(p1[0], p1[1], p1[2])
    const v2 = new THREE.Vector3(p2[0], p2[1], p2[2])
    const v3 = new THREE.Vector3(p3[0], p3[1], p3[2])
    
    const normal = new THREE.Vector3()
    const edge1 = new THREE.Vector3().subVectors(v1, v0)
    const edge2 = new THREE.Vector3().subVectors(v2, v0)
    normal.crossVectors(edge1, edge2).normalize()
    
    const positions = [...v0.toArray(), ...v1.toArray(), ...v2.toArray(), ...v3.toArray()]
    vertices.push(...positions)
    
    indices.push(vertexOffset, vertexOffset + 1, vertexOffset + 2)
    indices.push(vertexOffset, vertexOffset + 2, vertexOffset + 3)
    
    for (let i = 0; i < 4; i++) {
      normals.push(normal.x, normal.y, normal.z)
    }
    
    vertexOffset += 4
  })
  
  wallMesh.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3))
  wallMesh.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3))
  wallMesh.setIndex(indices)
  wallMesh.computeBoundingSphere()
  
  return { wallMesh, floorMesh, ceilingMesh }
}

export function generateCircularGeometry(radius: number, height: number, segments: number = 64): WallGeometryResult {
  const wallMesh = new THREE.BufferGeometry()
  const floorMesh = new THREE.CircleGeometry(radius, segments)
  const ceilingMesh = new THREE.CircleGeometry(radius, segments)
  
  const vertices: number[] = []
  const indices: number[] = []
  const normals: number[] = []
  
  const angleStep = (Math.PI * 2) / segments
  
  for (let i = 0; i < segments; i++) {
    const angle = i * angleStep
    const nextAngle = (i + 1) * angleStep
    
    const x1 = Math.cos(angle) * radius
    const z1 = Math.sin(angle) * radius
    const x2 = Math.cos(nextAngle) * radius
    const z2 = Math.sin(nextAngle) * radius
    
    const p0 = new THREE.Vector3(x1, 0, z1)
    const p1 = new THREE.Vector3(x2, 0, z2)
    const p2 = new THREE.Vector3(x2, height, z2)
    const p3 = new THREE.Vector3(x1, height, z1)
    
    const edge1 = new THREE.Vector3().subVectors(p1, p0)
    const edge2 = new THREE.Vector3().subVectors(p2, p0)
    const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize()
    
    const positions = [...p0.toArray(), ...p1.toArray(), ...p2.toArray(), ...p3.toArray()]
    vertices.push(...positions)
    
    const baseIndex = i * 4
    indices.push(baseIndex, baseIndex + 1, baseIndex + 2)
    indices.push(baseIndex, baseIndex + 2, baseIndex + 3)
    
    for (let j = 0; j < 4; j++) {
      normals.push(normal.x, normal.y, normal.z)
    }
  }
  
  wallMesh.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3))
  wallMesh.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3))
  wallMesh.setIndex(indices)
  wallMesh.computeBoundingSphere()
  
  return { wallMesh, floorMesh, ceilingMesh }
}

export function generateOctagonalGeometry(radius: number, height: number): WallGeometryResult {
  const wallMesh = new THREE.BufferGeometry()
  const floorMesh = new THREE.CircleGeometry(radius, 8)
  const ceilingMesh = new THREE.CircleGeometry(radius, 8)
  
  const vertices: number[] = []
  const indices: number[] = []
  const normals: number[] = []
  
  const segments = 8
  const angleStep = (Math.PI * 2) / segments
  
  for (let i = 0; i < segments; i++) {
    const angle = i * angleStep
    const nextAngle = (i + 1) * angleStep
    
    const x1 = Math.cos(angle) * radius
    const z1 = Math.sin(angle) * radius
    const x2 = Math.cos(nextAngle) * radius
    const z2 = Math.sin(nextAngle) * radius
    
    const p0 = new THREE.Vector3(x1, 0, z1)
    const p1 = new THREE.Vector3(x2, 0, z2)
    const p2 = new THREE.Vector3(x2, height, z2)
    const p3 = new THREE.Vector3(x1, height, z1)
    
    const edge1 = new THREE.Vector3().subVectors(p1, p0)
    const edge2 = new THREE.Vector3().subVectors(p2, p0)
    const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize()
    
    const positions = [...p0.toArray(), ...p1.toArray(), ...p2.toArray(), ...p3.toArray()]
    vertices.push(...positions)
    
    const baseIndex = i * 4
    indices.push(baseIndex, baseIndex + 1, baseIndex + 2)
    indices.push(baseIndex, baseIndex + 2, baseIndex + 3)
    
    for (let j = 0; j < 4; j++) {
      normals.push(normal.x, normal.y, normal.z)
    }
  }
  
  wallMesh.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3))
  wallMesh.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3))
  wallMesh.setIndex(indices)
  wallMesh.computeBoundingSphere()
  
  return { wallMesh, floorMesh, ceilingMesh }
}

export function generateLShapedGeometry(width: number, depth: number): WallGeometryResult {
  const wallMesh = new THREE.BufferGeometry()
  
  const wingSize = Math.min(width, depth) * 0.6
 
  // L-shape floor points
  const floorPoints = [
    new THREE.Vector2(-width/2, -depth/2),
    new THREE.Vector2(width/2 - wingSize, -depth/2),
    new THREE.Vector2(width/2 - wingSize, depth/2 - wingSize),
    new THREE.Vector2(width/2, depth/2 - wingSize),
    new THREE.Vector2(width/2, depth/2),
    new THREE.Vector2(-width/2, depth/2),
  ]
  
  // Build floor shape
  const shape = new THREE.Shape()
  shape.moveTo(floorPoints[0].x, floorPoints[0].y)
  for (let i = 1; i < floorPoints.length; i++) {
    shape.lineTo(floorPoints[i].x, floorPoints[i].y)
  }
  shape.closePath()
  
  const extrudedFloor = new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: false })
  const extrudedCeiling = new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: false })
  
  // Build walls from floor edges (simplified for now)
  // This requires calculating all wall segments from the shape perimeter
  
  return { wallMesh, floorMesh: extrudedFloor as unknown as THREE.PlaneGeometry, ceilingMesh: extrudedCeiling as unknown as THREE.PlaneGeometry }
}

// Simplified: For complex shapes, we'll use a different approach
export function getShapeGeometry(shape: string, width: number, depth: number, height: number): WallGeometryResult {
  switch (shape) {
    case 'circular':
      return generateCircularGeometry(width / 2, height, 96)
    case 'octagonal':
      return generateOctagonalGeometry(width / 2, height)
    case 'l_shaped':
    case 't_shaped':
    case 'u_shaped':
      // For now, fallback to rectangle for complex shapes
      // Full implementation would require custom geometry for each
      return generateRectangleGeometry(width, depth, height)
    default:
      return generateRectangleGeometry(width, depth, height)
  }
}