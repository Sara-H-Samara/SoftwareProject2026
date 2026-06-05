# 3D Assets

Place your gallery room model here:

```
public/assets/3d/
└── gallery_room.glb    ← required
```

## gallery_room.glb Requirements

The `GalleryScene` component loads this file via `useGLTF('/assets/3d/gallery_room.glb')`.
If the file is missing, a procedural fallback room (white box, 20×20m floor plan) renders instead
so development can continue without the model.

### Recommended Blender Export Settings

| Setting | Value |
|---------|-------|
| Format | glTF 2.0 (.glb) |
| Include | Mesh, Materials, Lights (optional) |
| Transform | Y Forward, Z Up |
| Apply transforms | ✅ Yes |
| Compression | Draco (reduces file size ~70%) |
| Texture format | WebP for web build |

### Coordinate System

The scene uses Three.js coordinates (Y-up, right-handed):

- Room centre: `(0, 0, 0)`
- Floor at: `Y = 0`
- Eye level: `Y = 1.6`
- Room bounds (walkable): X ∈ [-7, 7], Z ∈ [-7, 7]

Artwork position defaults are set relative to these bounds. Walls should be
positioned beyond X = ±8 and Z = ±8 to give 1m of buffer from the camera clamp.

### Performance Tips

- Keep the GLB under **5 MB** for fast initial load
- Bake ambient occlusion into the albedo texture
- Use a single merged mesh for static geometry (walls, floor, ceiling)
- Leave lights out of the GLB — they are added programmatically in `GalleryScene.tsx`

### Free Gallery Room Resources

- [Sketchfab — Art Gallery](https://sketchfab.com/search?q=art+gallery&type=models)
- [Poly Haven](https://polyhaven.com/) — HDRI for lighting reference
- [Three.js Examples](https://threejs.org/examples/) — inspect existing GLB scenes
