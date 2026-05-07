import { View, Text, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { GLView, ExpoWebGLRenderingContext } from "expo-gl";
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
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 bg-gallery-600 px-4 py-2 rounded-xl"
        >
          <Text className="text-white">Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <GLView
        style={{ flex: 1 }}
        onContextCreate={async (gl: ExpoWebGLRenderingContext) => {
          console.log("🎨 GL Context created");

          // ── patch pixelStorei ────────────────────────────────────────────
          // expo-gl doesn't support UNPACK_FLIP_Y_WEBGL (37440) or
          // UNPACK_PREMULTIPLY_ALPHA_WEBGL (37441). Swallow them silently.
          const _pixelStorei = gl.pixelStorei.bind(gl);
          (gl as any).pixelStorei = (pname: number, param: any) => {
            if (pname === 37440 || pname === 37441) return;
            _pixelStorei(pname, param);
          };

          // ── renderer ─────────────────────────────────────────────────────
          // Do NOT use expo-three's Renderer — in Three.js r163+ it breaks
          // because its fake canvas has no getContext(), causing a white screen.
          // Use THREE.WebGLRenderer directly with the expo-gl context instead.
          const renderer = new THREE.WebGLRenderer({
            context: gl as any,
            canvas: {
              width: gl.drawingBufferWidth,
              height: gl.drawingBufferHeight,
              style: {},
              addEventListener: () => {},
              removeEventListener: () => {},
              clientHeight: gl.drawingBufferHeight,
            } as any,
            antialias: false,
            alpha: false,
          });
          renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
          renderer.setPixelRatio(1);
          renderer.setClearColor(0x1a140c, 1); // dark brown gallery background
          console.log("✅ Renderer created");

          // ── scene ────────────────────────────────────────────────────────
          const scene = new THREE.Scene();

          // ── camera ───────────────────────────────────────────────────────
          const camera = new THREE.PerspectiveCamera(
            72,
            gl.drawingBufferWidth / gl.drawingBufferHeight,
            0.1,
            50
          );
          camera.position.set(0, 1.65, 7);
          camera.lookAt(0, 1.65, 0);

          // ── lighting ─────────────────────────────────────────────────────
          scene.add(new THREE.AmbientLight(0xfff4e6, 0.8));
          const dirLight = new THREE.DirectionalLight(0xfff8f0, 0.9);
          dirLight.position.set(5, 6, 4);
          scene.add(dirLight);
          console.log("✅ Lighting added");

          // ── room ─────────────────────────────────────────────────────────
          scene.add(createRoom());
          console.log("✅ Room built");

          // ── artworks ─────────────────────────────────────────────────────
          console.log(`📸 Loading ${published.length} artworks...`);
          for (const aw of published) {
            try {
              const texture = await loadTexture(aw.imageUrl);
          
              const image = texture.image as {
                width: number;
                height: number;
              };
          
              const aspect = image.width / image.height;
          
              scene.add(createFramedArtwork(aw, texture, aspect));
              console.log(`✅ Loaded: ${aw.title}`);
            } catch (e) {
              console.warn(`❌ Failed: ${aw.title} — using placeholder`);
              scene.add(createFramedArtwork(aw, null, 1.0));
            }
          }

          // ── render loop ──────────────────────────────────────────────────
          console.log("🎬 Starting render loop");
          let frameId: number;
          const animate = () => {
            frameId = requestAnimationFrame(animate);
            renderer.render(scene, camera);
            gl.endFrameEXP(); // required by expo-gl to present the frame
          };
          animate();

          return () => cancelAnimationFrame(frameId);
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

// Use THREE.TextureLoader directly — avoids expo-three's broken TextureLoader
async function loadTexture(url: string): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      url,
      (texture) => {
        texture.flipY = false;
        texture.premultiplyAlpha = false;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
        texture.needsUpdate = true;
        resolve(texture);
      },
      undefined,
      reject
    );
  });
}

function createRoom() {
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

  const walls: [number, number, number, number, number, number][] = [
    [0,   2.4, -10, 22,  4.8, 0.2], // back
    [0,   2.4,  10, 22,  4.8, 0.2], // front
    [-10, 2.4,   0, 0.2, 4.8,  22], // left
    [10,  2.4,   0, 0.2, 4.8,  22], // right
  ];
  walls.forEach(([x, y, z, w, h, d]) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    mesh.position.set(x, y, z);
    group.add(mesh);
  });

  return group;
}

function createFramedArtwork(
  artwork: any,
  texture: THREE.Texture | null,
  aspect: number
) {
  const group = new THREE.Group();
  group.position.set(artwork.positionX, artwork.positionY, artwork.positionZ);
  group.rotation.y = artwork.rotationY ?? 0;

  const fH = aspect >= 1 ? 1.7 / aspect : 1.7;
  const fW = aspect >= 1 ? 1.7 : 1.7 * aspect;

  // Gold frame border
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(fW + 0.18, fH + 0.18, 0.06),
    new THREE.MeshStandardMaterial({ color: "#8b6c3a", metalness: 0.8, roughness: 0.25 })
  );
  group.add(frame);

  // Cream mat backing
  const mat = new THREE.Mesh(
    new THREE.BoxGeometry(fW, fH, 0.01),
    new THREE.MeshStandardMaterial({ color: "#f2ede2", roughness: 0.9 })
  );
  mat.position.z = 0.03;
  group.add(mat);

  // Artwork surface
  const art = new THREE.Mesh(
    new THREE.PlaneGeometry(fW - 0.18, fH - 0.18),
    texture
      ? new THREE.MeshStandardMaterial({ map: texture, roughness: 0.5 })
      : new THREE.MeshStandardMaterial({ color: "#d4d4d4", roughness: 0.5 })
  );
  art.position.z = 0.04;
  group.add(art);

  return group;
}