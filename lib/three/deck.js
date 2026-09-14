import * as THREE from "three";
import { COMPARTMENT_COLORS } from "@/lib/vessels";
import { computeDeckBounds } from "@/lib/three/bounds";
import { FURNITURE_BY_TYPE } from "@/lib/three/furniture";

const WALL_H = 1.15;
const WALL_THICK = 0.1;

function tint(hex, amount) {
  const c = new THREE.Color(hex);
  const white = new THREE.Color(0xffffff);
  return c.lerp(white, amount);
}

// Um compartimento vira uma "sala" de verdade: piso tingido pela cor do
// tipo, 4 paredes baixas (dá pra ver o conteúdo de cima, tipo planta
// baixa em 3D) e móveis representativos do tipo (bancos, carros, beliches,
// console de comando...) — nada de bloco sólido cobrindo o espaço inteiro.
function buildCompartment(c, deckZ, deckCode, deckName) {
  const group = new THREE.Group();
  group.userData = { kind: "compartment", name: c.name, type: c.type, deckCode, deckName };
  const baseColor = COMPARTMENT_COLORS[c.type] || "#8ac640";
  const floorColor = tint(baseColor, 0.72);
  const wallColor = tint(baseColor, 0.35);

  const floorGeo = new THREE.BoxGeometry(c.l, 0.06, c.w);
  const floorMat = new THREE.MeshStandardMaterial({ color: floorColor, roughness: 0.85 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.set(c.x, deckZ + 0.12 + 0.03, c.y);
  floor.receiveShadow = true;
  group.add(floor);

  const wallMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.7 });
  const wallY = deckZ + 0.12 + WALL_H / 2 + 0.06;
  const longWallGeo = new THREE.BoxGeometry(c.l, WALL_H, WALL_THICK);
  const shortWallGeo = new THREE.BoxGeometry(WALL_THICK, WALL_H, c.w);
  const walls = [
    { geo: longWallGeo, x: c.x, y: wallY, z: c.y - c.w / 2 },
    { geo: longWallGeo, x: c.x, y: wallY, z: c.y + c.w / 2 },
    { geo: shortWallGeo, x: c.x - c.l / 2, y: wallY, z: c.y },
    { geo: shortWallGeo, x: c.x + c.l / 2, y: wallY, z: c.y },
  ];
  walls.forEach(({ geo, x, y, z }) => {
    const wall = new THREE.Mesh(geo, wallMat);
    wall.position.set(x, y, z);
    wall.castShadow = true;
    group.add(wall);
  });

  const buildFurniture = FURNITURE_BY_TYPE[c.type];
  if (buildFurniture) {
    const innerW = Math.max(0.5, c.w - WALL_THICK * 3);
    const innerL = Math.max(0.5, c.l - WALL_THICK * 3);
    const furniture = buildFurniture(innerW, innerL);
    furniture.position.set(c.x, deckZ + 0.12 + 0.06, c.y);
    furniture.traverse((obj) => {
      if (obj.isMesh) obj.castShadow = true;
    });
    group.add(furniture);
  }

  return group;
}

export function buildDeckGroup(deck, dims) {
  const group = new THREE.Group();
  group.name = `deck-${deck.code}`;

  const { minX, maxX, minY, maxY } = computeDeckBounds(deck, dims);

  const floorW = maxY - minY;
  const floorL = maxX - minX;
  const floorGeo = new THREE.BoxGeometry(floorL, 0.12, floorW);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0xe9e4d4,
    roughness: 0.92,
    metalness: 0.02,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.set((minX + maxX) / 2, deck.z, (minY + maxY) / 2);
  floor.receiveShadow = true;
  floor.userData = { kind: "deck-floor", deckCode: deck.code, deckName: deck.name };
  group.add(floor);

  // Grade técnica sutil no piso (referência tipo planta de arranjo geral)
  const grid = new THREE.GridHelper(
    Math.max(floorL, floorW),
    Math.round(Math.max(floorL, floorW) / 3),
    0x0a4a7d,
    0xcfc9b4
  );
  grid.position.set((minX + maxX) / 2, deck.z + 0.065, (minY + maxY) / 2);
  grid.material.opacity = 0.15;
  grid.material.transparent = true;
  group.add(grid);

  deck.compartments.forEach((c) => {
    const compGroup = buildCompartment(c, deck.z, deck.code, deck.name);
    group.add(compGroup);
  });

  group.userData.bounds = { minX, maxX, minY, maxY };
  return group;
}
