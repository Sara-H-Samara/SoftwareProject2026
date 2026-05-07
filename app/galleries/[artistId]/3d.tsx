import { View, Text, ScrollView } from "react-native";
import { GLView, ExpoWebGLRenderingContext } from "expo-gl";
import { useState } from "react";
import * as THREE from "three";

export default function GLTestPage() {
  const [logs, setLogs] = useState<string[]>(["Waiting for GL..."]);

  const addLog = (msg: string) => {
    console.log(msg);
    setLogs((prev) => [...prev, msg]);
  };

  const onContextCreate = async (gl: ExpoWebGLRenderingContext) => {
    try {
      addLog(`✅ 1. GL context OK — ${gl.drawingBufferWidth}x${gl.drawingBufferHeight}`);

      // Step 2: patch pixelStorei
      const _pixelStorei = gl.pixelStorei.bind(gl);
      (gl as any).pixelStorei = (pname: number, param: any) => {
        if (pname === 37440 || pname === 37441) return;
        _pixelStorei(pname, param);
      };
      addLog("✅ 2. pixelStorei patched");

      // Step 3: build fake canvas
      const fakeCanvas = {
        width: gl.drawingBufferWidth,
        height: gl.drawingBufferHeight,
        style: {},
        addEventListener: () => {},
        removeEventListener: () => {},
        clientWidth: gl.drawingBufferWidth,
        clientHeight: gl.drawingBufferHeight,
        getContext: () => null, // prevents Three.js trying to create its own context
      };
      addLog("✅ 3. Fake canvas built");

      // Step 4: create THREE.WebGLRenderer
      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          context: gl as any,
          canvas: fakeCanvas as any,
          antialias: false,
          alpha: false,
          powerPreference: "default",
        });
        addLog("✅ 4. THREE.WebGLRenderer created");
      } catch (e: any) {
        addLog(`❌ 4. WebGLRenderer FAILED: ${e?.message}`);
        return;
      }

      // Step 5: configure renderer
      try {
        renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight, false);
        renderer.setPixelRatio(1);
        renderer.setClearColor(0xff0000, 1); // bright red — easy to see
        addLog("✅ 5. Renderer configured — clear color = RED");
      } catch (e: any) {
        addLog(`❌ 5. Renderer config FAILED: ${e?.message}`);
        return;
      }

      // Step 6: build minimal scene
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(60, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 100);
      camera.position.set(0, 0, 4);
      camera.lookAt(0, 0, 0);

      // Bright yellow box — no lighting needed with MeshBasicMaterial
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 2),
        new THREE.MeshBasicMaterial({ color: 0xffff00 })
      );
      scene.add(cube);
      addLog("✅ 6. Scene built — yellow cube + red background");

      // Step 7: render ONE frame manually first
      try {
        renderer.render(scene, camera);
        addLog("✅ 7. renderer.render() called (no error)");
      } catch (e: any) {
        addLog(`❌ 7. renderer.render() FAILED: ${e?.message}`);
        return;
      }

      // Step 8: call endFrameEXP
      try {
        gl.endFrameEXP();
        addLog("✅ 8. gl.endFrameEXP() called — screen should show RED + yellow cube");
      } catch (e: any) {
        addLog(`❌ 8. endFrameEXP FAILED: ${e?.message}`);
        return;
      }

      // Step 9: start animation loop
      addLog("✅ 9. Starting animation loop...");
      const animate = () => {
        requestAnimationFrame(animate);
        cube.rotation.y += 0.01;
        renderer.render(scene, camera);
        gl.endFrameEXP();
      };
      animate();
      addLog("✅ 10. Animation loop running");

    } catch (e: any) {
      addLog(`❌ UNEXPECTED ERROR: ${e?.message ?? String(e)}`);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Log overlay — shows on top of GL view */}
      <GLView style={{ flex: 1 }} onContextCreate={onContextCreate} />
      <ScrollView
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: 220,
          backgroundColor: "rgba(0,0,0,0.85)",
          padding: 8,
        }}
      >
        {logs.map((log, i) => (
          <Text key={i} style={{ color: log.startsWith("❌") ? "#ff6b6b" : "#90ee90", fontSize: 11, fontFamily: "monospace" }}>
            {log}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}