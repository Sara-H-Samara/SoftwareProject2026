import { View } from "react-native";
import { GLView } from "expo-gl";
import * as THREE from "three";

export default function GLTestPage() {
  const onContextCreate = async (gl: any) => {
    // IMPORTANT PATCH
    gl.canvas = {
      width: gl.drawingBufferWidth,
      height: gl.drawingBufferHeight,
      style: {},
      addEventListener: () => {},
      removeEventListener: () => {},
      clientHeight: gl.drawingBufferHeight,
    };

    const renderer = new THREE.WebGLRenderer({
      canvas: gl.canvas,
      context: gl,
    });

    renderer.setSize(
      gl.drawingBufferWidth,
      gl.drawingBufferHeight
    );

    renderer.setClearColor(0xff0000, 1);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      75,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      1000
    );

    camera.position.z = 5;

    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2, 2),
      new THREE.MeshBasicMaterial({
        color: 0xffff00,
      })
    );

    scene.add(cube);

    const render = () => {
      requestAnimationFrame(render);

      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;

      renderer.render(scene, camera);

      gl.endFrameEXP();
    };

    render();
  };

  return (
    <View style={{ flex: 1 }}>
      <GLView
        style={{ flex: 1 }}
        onContextCreate={onContextCreate}
      />
    </View>
  );
}