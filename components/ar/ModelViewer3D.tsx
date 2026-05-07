import { View, Text, TouchableOpacity } from "react-native";
import { GLView, ExpoWebGLRenderingContext } from "expo-gl";
import { Ionicons } from "@expo/vector-icons";
import * as THREE from "three";

interface ModelViewer3DProps {
  artwork: { id: string; title: string; imageUrl: string };
  onClose: () => void;
}

export function ModelViewer3D({ artwork, onClose }: ModelViewer3DProps) {
  const onContextCreate = async (gl: ExpoWebGLRenderingContext) => {
    // Patch unsupported pixelStorei params
    const _pixelStorei = gl.pixelStorei.bind(gl);
    (gl as any).pixelStorei = (pname: number, param: any) => {
      if (pname === 37440 || pname === 37441) return;
      _pixelStorei(pname, param);
    };

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      context: gl as any,
      canvas: {
        width: gl.drawingBufferWidth,
        height: gl.drawingBufferHeight,
        style: {},
        addEventListener: () => {},
        removeEventListener: () => {},
        clientWidth: gl.drawingBufferWidth,
        clientHeight: gl.drawingBufferHeight,
        getContext: () => null,
      } as any,
      antialias: false,
      alpha: false,
    });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight, false);
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x1c1917, 1); // stone-900 background

    // Scene & camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      50,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 3);
    camera.lookAt(0, 0, 0);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(5, 5, 5);
    scene.add(dir);

    // Artwork plane — load texture then build mesh
    const group = new THREE.Group();
    scene.add(group);

    try {
      const texture = await new Promise<THREE.Texture>((resolve, reject) => {
        new THREE.TextureLoader().load(
          artwork.imageUrl,
          (tex) => {
            tex.flipY = false;
            tex.premultiplyAlpha = false;
            tex.minFilter = THREE.LinearFilter;
            tex.magFilter = THREE.LinearFilter;
            tex.generateMipmaps = false;
            tex.needsUpdate = true;
            resolve(tex);
          },
          undefined,
          reject
        );
      });

      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2.2, 2.2),
        new THREE.MeshStandardMaterial({
          map: texture,
          side: THREE.DoubleSide,
          roughness: 0.5,
        })
      );
      group.add(mesh);
    } catch {
      // Fallback: plain coloured plane if image fails
      group.add(
        new THREE.Mesh(
          new THREE.PlaneGeometry(2.2, 2.2),
          new THREE.MeshStandardMaterial({ color: 0x444444, side: THREE.DoubleSide })
        )
      );
    }

    // Render loop — slowly rotate the artwork
    const animate = () => {
      requestAnimationFrame(animate);
      group.rotation.y += 0.008;
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    animate();
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#1c1917" }}>
      <GLView style={{ flex: 1 }} onContextCreate={onContextCreate} />

      <TouchableOpacity
        onPress={onClose}
        className="absolute top-12 right-4 bg-black/50 p-3 rounded-full"
      >
        <Ionicons name="close" size={24} color="white" />
      </TouchableOpacity>

      <View className="absolute bottom-10 left-0 right-0 items-center">
        <View className="bg-black/60 px-4 py-2 rounded-full">
          <Text className="text-white">{artwork.title}</Text>
        </View>
        <Text className="text-white/50 text-xs mt-2">Auto-rotating artwork</Text>
      </View>
    </View>
  );
}