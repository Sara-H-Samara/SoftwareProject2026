import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber/native";
import * as THREE from "three";

export default function FPSController({ enabled }: { enabled: boolean }) {
  const { camera } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const vel = useRef(new THREE.Vector3());

  useEffect(() => {
    if (!enabled) return;
    const handleKeyDown = (e: KeyboardEvent) => (keys.current[e.code] = true);
    const handleKeyUp = (e: KeyboardEvent) => (keys.current[e.code] = false);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [enabled]);

  useFrame((_, delta) => {
    if (!enabled) return;
    const k = keys.current;
    const speed = 0.068 * (k["ShiftLeft"] ? 2 : 1);
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0));
    const desired = new THREE.Vector3();
    if (k["KeyW"]) desired.addScaledVector(forward, speed);
    if (k["KeyS"]) desired.addScaledVector(forward, -speed);
    if (k["KeyA"]) desired.addScaledVector(right, -speed);
    if (k["KeyD"]) desired.addScaledVector(right, speed);
    vel.current.lerp(desired, Math.min(delta * 14, 1));
    const newPos = camera.position.clone().add(vel.current);
    newPos.x = THREE.MathUtils.clamp(newPos.x, -9, 9);
    newPos.z = THREE.MathUtils.clamp(newPos.z, -9, 9);
    newPos.y = 1.65;
    camera.position.copy(newPos);
  });

  return null;
}