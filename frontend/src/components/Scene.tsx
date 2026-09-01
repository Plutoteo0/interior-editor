import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createRoom } from "../three/createRoom";
import PromptForm from "./PromptForm";

export default function Scene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const targetMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    camera.position.set(0, 1.5, 5);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(3, 5, 2);
    scene.add(light);
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const { room, floorMaterial } = createRoom();
    targetMaterialRef.current = floorMaterial;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    function handleClick(event: MouseEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(room.children);

      if (intersects.length > 0) {
        const mesh = intersects[0].object as THREE.Mesh;
        targetMaterialRef.current = mesh.material as THREE.MeshStandardMaterial;
      }
    }
    renderer.domElement.addEventListener("click", handleClick);

    scene.add(room);

    let frameId: number;
    function animate() {
      controls.update();
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      controls.dispose();
      container.removeChild(renderer.domElement);
      renderer.dispose();
      renderer.domElement.removeEventListener("click", handleClick);
    };
  }, []);

  async function handleGenerate() {
    setIsLoading(true);
    try {
      const response = await fetch(
        "http://localhost:3001/api/generate-texture",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        },
      );
      const data = await response.json();

      const image = new Image();
      image.src = `data:image/png;base64,${data.image}`;
      await image.decode();

      const texture = new THREE.Texture(image);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(3, 3);
      texture.needsUpdate = true;

      if (targetMaterialRef.current) {
        targetMaterialRef.current.map = texture;
        targetMaterialRef.current.needsUpdate = true;
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <div ref={containerRef} style={{ width: "100vw", height: "100vh" }} />
      <PromptForm
        prompt={prompt}
        onPromptChange={setPrompt}
        onGenerate={handleGenerate}
        isLoading={isLoading}
      />
    </>
  );
}
