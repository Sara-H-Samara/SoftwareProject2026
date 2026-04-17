import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber/native";
import { useTexture } from "@react-three/drei/native";
import * as THREE from "three";
import type { Artwork } from "@/types";

interface ArtworkFrameProps {
  artwork: Artwork;
  isSelected: boolean;
  onSelect: () => void;
}

export default function ArtworkFrame({ artwork, isSelected, onSelect }: ArtworkFrameProps) {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const texture = useTexture(artwork.imageUrl);
  const scaleRef = useRef(1);

  useEffect(() => {
    if (texture) {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 8;
    }
  }, [texture]);

  // Safely get image dimensions
  const imgElement = texture?.image as HTMLImageElement;
  const imgW = imgElement?.width ?? 1;
  const imgH = imgElement?.height ?? 1;
  const asp = imgW / imgH;
  const fH = asp >= 1 ? 1.7 / asp : 1.7;
  const fW = asp >= 1 ? 1.7 : 1.7 * asp;
  const artW = fW - 0.18;
  const artH = fH - 0.18;

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const target = hovered || isSelected ? 1.035 : 1;
    scaleRef.current += (target - scaleRef.current) * Math.min(delta * 12, 1);
    meshRef.current.scale.setScalar(scaleRef.current);
  });

  return (
    <group
      ref={meshRef}
      position={[artwork.positionX ?? 0, artwork.positionY ?? 1.7, artwork.positionZ ?? 0]}
      rotation={[artwork.rotationX ?? 0, artwork.rotationY ?? 0, artwork.rotationZ ?? 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Frame */}
      <mesh castShadow>
        <boxGeometry args={[fW + 0.18, fH + 0.18, 0.055]} />
        <meshStandardMaterial color={hovered ? "#d4b84a" : "#8b6c3a"} metalness={0.78} roughness={0.25} />
      </mesh>
      {/* Mat */}
      <mesh position={[0, 0, 0.03]}>
        <boxGeometry args={[fW, fH, 0.012]} />
        <meshStandardMaterial color="#f2ede2" roughness={0.9} />
      </mesh>
      {/* Artwork */}
      <mesh position={[0, 0, 0.042]}>
        <planeGeometry args={[artW, artH]} />
        <meshStandardMaterial map={texture} roughness={0.5} />
      </mesh>
    </group>
  );
}