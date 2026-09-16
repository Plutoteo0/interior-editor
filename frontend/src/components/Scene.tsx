import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createRoom } from "../three/createRoom";
import PromptForm from "./PromptForm";
import type { HistoryEntry } from "../types";
import Toolbar from "./Toolbar";
import HistoryPanel from "./HistoryPanel";

export default function Scene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const targetMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const hoveredRef = useRef<THREE.Mesh | null>(null);
  const selectedRef = useRef<THREE.Mesh | null>(null);
  const selectionOutlineRef = useRef<THREE.LineSegments | null>(null);
  const activeToolRef = useRef<"select" | "move">("select");
  const controlsRef = useRef<OrbitControls | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [historyBySurface, setHistoryBySurface] = useState<
    Record<string, HistoryEntry[]>
  >({});
  const [activeTool, setActiveTool] = useState<"select" | "move">("select");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

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
    controlsRef.current = controls;

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(3, 5, 2);
    scene.add(light);
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const { room, floorMaterial, floorMesh } = createRoom();
    targetMaterialRef.current = floorMaterial;
    selectedRef.current = floorMesh;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerDownPos: { x: number; y: number } | null = null;

    function handlePointerDown(event: MouseEvent) {
      pointerDownPos = { x: event.clientX, y: event.clientY };
    }

    function handleClick(event: MouseEvent) {
      if (activeToolRef.current !== "select") return;
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
          setIsGenerateOpen(false);
        } else {
          selectedRef.current = mesh;
          targetMaterialRef.current =
            mesh.material as THREE.MeshStandardMaterial;
          selectMesh(mesh);
          setIsGenerateOpen(true);
        }
      } else {
        selectedRef.current = null;
        selectionOutline.visible = false;
        targetMaterialRef.current = null;
        setIsGenerateOpen(false);
      }
    }

    function handlePointerMove(event: MouseEvent) {
      if (activeToolRef.current !== "select") {
        if (hoveredRef.current) {
          highlightMesh.visible = false;
          renderer.domElement.style.cursor = "default";
          hoveredRef.current = null;
        }
        return;
      }
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

    function handleWheel(event: WheelEvent) {
      event.preventDefault();
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      const step = 0.5;
      const distanceToTarget = camera.position.distanceTo(controls.target);
      const minDistance = 1;
      const maxDistance = 20;
      if (event.deltaY < 0 && distanceToTarget > minDistance) {
        camera.position.addScaledVector(direction, step);
      } else if (event.deltaY > 0 && distanceToTarget < maxDistance) {
        camera.position.addScaledVector(direction, -step);
      }
    }

    renderer.domElement.addEventListener("click", handleClick);
    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("wheel", handleWheel, {
      passive: false,
    });
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
    selectionOutlineRef.current = selectionOutline;
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
      renderer.domElement.removeEventListener("wheel", handleWheel);
    };
  }, []);

  useEffect(() => {
    activeToolRef.current = activeTool;
    if (controlsRef.current) {
      if (activeTool === "move") {
        controlsRef.current.mouseButtons.LEFT = THREE.MOUSE.PAN;
        controlsRef.current.mouseButtons.RIGHT = THREE.MOUSE.ROTATE;
      } else {
        controlsRef.current.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
        controlsRef.current.mouseButtons.RIGHT = THREE.MOUSE.PAN;
      }
    }
  }, [activeTool]);

  async function applyTextureToMaterial(
    mesh: THREE.Mesh,
    imageBase64: string,
  ): Promise<void> {
    const material = mesh.material as THREE.MeshStandardMaterial;
    const geometry = mesh.geometry as THREE.PlaneGeometry;
    const image = new Image();
    image.src = `data:image/png;base64,${imageBase64}`;
    return image.decode().then(() => {
      const texture = new THREE.Texture(image);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      const tileSize = 2;
      const { width, height } = geometry.parameters;
      texture.repeat.set(width / tileSize, height / tileSize);
      texture.needsUpdate = true;
      material.map = texture;
      material.needsUpdate = true;
    });
  }

  async function handleGenerate() {
    if (!targetMaterialRef.current || !selectedRef.current) return;
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
      await applyTextureToMaterial(selectedRef.current, data.image);
      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        prompt,
        imageBase64: data.image,
        timestamp: Date.now(),
      };
      const surfaceId = selectedRef.current.uuid;
      setHistoryBySurface((prev) => ({
        ...prev,
        [surfaceId]: [entry, ...(prev[surfaceId] ?? [])],
      }));
    } finally {
      setIsLoading(false);
    }
  }

  function handleApplyFromHistory(entry: HistoryEntry) {
    if (!selectedRef.current) return;
    applyTextureToMaterial(selectedRef.current, entry.imageBase64);
  }

  function handleResetMaterial() {
    if (!selectedRef.current) return;
    const material = selectedRef.current.material as THREE.MeshStandardMaterial;
    material.map = null;
    material.needsUpdate = true;
  }

  function handleSelectTool() {
    setActiveTool("select");
  }

  function handleMoveTool() {
    setActiveTool((prev) => {
      if (prev !== "move") {
        selectedRef.current = null;
        targetMaterialRef.current = null;
        if (selectionOutlineRef.current)
          selectionOutlineRef.current.visible = false;
        setIsGenerateOpen(false);
      }
      return "move";
    });
  }

  return (
    <>
      <div ref={containerRef} style={{ width: "100vw", height: "100vh" }} />
      {isGenerateOpen && (
        <div className="prompt-panel">
          <PromptForm
            prompt={prompt}
            onPromptChange={setPrompt}
            onGenerate={handleGenerate}
            isLoading={isLoading}
          />
        </div>
      )}
      <Toolbar
        activeTool={activeTool}
        onSelectClick={handleSelectTool}
        onMoveClick={handleMoveTool}
        isGenerateOpen={isGenerateOpen}
        onGenerateClick={() => setIsGenerateOpen((v) => !v)}
        isHistoryOpen={isHistoryOpen}
        onHistoryClick={() => setIsHistoryOpen((v) => !v)}
        hasSelection={selectedRef.current !== null}
        onResetClick={handleResetMaterial}
      />
      {isHistoryOpen && (
        <HistoryPanel
          entries={historyBySurface[selectedRef.current?.uuid ?? ""] ?? []}
          onSelectEntry={handleApplyFromHistory}
        />
      )}
    </>
  );
}
