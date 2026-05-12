import { useEffect, useState, useRef } from "react";
import { View, PanResponder, Dimensions } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { GLView } from "expo-gl";

import * as THREE from "three";
import { Renderer, TextureLoader } from "expo-three";

export default function StableGalleryRoom() {
  const { artistId } = useLocalSearchParams<{ artistId: string }>();

  const [artworks, setArtworks] = useState<any[]>([]);
  const glReady = useRef<any>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  
  // Camera control state
  const cameraAngle = useRef({ theta: -Math.PI / 3, phi: 0.3, radius: 7 });
  const lastTouchPos = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  // =========================================
  // FETCH ARTWORKS
  // =========================================

  useEffect(() => {
    if (!artistId) return;

    const fetchArtworks = async () => {
      try {
        const response = await fetch(
          `http://192.168.1.95:5005/api/galleries/${artistId}/artworks`
        );

        const data = await response.json();

        console.log("ARTWORKS:", data);

        setArtworks(data);
      } catch (error) {
        console.log("FETCH ERROR:", error);
      }
    };

    fetchArtworks();
  }, [artistId]);

  // =========================================
  // CREATE SCENE AFTER DATA LOADED
  // =========================================

  useEffect(() => {
    if (glReady.current && artworks.length > 0) {
      buildScene(glReady.current);
    }
  }, [artworks]);

  // =========================================
  // UPDATE CAMERA POSITION BASED ON ANGLES
  // =========================================
  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    
    const { theta, phi, radius } = cameraAngle.current;
    const x = radius * Math.sin(theta) * Math.cos(phi);
    const y = radius * Math.sin(phi) + 1.2; // Keep camera at comfortable height
    const z = radius * Math.cos(theta) * Math.cos(phi);
    
    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(0, 0.8, 0);
  };

  // =========================================
  // BUILD 3D SCENE
  // =========================================

  const buildScene = async (gl: any) => {
    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;

    // =========================================
    // RENDERER WITH SHADOWS
    // =========================================

    const renderer = new Renderer({ gl });
    renderer.setSize(width, height);
    renderer.setClearColor(0x0a0a1a);
    renderer.shadowMap.enabled = true; // Enable shadows for realism
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // =========================================
    // SCENE
    // =========================================

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    scene.fog = new THREE.FogExp2(0x0a0a1a, 0.008); // Subtle fog for depth
    sceneRef.current = scene;

    // =========================================
    // CAMERA
    // =========================================

    const camera = new THREE.PerspectiveCamera(
      55,
      width / height,
      0.05,
      1000
    );
    cameraRef.current = camera;
    
    // Set initial camera position based on angles
    updateCameraPosition();

    // =========================================
    // LIGHTS - Realistic gallery lighting
    // =========================================

    // Ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
    scene.add(ambientLight);

    // Main directional light (simulating ceiling spotlights)
    const mainLight = new THREE.DirectionalLight(0xfff5e6, 1.2);
    mainLight.position.set(3, 5, 2);
    mainLight.castShadow = true;
    mainLight.receiveShadow = false;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 12;
    mainLight.shadow.camera.left = -5;
    mainLight.shadow.camera.right = 5;
    mainLight.shadow.camera.top = 5;
    mainLight.shadow.camera.bottom = -5;
    scene.add(mainLight);

    // Fill light from below and back
    const fillLight = new THREE.PointLight(0xccaa88, 0.4);
    fillLight.position.set(0, -1, 0);
    fillLight.castShadow = false;
    scene.add(fillLight);

    // Warm accent lights for artworks
    const accentLight1 = new THREE.PointLight(0xffaa66, 0.5);
    accentLight1.position.set(-3, 1.5, -2);
    scene.add(accentLight1);
    
    const accentLight2 = new THREE.PointLight(0xffaa66, 0.5);
    accentLight2.position.set(3, 1.5, 2);
    scene.add(accentLight2);

    // Small decorative lights on ceiling
    const ceilingLights = [];
    for (let i = -3; i <= 3; i++) {
      const light = new THREE.PointLight(0xffdd99, 0.3);
      light.position.set(i * 2, 3.8, i * 1.5);
      light.castShadow = false;
      scene.add(light);
      ceilingLights.push(light);
    }

    // =========================================
    // MATERIALS - Premium finishes
    // =========================================

    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xf0ede8,
      roughness: 0.4,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });

    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b5a2b,
      roughness: 0.7,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });

    const ceilingMaterial = new THREE.MeshStandardMaterial({
      color: 0xe8e4db,
      roughness: 0.6,
      metalness: 0.02,
      side: THREE.DoubleSide,
    });

    const trimMaterial = new THREE.MeshStandardMaterial({
      color: 0xcbb99a,
      roughness: 0.3,
      metalness: 0.15,
    });

    // =========================================
    // FLOOR WITH GRID TEXTURE (simulated wood)
    // =========================================

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      floorMaterial
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Wood plank lines (more realistic)
    for (let i = -9; i <= 9; i++) {
      const plankLine = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.02, 19.8),
        new THREE.MeshStandardMaterial({ color: 0x6b4c2c, roughness: 0.8 })
      );
      plankLine.position.set(i, -1.98, 0);
      plankLine.receiveShadow = true;
      scene.add(plankLine);
    }
    
    for (let i = -8; i <= 8; i++) {
      const crossLine = new THREE.Mesh(
        new THREE.BoxGeometry(19.8, 0.02, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x6b4c2c, roughness: 0.8 })
      );
      crossLine.position.set(0, -1.98, i);
      crossLine.receiveShadow = true;
      scene.add(crossLine);
    }

    // =========================================
    // CEILING with decorative molding
    // =========================================

    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      ceilingMaterial
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 3.8;
    ceiling.receiveShadow = false;
    scene.add(ceiling);

    // Crown molding
    const moldingGeometry = new THREE.BoxGeometry(20, 0.12, 0.3);
    const backMolding = new THREE.Mesh(moldingGeometry, trimMaterial);
    backMolding.position.set(0, 3.7, -9.85);
    scene.add(backMolding);
    
    const frontMolding = new THREE.Mesh(moldingGeometry, trimMaterial);
    frontMolding.position.set(0, 3.7, 9.85);
    scene.add(frontMolding);
    
    const leftMolding = new THREE.Mesh(moldingGeometry, trimMaterial);
    leftMolding.rotation.y = Math.PI / 2;
    leftMolding.position.set(-9.85, 3.7, 0);
    scene.add(leftMolding);
    
    const rightMolding = new THREE.Mesh(moldingGeometry, trimMaterial);
    rightMolding.rotation.y = Math.PI / 2;
    rightMolding.position.set(9.85, 3.7, 0);
    scene.add(rightMolding);

    // =========================================
    // WALLS with baseboards
    // =========================================

    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 6),
      wallMaterial
    );
    backWall.position.set(0, 1, -9.9);
    backWall.receiveShadow = true;
    scene.add(backWall);

    const frontWall = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 6),
      wallMaterial
    );
    frontWall.rotation.y = Math.PI;
    frontWall.position.set(0, 1, 9.9);
    frontWall.receiveShadow = true;
    scene.add(frontWall);

    const leftWall = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 6),
      wallMaterial
    );
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-9.9, 1, 0);
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 6),
      wallMaterial
    );
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(9.9, 1, 0);
    rightWall.receiveShadow = true;
    scene.add(rightWall);

    // Baseboards
    const baseboardGeo = new THREE.BoxGeometry(20, 0.12, 0.15);
    const addBaseboard = (yPos: number, zPos: number, rotY = 0) => {
      const board = new THREE.Mesh(baseboardGeo, trimMaterial);
      board.position.set(0, yPos, zPos);
      if (rotY) board.rotation.y = rotY;
      board.receiveShadow = true;
      scene.add(board);
    };
    
    addBaseboard(-1.45, -9.85);
    addBaseboard(-1.45, 9.85);
    const sideBoardGeo = new THREE.BoxGeometry(20, 0.12, 0.15);
    const leftBoard = new THREE.Mesh(sideBoardGeo, trimMaterial);
    leftBoard.rotation.y = Math.PI / 2;
    leftBoard.position.set(-9.85, -1.45, 0);
    scene.add(leftBoard);
    
    const rightBoard = new THREE.Mesh(sideBoardGeo, trimMaterial);
    rightBoard.rotation.y = Math.PI / 2;
    rightBoard.position.set(9.85, -1.45, 0);
    scene.add(rightBoard);

    // =========================================
    // CENTER PLATFORM (marble look)
    // =========================================

    const platformMaterial = new THREE.MeshStandardMaterial({
      color: 0xd6cfc4,
      roughness: 0.25,
      metalness: 0.4,
    });
    const platform = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 0.6, 3.2),
      platformMaterial
    );
    platform.position.set(0, -1.7, 0);
    platform.castShadow = true;
    platform.receiveShadow = true;
    scene.add(platform);

    // =========================================
    // SCULPTURE (rotating art piece)
    // =========================================

    const sculptureMaterial = new THREE.MeshStandardMaterial({
      color: 0xcaa24a,
      metalness: 0.7,
      roughness: 0.3,
      emissive: 0x331c00,
    });
    const sculptureBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.9, 0.4, 8),
      sculptureMaterial
    );
    sculptureBase.position.set(0, -0.95, 0);
    sculptureBase.castShadow = true;
    scene.add(sculptureBase);
    
    const sculptureBody = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.65, 0.12, 64, 8, 2, 3),
      sculptureMaterial
    );
    sculptureBody.position.set(0, -0.45, 0);
    sculptureBody.castShadow = true;
    scene.add(sculptureBody);
    
    const sculptureTop = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 16, 16),
      sculptureMaterial
    );
    sculptureTop.position.set(0, 0.15, 0);
    sculptureTop.castShadow = true;
    scene.add(sculptureTop);

    // =========================================
    // BENCHES (modern wooden benches)
    // =========================================

    const benchMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b5a2b,
      roughness: 0.6,
      metalness: 0.05,
    });
    
    const createBench = (x: number, z: number, rotation: number = 0) => {
      const benchSeat = new THREE.Mesh(
        new THREE.BoxGeometry(2.8, 0.2, 1),
        benchMaterial
      );
      benchSeat.position.set(x, -1.25, z);
      benchSeat.rotation.y = rotation;
      benchSeat.castShadow = true;
      benchSeat.receiveShadow = true;
      scene.add(benchSeat);
      
      const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.2), benchMaterial);
      leg1.position.set(x - 1.1, -1.55, z - 0.4);
      leg1.castShadow = true;
      scene.add(leg1);
      
      const leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.2), benchMaterial);
      leg2.position.set(x + 1.1, -1.55, z - 0.4);
      leg2.castShadow = true;
      scene.add(leg2);
      
      const leg3 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.2), benchMaterial);
      leg3.position.set(x - 1.1, -1.55, z + 0.4);
      leg3.castShadow = true;
      scene.add(leg3);
      
      const leg4 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.2), benchMaterial);
      leg4.position.set(x + 1.1, -1.55, z + 0.4);
      leg4.castShadow = true;
      scene.add(leg4);
    };

    createBench(-5, 5.5, 0.2);
    createBench(5, -5.5, -0.2);
    createBench(-5.5, -4, 0.8);
    createBench(5.5, 4, -0.8);

    // =========================================
    // TEXTURE LOADER WITH PROGRESS
    // =========================================

    const loader = new TextureLoader();

    // Helper: offset image slightly forward from frame
    const getImageOffset = (artwork: any) => {
      const offset = 0.08;
      const rotY = artwork.rotationY || 0;
      // Determine direction based on rotation
      if (Math.abs(rotY - Math.PI / 2) < 0.1) return { x: offset, z: 0 };
      if (Math.abs(rotY + Math.PI / 2) < 0.1) return { x: -offset, z: 0 };
      if (Math.abs(rotY) < 0.1) return { x: 0, z: offset };
      if (Math.abs(rotY - Math.PI) < 0.1) return { x: 0, z: -offset };
      return { x: 0, z: offset };
    };

    // =========================================
    // LOAD IMAGES WITH ELEGANT FRAMES
    // =========================================

    for (const artwork of artworks) {
      try {
        let imageUrl = artwork.imageUrl
          .replace("127.0.0.1", "192.168.1.95")
          .replace("localhost", "192.168.1.95");

        console.log("LOADING:", imageUrl);

        // Premium frame material (gold/wood)
        const frameMaterial = new THREE.MeshStandardMaterial({
          color: 0xc9aa6f,
          metalness: 0.6,
          roughness: 0.3,
        });
        
        const frameDepth = 0.12;
        const frameWidth = 3.0;
        const frameHeight = 2.0;
        
        // Main frame back
        const frame = new THREE.Mesh(
          new THREE.BoxGeometry(frameWidth, frameHeight, frameDepth),
          frameMaterial
        );
        frame.position.set(
          artwork.positionX,
          artwork.positionY,
          artwork.positionZ
        );
        frame.rotation.set(
          artwork.rotationX || 0,
          artwork.rotationY || 0,
          artwork.rotationZ || 0
        );
        frame.castShadow = true;
        scene.add(frame);

        // Decorative inner rim (gold trim)
        const rimMaterial = new THREE.MeshStandardMaterial({
          color: 0xe5c88a,
          metalness: 0.85,
          roughness: 0.2,
        });
        const rimDepth = 0.03;
        const rimWidth = frameWidth - 0.25;
        const rimHeight = frameHeight - 0.25;
        const rim = new THREE.Mesh(
          new THREE.BoxGeometry(rimWidth, rimHeight, rimDepth),
          rimMaterial
        );
        rim.position.set(
          artwork.positionX,
          artwork.positionY,
          artwork.positionZ
        );
        rim.rotation.set(
          artwork.rotationX || 0,
          artwork.rotationY || 0,
          artwork.rotationZ || 0
        );
        scene.add(rim);

        // Load texture
        const texture = await loader.loadAsync(imageUrl);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        
        const imageMaterial = new THREE.MeshStandardMaterial({
          map: texture,
          side: THREE.DoubleSide,
          roughness: 0.2,
          metalness: 0.05,
        });

        const imageMesh = new THREE.Mesh(
          new THREE.PlaneGeometry(2.6, 1.6),
          imageMaterial
        );
        
        // Position image slightly in front of frame
        const offset = getImageOffset(artwork);
        imageMesh.position.set(
          artwork.positionX + offset.x,
          artwork.positionY,
          artwork.positionZ + offset.z
        );
        imageMesh.rotation.set(
          artwork.rotationX || 0,
          artwork.rotationY || 0,
          artwork.rotationZ || 0
        );
        imageMesh.castShadow = false;
        scene.add(imageMesh);

        // Add a subtle glow effect using a point light for important artworks?
        if (artwork.price && artwork.price > 1000) {
          const accentLight = new THREE.PointLight(0xffaa77, 0.4, 4);
          accentLight.position.set(
            artwork.positionX + offset.x * 2,
            artwork.positionY - 0.2,
            artwork.positionZ + offset.z * 2
          );
          scene.add(accentLight);
        }

        console.log("IMAGE ADDED:", artwork.title);
      } catch (err) {
        console.log("TEXTURE ERROR:", err);
      }
    }

    // Add floating particles for atmosphere
    const particleCount = 400;
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesPositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlesPositions[i*3] = (Math.random() - 0.5) * 18;
      particlesPositions[i*3+1] = Math.random() * 4 - 1;
      particlesPositions[i*3+2] = (Math.random() - 0.5) * 18;
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlesPositions, 3));
    const particlesMaterial = new THREE.PointsMaterial({
      color: 0xd4c5a0,
      size: 0.03,
      transparent: true,
      opacity: 0.4,
    });
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // =========================================
    // ANIMATION LOOP
    // =========================================
    let lastTimestamp = 0;
    const render = (timestamp: number) => {
      requestAnimationFrame(render);
      
      // Animate sculpture and particles
      const time = timestamp * 0.002;
      sculptureBody.rotation.y = time * 0.8;
      sculptureBody.rotation.x = Math.sin(time * 0.5) * 0.2;
      sculptureTop.position.y = 0.15 + Math.sin(time * 2) * 0.02;
      particles.rotation.y += 0.002;
      
      // Pulsing accent lights
      const intensity = 0.4 + Math.sin(time * 1.5) * 0.1;
      accentLight1.intensity = intensity;
      accentLight2.intensity = intensity;
      
      if (cameraRef.current) {
        cameraRef.current.aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
        cameraRef.current.updateProjectionMatrix();
        renderer.render(scene, cameraRef.current);
        gl.endFrameEXP();
      } else {
        renderer.render(scene, camera);
        gl.endFrameEXP();
      }
    };

    render(0);
  };

  // =========================================
  // GL INIT
  // =========================================

  const onContextCreate = async (gl: any) => {
    glReady.current = gl;
    if (artworks.length > 0) {
      buildScene(gl);
    }
  };

  // =========================================
  // TOUCH CONTROLS FOR CAMERA ROTATION
  // =========================================
  
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      isDragging.current = true;
      lastTouchPos.current = { x: evt.nativeEvent.locationX, y: evt.nativeEvent.locationY };
    },
    onPanResponderMove: (evt) => {
      if (!isDragging.current || !cameraRef.current) return;
      
      const deltaX = evt.nativeEvent.locationX - lastTouchPos.current.x;
      const deltaY = evt.nativeEvent.locationY - lastTouchPos.current.y;
      
      // Update camera angles based on drag
      cameraAngle.current.theta += deltaX * 0.008;
      cameraAngle.current.phi += deltaY * 0.008;
      
      // Clamp vertical angle to avoid flipping
      cameraAngle.current.phi = Math.max(-0.8, Math.min(0.8, cameraAngle.current.phi));
      
      updateCameraPosition();
      
      lastTouchPos.current = { x: evt.nativeEvent.locationX, y: evt.nativeEvent.locationY };
    },
    onPanResponderRelease: () => {
      isDragging.current = false;
    },
  });

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      <GLView
        style={{ flex: 1 }}
        onContextCreate={onContextCreate}
      />
    </View>
  );
}