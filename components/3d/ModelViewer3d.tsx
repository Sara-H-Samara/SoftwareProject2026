import { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { GLView, ExpoWebGLRenderingContext } from "expo-gl";
import { Renderer, TextureLoader } from "expo-three";
import { Ionicons } from "@expo/vector-icons";
import * as THREE from "three";

interface ModelViewer3DProps {
  artwork: {
    id: string;
    title: string;
    imageUrl: string;
  };
  onClose: () => void;
}

export function ModelViewer3D({ artwork, onClose }: ModelViewer3DProps) {
  const animationFrameRef = useRef<number | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const textureRef = useRef<THREE.Texture | null>(null);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (textureRef.current) {
        textureRef.current.dispose();
        textureRef.current = null;
      }

      rendererRef.current?.dispose();
      rendererRef.current = null;
    };
  }, []);

  const onContextCreate = async (gl: ExpoWebGLRenderingContext) => {
    // Patch unsupported expo-gl pixelStorei params
    const originalPixelStorei = gl.pixelStorei.bind(gl);

    (gl as any).pixelStorei = (pname: number, param: any) => {
      // 37440 = UNPACK_FLIP_Y_WEBGL
      // 37441 = UNPACK_PREMULTIPLY_ALPHA_WEBGL
      if (pname === 37440 || pname === 37441) return;
      originalPixelStorei(pname, param);
    };

    const renderer = new Renderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x1c1917, 1);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1c1917);

    const camera = new THREE.PerspectiveCamera(
      50,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      100
    );

    camera.position.set(0, 0.15, 3.4);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(4, 5, 5);
    scene.add(directionalLight);

    const group = new THREE.Group();
    scene.add(group);

    // Back board
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(2.35, 2.65, 0.08),
      new THREE.MeshStandardMaterial({
        color: 0x8b6c3a,
        metalness: 0.5,
        roughness: 0.35,
      })
    );
    board.position.z = -0.04;
    group.add(board);

    // White mat behind artwork
    const matBoard = new THREE.Mesh(
      new THREE.BoxGeometry(2.15, 2.45, 0.04),
      new THREE.MeshStandardMaterial({
        color: 0xf5efe4,
        roughness: 0.85,
      })
    );
    matBoard.position.z = 0.03;
    group.add(matBoard);

    try {
      const textureLoader = new TextureLoader();
      const texture = await textureLoader.loadAsync(artwork.imageUrl);

      texture.flipY = false;
      texture.premultiplyAlpha = false;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      texture.needsUpdate = true;

      textureRef.current = texture;

      const imageWidth = texture.image?.width ?? 1;
      const imageHeight = texture.image?.height ?? 1;
      const aspect = imageWidth / imageHeight;

      let planeWidth = 1.85;
      let planeHeight = 1.85;

      if (aspect >= 1) {
        planeHeight = planeWidth / aspect;
      } else {
        planeWidth = planeHeight * aspect;
      }

      const artworkMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(planeWidth, planeHeight),
        new THREE.MeshStandardMaterial({
          map: texture,
          side: THREE.DoubleSide,
          roughness: 0.45,
        })
      );

      artworkMesh.position.z = 0.08;
      group.add(artworkMesh);
    } catch (error) {
      console.warn("Failed to load artwork texture:", error);

      const fallback = new THREE.Mesh(
        new THREE.PlaneGeometry(1.9, 1.9),
        new THREE.MeshStandardMaterial({
          color: 0x444444,
          side: THREE.DoubleSide,
        })
      );

      fallback.position.z = 0.08;
      group.add(fallback);
    }

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      group.rotation.y += 0.008;
      group.rotation.x = Math.sin(Date.now() * 0.001) * 0.05;

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
        className="absolute top-12 right-4 bg-black/60 p-3 rounded-full"
      >
        <Ionicons name="close" size={24} color="white" />
      </TouchableOpacity>

      <View className="absolute bottom-10 left-0 right-0 items-center px-6">
        <View className="bg-black/70 px-4 py-2 rounded-full max-w-full">
          <Text className="text-white text-center" numberOfLines={1}>
            {artwork.title}
          </Text>
        </View>

        <Text className="text-white/50 text-xs mt-2">
          Auto-rotating 3D preview
        </Text>
      </View>
    </View>
  );
}