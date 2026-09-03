import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createRoom } from "../three/createRoom";
import PromptForm from "./PromptForm";

export default function Scene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const targetMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const hoveredRef = useRef<THREE.Mesh | null>(null);
  const selectedRef = useRef<THREE.Mesh | null>(null);
  const [prompt, setPrompt] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
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
    let pointerDownPos: { x: number; y: number } | null = null;

    function handlePointerDown(event: MouseEvent) {
      pointerDownPos = { x: event.clientX, y: event.clientY };
    }

    function handleClick(event: MouseEvent) {
      if (pointerDownPos) {
        const dx = event.clientX - pointerDownPos.x;
        const dy = event.clientY - pointerDownPos.y;
        if (Math.hypot(dx, dy) > 5) return;
      }

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(room.children);

      if (intersects.length > 0) {
        const mesh = intersects[0].object as THREE.Mesh;
        if (selectedRef.current === mesh) {
          selectedRef.current = null;
          selectionOutline.visible = false;
          targetMaterialRef.current = null;
          setPanelOpen(false);
        } else {
          selectedRef.current = mesh;
          targetMaterialRef.current =
            mesh.material as THREE.MeshStandardMaterial;
          selectMesh(mesh);
          setPanelOpen(true);
        }
      } else {
        selectedRef.current = null;
        selectionOutline.visible = false;
        targetMaterialRef.current = null;
        setPanelOpen(false);
      }
    }

    function handlePointerMove(event: MouseEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(room.children);
      const hit =
        intersects.length > 0 ? (intersects[0].object as THREE.Mesh) : null;
      if (hoveredRef.current === hit) return;

      if (hit) {
        moveHighlightTo(hit);
        renderer.domElement.style.cursor = "pointer";
      } else {
        highlightMesh.visible = false;
        renderer.domElement.style.cursor = "default";
      }

      hoveredRef.current = hit;
    }

    function moveHighlightTo(mesh: THREE.Mesh) {
      mesh.updateWorldMatrix(true, false);

      highlightMesh.geometry = mesh.geometry;
      highlightMesh.position.setFromMatrixPosition(mesh.matrixWorld);
      highlightMesh.quaternion.setFromRotationMatrix(mesh.matrixWorld);

      const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(
        highlightMesh.quaternion,
      );
      highlightMesh.position.addScaledVector(normal, 0.01);

      highlightMesh.visible = true;
    }

    function selectMesh(mesh: THREE.Mesh) {
      mesh.updateWorldMatrix(true, false);

      selectionOutline.geometry.dispose();
      selectionOutline.geometry = new THREE.EdgesGeometry(mesh.geometry);
      selectionOutline.position.setFromMatrixPosition(mesh.matrixWorld);
      selectionOutline.quaternion.setFromRotationMatrix(mesh.matrixWorld);

      const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(
        selectionOutline.quaternion,
      );
      selectionOutline.position.addScaledVector(normal, 0.01);

      selectionOutline.visible = true;
    }

    renderer.domElement.addEventListener("click", handleClick);
    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    scene.add(room);
    const highlightMesh = new THREE.Mesh<
      THREE.BufferGeometry,
      THREE.MeshBasicMaterial
    >(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    highlightMesh.visible = false;
    highlightMesh.renderOrder = 999;
    scene.add(highlightMesh);

    const selectionOutline = new THREE.LineSegments<
      THREE.BufferGeometry,
      THREE.LineBasicMaterial
    >(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(1, 1)),
      new THREE.LineBasicMaterial({ color: 0xc30010, depthTest: false }),
    );
    selectionOutline.visible = false;
    selectionOutline.renderOrder = 1000;
    scene.add(selectionOutline);

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
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      highlightMesh.material.dispose();
      selectionOutline.geometry.dispose();
      selectionOutline.material.dispose();
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
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
      {panelOpen && (
        <div className="prompt-panel">
          <PromptForm
            prompt={prompt}
            onPromptChange={setPrompt}
            onGenerate={handleGenerate}
            isLoading={isLoading}
          />
        </div>
      )}
    </>
  );
}
