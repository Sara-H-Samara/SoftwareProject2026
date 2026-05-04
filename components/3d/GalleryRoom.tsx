import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { GLView } from "expo-gl";
import { Renderer, TextureLoader } from "expo-three";
import { useArtistArtworks } from "@/hooks/useGallery";
import { PageLoader } from "@/components/common/Spinner";
import * as THREE from "three";
import { Ionicons } from "@expo/vector-icons";

export default function VirtualGalleryPage() {
  const { artistId } = useLocalSearchParams<{ artistId: string }>();
  const router = useRouter();
  const { data: artworks, isLoading } = useArtistArtworks(artistId!);

  const published = (artworks ?? []).filter((a) => a.isPublished);

  if (isLoading) return <PageLoader message="Loading gallery..." />;
  if (published.length === 0) {
    return (
      <View className="flex-1 bg-stone-900 justify-center items-center p-4">
        <Text className="text-white text-lg">No published artworks.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-gallery-600 px-4 py-2 rounded-xl">
          <Text className="text-white">Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <GLView
        style={{ flex: 1 }}
        onContextCreate={async (gl) => {
          console.log("🎨 GL Context created");
          const renderer = new Renderer({ gl });
          renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);

          const scene = new THREE.Scene();
          scene.background = new THREE.Color("#1a140c");
          const camera = new THREE.PerspectiveCamera(
            72,
            gl.drawingBufferWidth / gl.drawingBufferHeight,
            0.1,
            50
          );
          camera.position.set(0, 1.65, 7);

          scene.add(new THREE.AmbientLight(0xfff4e6, 0.8));
          const dirLight = new THREE.DirectionalLight(0xfff8f0, 0.9);
          dirLight.position.set(5, 6, 4);
          scene.add(dirLight);

          const room = createSimpleRoom();
          scene.add(room);

          const textureLoader = new TextureLoader();
          console.log(`📸 Loading ${published.length} artworks...`);

          for (const aw of published) {
            try {
              const texture = await textureLoader.loadAsync(aw.imageUrl);
              const aspect = texture.image.width / texture.image.height;
              const frame = createFramedArtwork(aw, texture, aspect);
              scene.add(frame);
              console.log(`✅ Loaded: ${aw.title}`);
            } catch (e) {
              console.warn(`❌ Failed to load ${aw.title}, using placeholder`);
              // إطار فارغ بلون محايد
              const frame = createFramedArtwork(aw, null, 1.0);
              scene.add(frame);
            }
          }

          console.log("🎬 Starting render loop");
          const animate = () => {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
          };
          animate();
        }}
      />

      <TouchableOpacity
        onPress={() => router.back()}
        className="absolute top-12 left-4 bg-black/50 p-3 rounded-full z-10"
      >
        <Ionicons name="close" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

function createSimpleRoom() {
  const group = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: "#ece6dc", roughness: 0.8 });
  const floorMat = new THREE.MeshStandardMaterial({ color: "#1e1811", roughness: 0.5 });
  const ceilMat = new THREE.MeshStandardMaterial({ color: "#f3efe8", roughness: 0.9 });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(22, 22), floorMat);
  floor.rotation.x = -Math.PI / 2;
  group.add(floor);

  const ceil = new THREE.Mesh(new THREE.BoxGeometry(22, 0.14, 22), ceilMat);
  ceil.position.y = 4.8;
  group.add(ceil);

  [
    [0, 2.4, -10, 22, 4.8, 0.2],
    [0, 2.4, 10, 22, 4.8, 0.2],
    [-10, 2.4, 0, 0.2, 4.8, 22],
    [10, 2.4, 0, 0.2, 4.8, 22],
  ].forEach(([x, y, z, w, h, d]) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    mesh.position.set(x, y, z);
    group.add(mesh);
  });

  return group;
}

function createFramedArtwork(artwork: any, texture: THREE.Texture | null, aspect: number) {
  const group = new THREE.Group();
  group.position.set(artwork.positionX, artwork.positionY, artwork.positionZ);

  const fH = aspect >= 1 ? 1.7 / aspect : 1.7;
  const fW = aspect >= 1 ? 1.7 : 1.7 * aspect;
  const artW = fW - 0.18;
  const artH = fH - 0.18;

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(fW + 0.18, fH + 0.18, 0.06),
    new THREE.MeshStandardMaterial({ color: "#8b6c3a", metalness: 0.8, roughness: 0.25 })
  );
  group.add(frame);

  const mat = new THREE.Mesh(
    new THREE.BoxGeometry(fW, fH, 0.01),
    new THREE.MeshStandardMaterial({ color: "#f2ede2", roughness: 0.9 })
  );
  mat.position.z = 0.03;
  group.add(mat);

  const artMaterial = texture
    ? new THREE.MeshStandardMaterial({ map: texture, roughness: 0.5 })
    : new THREE.MeshStandardMaterial({ color: "#d4d4d4", roughness: 0.5 });
  const art = new THREE.Mesh(new THREE.PlaneGeometry(artW, artH), artMaterial);
  art.position.z = 0.04;
  group.add(art);

  return group;
}