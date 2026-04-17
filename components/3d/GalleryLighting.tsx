import type { Artwork } from "@/types";

export default function GalleryLighting({ artworks }: { artworks?: Artwork[] }) {
  return (
    <>
      <ambientLight intensity={0.75} color="#fff4e6" />
      <directionalLight position={[5, 6, 4]} intensity={0.85} color="#fff8f0" castShadow />
      <pointLight position={[0, 3, -6]} intensity={0.4} color="#ffd4a0" />
      {[-6, -2, 2, 6].map((x) => (
        <pointLight key={x} position={[x, 4.2, 0]} intensity={0.5} color="#fff0d8" />
      ))}
    </>
  );
}