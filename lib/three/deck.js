import * as THREE from "three";
import { COMPARTMENT_COLORS } from "@/lib/vessels";
import { computeDeckBounds } from "@/lib/three/bounds";
import { FURNITURE_BY_TYPE } from "@/lib/three/furniture";

const WALL_THICK = 0.12;

function tint(hex, amount) {
  const c = new THREE.Color(hex);
  const white = new THREE.Color(0xffffff);
  return c.lerp(white, amount);
}

// Retângulo de cantos arredondados — usado tanto no piso quanto nas
// paredes do compartimento, pra fugir da silhueta de "caixa".
function roundedRectShape(l, w, r) {
  const hl = l / 2;
  const hw = w / 2;
  const rr = Math.max(0, Math.min(r, hl, hw));
  const s = new THREE.Shape();
  s.moveTo(-hl + rr, -hw);
  s.lineTo(hl - rr, -hw);
  s.quadraticCurveTo(hl, -hw, hl, -hw + rr);
  s.lineTo(hl, hw - rr);
  s.quadraticCurveTo(hl, hw, hl - rr, hw);
  s.lineTo(-hl + rr, hw);
  s.quadraticCurveTo(-hl, hw, -hl, hw - rr);
  s.lineTo(-hl, -hw + rr);
  s.quadraticCurveTo(-hl, -hw, -hl + rr, -hw);
  return s;
}

// Um compartimento vira uma "sala" de verdade: piso tingido pela cor do
// tipo, uma parede única arredondada (oca, com espessura real — não 4
// blocos retos) e alguns móveis representativos do tipo. Sem contagens
// exatas de lugares/veículos, só o suficiente pra sugerir o uso do
// espaço.
function buildCompartment(c, deckZ, deckCode, deckName, deckHeight) {
  const group = new THREE.Group();
  group.userData = { kind: "compartment", name: c.name, type: c.type, deckCode, deckName };

  const wallH = Math.min(2.3, Math.max(1.5, deckHeight * 0.85));
  const baseColor = COMPARTMENT_COLORS[c.type] || "#8ac640";
  const floorColor = tint(baseColor, 0.72);
  const wallColor = tint(baseColor, 0.3);
  const cornerR = Math.max(0.15, Math.min(0.5, Math.min(c.w, c.l) * 0.12));

  const floorShape = roundedRectShape(c.l, c.w, cornerR);
  const floorGeo = new THREE.ExtrudeGeometry(floorShape, {
    depth: 0.06,
    bevelEnabled: false,
    curveSegments: 8,
  });
  floorGeo.rotateX(-Math.PI / 2);
  floorGeo.translate(c.x, deckZ + 0.12, c.y);
  const floor = new THREE.Mesh(floorGeo, new THREE.MeshStandardMaterial({
    color: floorColor,
    roughness: 0.85,
  }));
  floor.receiveShadow = true;
  group.add(floor);

  const outer = roundedRectShape(c.l, c.w, cornerR);
  const inner = roundedRectShape(
    Math.max(0.2, c.l - WALL_THICK * 2),
    Math.max(0.2, c.w - WALL_THICK * 2),
    Math.max(0, cornerR - WALL_THICK)
  );
  outer.holes.push(inner);
  const wallGeo = new THREE.ExtrudeGeometry(outer, {
    depth: wallH,
    bevelEnabled: false,
    curveSegments: 8,
  });
  wallGeo.rotateX(-Math.PI / 2);
  wallGeo.translate(c.x, deckZ + 0.18, c.y);
  const wall = new THREE.Mesh(wallGeo, new THREE.MeshStandardMaterial({
    color: wallColor,
    roughness: 0.65,
  }));
  wall.castShadow = true;
  wall.receiveShadow = true;
  group.add(wall);

  const buildFurniture = FURNITURE_BY_TYPE[c.type];
  if (buildFurniture) {
    const innerW = Math.max(0.5, c.w - WALL_THICK * 3);
    const innerL = Math.max(0.5, c.l - WALL_THICK * 3);
    const furniture = buildFurniture(innerW, innerL);
    furniture.position.set(c.x, deckZ + 0.18, c.y);
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

  deck.compartments.forEach((c) => {
    const compGroup = buildCompartment(c, deck.z, deck.code, deck.name, deck.height);
    group.add(compGroup);
  });

  group.userData.bounds = { minX, maxX, minY, maxY };
  return group;
}
