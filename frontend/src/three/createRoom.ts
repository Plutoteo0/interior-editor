import * as THREE from "three";

export function createRoom(): {
  room: THREE.Group;
  floorMaterial: THREE.MeshStandardMaterial;
  floorMesh: THREE.Mesh;
} {
  const room = new THREE.Group();

  const floorGeometry = new THREE.PlaneGeometry(10, 10);
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  room.add(floor);

  const wallGeometry = new THREE.PlaneGeometry(10, 3);

  const backWall = new THREE.Mesh(
    wallGeometry,
    new THREE.MeshStandardMaterial({ color: 0xaaaaaa }),
  );
  backWall.position.set(0, 1.5, -5);
  room.add(backWall);

  const leftWall = new THREE.Mesh(
    wallGeometry,
    new THREE.MeshStandardMaterial({ color: 0xaaaaaa }),
  );
  leftWall.position.set(-5, 1.5, 0);
  leftWall.rotation.y = Math.PI / 2;
  room.add(leftWall);

  const rightWall = new THREE.Mesh(
    wallGeometry,
    new THREE.MeshStandardMaterial({ color: 0xaaaaaa }),
  );
  rightWall.position.set(5, 1.5, 0);
  rightWall.rotation.y = -Math.PI / 2;
  room.add(rightWall);

  return { room, floorMaterial, floorMesh: floor };
}
