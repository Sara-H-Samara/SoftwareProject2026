import { View, Text, TouchableOpacity } from "react-native";
import { Canvas } from "@react-three/fiber/native";
import { useTexture } from "@react-three/drei/native";
import { Suspense, useRef } from "react";
import { useFrame } from "@react-three/fiber/native";
import * as THREE from "three";
import { Ionicons } from "@expo/vector-icons";

interface ModelViewer3DProps {
  artwork: { id: string; title: string; imageUrl: string };
  onClose: () => void;
}

function RotatingArtwork({ imageUrl }: { imageUrl: string }) {
  const meshRef = useRef<THREE.Group>(null);
  const texture = useTexture(imageUrl);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group ref={meshRef}>
      <mesh>
        <planeGeometry args={[2.2, 2.2]} />
        <meshStandardMaterial map={texture} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export function ModelViewer3D({ artwork, onClose }: ModelViewer3DProps) {
  return (
    <View className="flex-1 bg-stone-900">
      <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <Suspense fallback={null}>
          <RotatingArtwork imageUrl={artwork.imageUrl} />
        </Suspense>
      </Canvas>
      <TouchableOpacity onPress={onClose} className="absolute top-12 right-4 bg-black/50 p-3 rounded-full">
        <Ionicons name="close" size={24} color="white" />
      </TouchableOpacity>
      <View className="absolute bottom-10 left-0 right-0 items-center">
        <View className="bg-black/60 px-4 py-2 rounded-full">
          <Text className="text-white">{artwork.title}</Text>
        </View>
        <Text className="text-white/50 text-xs mt-2">Drag to rotate · Pinch to zoom</Text>
      </View>
    </View>
  );
}