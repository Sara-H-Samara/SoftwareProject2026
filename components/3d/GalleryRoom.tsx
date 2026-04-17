import { useMemo } from "react";

const WALL = "#ece6dc";
const TRIM = "#c8aa6a";

export default function GalleryRoom() {
  const floorTiles = useMemo(() => {
    const tiles: JSX.Element[] = [];
    const s = 1.8;
    const cols = 12;
    const rows = 12;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const even = (r + c) % 2 === 0;
        tiles.push(
          <mesh
            key={`${r}-${c}`}
            rotation={[-Math.PI / 2, 0, even ? 0 : Math.PI / 2]}
            position={[(c - cols / 2 + 0.5) * s, 0, (r - rows / 2 + 0.5) * s]}
            receiveShadow
          >
            <planeGeometry args={[s - 0.025, s - 0.025]} />
            <meshStandardMaterial color={even ? "#231b0f" : "#1a1308"} roughness={0.28} metalness={0.06} />
          </mesh>
        );
      }
    }
    return tiles;
  }, []);

  return (
    <group>
      {floorTiles}

      {/* Ceiling */}
      <mesh position={[0, 4.8, 0]}>
        <boxGeometry args={[22, 0.14, 22]} />
        <meshStandardMaterial color="#f3efe8" roughness={0.9} />
      </mesh>

      {/* Walls */}
      <mesh position={[0, 2.4, -10.1]}>
        <boxGeometry args={[22, 4.8, 0.22]} />
        <meshStandardMaterial color={WALL} roughness={0.72} />
      </mesh>
      <mesh position={[0, 2.4, 10.1]}>
        <boxGeometry args={[22, 4.8, 0.22]} />
        <meshStandardMaterial color={WALL} roughness={0.72} />
      </mesh>
      <mesh position={[-10.1, 2.4, 0]}>
        <boxGeometry args={[0.22, 4.8, 22]} />
        <meshStandardMaterial color={WALL} roughness={0.72} />
      </mesh>
      <mesh position={[10.1, 2.4, 0]}>
        <boxGeometry args={[0.22, 4.8, 22]} />
        <meshStandardMaterial color={WALL} roughness={0.72} />
      </mesh>

      {/* Crown molding */}
      {[
        { p: [0, 4.7, -10] as [number, number, number], w: 22 },
        { p: [0, 4.7, 10] as [number, number, number], w: 22 },
        { p: [-10, 4.7, 0] as [number, number, number], r: [0, Math.PI / 2, 0] as [number, number, number], w: 22 },
        { p: [10, 4.7, 0] as [number, number, number], r: [0, Math.PI / 2, 0] as [number, number, number], w: 22 },
      ].map((m, i) => (
        <mesh key={`cr${i}`} position={m.p} rotation={m.r}>
          <boxGeometry args={[m.w, 0.2, 0.2]} />
          <meshStandardMaterial color={TRIM} metalness={0.55} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}