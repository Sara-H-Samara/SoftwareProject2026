import { View, Text } from "react-native";
import { GLView } from "expo-gl";
import { Renderer } from "expo-three";
import * as THREE from "three";

export default function CubeTest() {
  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <GLView
        style={{ flex: 1, width: "100%", height: "100%" }}
        onContextCreate={async (gl) => {
          console.log("🎨 GL Context created (cube test)");

          const renderer = new Renderer({ gl });
          renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);

          const scene = new THREE.Scene();
          // خلفية زرقاء فاتحة لسهولة الرؤية
          scene.background = new THREE.Color("#2266cc");

          const camera = new THREE.PerspectiveCamera(
            60,
            gl.drawingBufferWidth / gl.drawingBufferHeight,
            0.1,
            1000
          );
          camera.position.set(0, 1, 5);
          camera.lookAt(0, 0, 0);

          // إضاءة قوية
          scene.add(new THREE.AmbientLight(0xffffff, 1.0));
          const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
          dirLight.position.set(5, 5, 5);
          scene.add(dirLight);

          // مكعب أحمر كبير
          const geometry = new THREE.BoxGeometry(2, 2, 2);
          const material = new THREE.MeshStandardMaterial({ color: 0xff3333 });
          const cube = new THREE.Mesh(geometry, material);
          cube.position.set(0, 1, 0);
          scene.add(cube);

          console.log("🎬 Cube render loop started");
          const animate = () => {
            requestAnimationFrame(animate);
            cube.rotation.y += 0.01; // دوران بطيء
            renderer.render(scene, camera);
          };
          animate();
        }}
      />
    </View>
  );
}