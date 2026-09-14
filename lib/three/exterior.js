import * as THREE from "three";
import { computeDeckBounds, isOpenDeck } from "@/lib/three/bounds";

// Casco de proa/popa arredondado (formato "cápsula") — a mesma silhueta
// observada nas plantas de arranjo geral para cada convés/casaria.
function roundedDeckShape(length, width) {
  const halfL = length / 2;
  const halfW = width / 2;
  const cap = Math.min(halfW * 0.95, halfL * 0.3);
  const shape = new THREE.Shape();
  shape.moveTo(-halfL + cap, halfW);
  shape.lineTo(halfL - cap, halfW);
  shape.quadraticCurveTo(halfL, halfW, halfL, halfW * 0.5);
  shape.quadraticCurveTo(halfL + cap * 0.15, 0, halfL, -halfW * 0.5);
  shape.quadraticCurveTo(halfL, -halfW, halfL - cap, -halfW);
  shape.lineTo(-halfL + cap, -halfW);
  shape.quadraticCurveTo(-halfL, -halfW, -halfL, -halfW * 0.5);
  shape.quadraticCurveTo(-halfL - cap * 0.15, 0, -halfL, halfW * 0.5);
  shape.quadraticCurveTo(-halfL, halfW, -halfL + cap, halfW);
  return { shape, cap };
}

let sharedWindowTexture = null;
function getWindowMaterial() {
  if (!sharedWindowTexture) {
    const canvas = document.createElement("canvas");
    canvas.width = 4;
    canvas.height = 4;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#0c2035";
    ctx.fillRect(0, 0, 4, 4);
    sharedWindowTexture = new THREE.CanvasTexture(canvas);
  }
  return new THREE.MeshStandardMaterial({
    color: 0x0c2035,
    emissive: 0x1c3a55,
    emissiveIntensity: 0.25,
    roughness: 0.25,
    metalness: 0.4,
  });
}

function addWindowStrip(group, { length, width, cap, deckZ, deckHeight, sparse }) {
  const windowW = sparse ? 1.1 : 0.85;
  const windowH = sparse ? 0.7 : 0.55;
  const gap = sparse ? 1.6 : 0.55;
  const usableLen = Math.max(0, length - cap * 2 - 2);
  if (usableLen < windowW) return;
  let count = Math.max(3, Math.floor(usableLen / (windowW + gap)));
  if (sparse) count = Math.min(count, 3);
  const spacing = usableLen / count;
  const startX = -usableLen / 2 + spacing / 2;
  const mat = getWindowMaterial();
  const geo = new THREE.PlaneGeometry(windowW, windowH);

  [1, -1].forEach((side) => {
    for (let i = 0; i < count; i++) {
      const x = startX + i * spacing;
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, deckZ + deckHeight * 0.58, side * (width / 2 + 0.02));
      mesh.rotation.y = side > 0 ? 0 : Math.PI;
      group.add(mesh);
    }
  });
}

function buildRailing(length, width, y) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xe9e4d4, roughness: 0.6 });
  const postH = 0.9;
  const { shape } = roundedDeckShape(length, width);
  const points = shape.getPoints(40);
  const railGeo = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(p.x, 0, p.y)),
      true
    ),
    80,
    0.04,
    6,
    true
  );
  const rail = new THREE.Mesh(railGeo, mat);
  rail.position.y = y + postH;
  group.add(rail);

  const postGeo = new THREE.CylinderGeometry(0.035, 0.035, postH, 6);
  for (let i = 0; i < points.length; i += 4) {
    const p = points[i];
    const post = new THREE.Mesh(postGeo, mat);
    post.position.set(p.x, y + postH / 2, p.y);
    group.add(post);
  }
  return group;
}

function buildDeckVolume(deck, dims, { withWindows, colorOverride, sparse }) {
  const group = new THREE.Group();
  const bounds = computeDeckBounds(deck, dims);
  const length = bounds.maxX - bounds.minX;
  const width = bounds.maxY - bounds.minY;
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cy = (bounds.minY + bounds.maxY) / 2;

  const { shape, cap } = roundedDeckShape(length, width);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: deck.height,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.06,
    bevelSegments: 2,
    curveSegments: 16,
  });
  geo.rotateX(-Math.PI / 2);
  geo.translate(cx, deck.z, cy);

  const mat = new THREE.MeshStandardMaterial({
    color: colorOverride || 0xf4f0e4,
    roughness: 0.45,
    metalness: 0.1,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = { kind: "exterior-deck", deckCode: deck.code, deckName: deck.name };
  group.add(mesh);

  if (withWindows) {
    addWindowStrip(group, { length, width, cap, deckZ: deck.z, deckHeight: deck.height, sparse });
  }

  return { group, bounds, length, width, cx, cy };
}

// Constrói o navio inteiro (casaria sólida, empilhada por convés, com
// faixas de janelas, passadiço/timoneira, mastro e amurada nos conveses
// abertos) para a visão "navio inteiro". É deliberadamente uma
// reconstrução fiel às proporções e ao empilhamento visto nas plantas,
// não um modelo CAD importado.
export function buildExteriorGroup(vessel, livery) {
  const group = new THREE.Group();
  group.name = "exterior";

  let topDeck = null;
  let topBounds = null;

  vessel.decks.forEach((deck, idx) => {
    const open = isOpenDeck(deck);
    // Convés de garagem (mais baixo, tipicamente maior/mais largo que a
    // casaria acima) fica com o casco lacrado, sem janelas — igual às
    // fotos reais, onde só a superestrutura de passageiros tem vidros.
    const isGarageDeck = deck.compartments.some((c) => c.type === "garagem");
    const color = isGarageDeck ? livery.hullColor : livery.houseColor;

    if (open) {
      // Convés aberto: só o piso + amurada, sem paredes — deixa a
      // silhueta "escalonada" real (tijupá, convés dos botes) visível.
      const bounds = computeDeckBounds(deck, vessel.dims);
      const length = bounds.maxX - bounds.minX;
      const width = bounds.maxY - bounds.minY;
      const cx = (bounds.minX + bounds.maxX) / 2;
      const cy = (bounds.minY + bounds.maxY) / 2;
      const { shape } = roundedDeckShape(length, width);
      const floorGeo = new THREE.ExtrudeGeometry(shape, {
        depth: 0.15,
        bevelEnabled: false,
        curveSegments: 16,
      });
      floorGeo.rotateX(-Math.PI / 2);
      floorGeo.translate(cx, deck.z, cy);
      const floorMat = new THREE.MeshStandardMaterial({ color: 0xe9e4d4, roughness: 0.8 });
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.userData = { kind: "exterior-deck", deckCode: deck.code, deckName: deck.name };
      group.add(floor);
      group.add(buildRailing(length, width, deck.z + 0.15));
      topDeck = deck;
      topBounds = { length, width, cx, cy };
    } else {
      const { group: volume, length, width, cx, cy } = buildDeckVolume(deck, vessel.dims, {
        withWindows: !isGarageDeck && livery.windowStyle !== "sparse",
        colorOverride: color,
        sparse: livery.windowStyle === "sparse",
      });
      group.add(volume);
      topDeck = deck;
      topBounds = { length, width, cx, cy };
    }
  });

  // Timoneira / passadiço: pequena cabine fechada no topo, um pouco mais
  // recuada que o convés de baixo, com mastro e antena de radar.
  if (topDeck) {
    const wheelhouseW = topBounds.width * 0.55;
    const wheelhouseL = Math.min(topBounds.length * 0.35, 8);
    const wheelhouseH = 2.4;
    const wz = topDeck.z + topDeck.height + 0.1;
    const { shape } = roundedDeckShape(wheelhouseL, wheelhouseW);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: wheelhouseH,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 2,
      curveSegments: 12,
    });
    geo.rotateX(-Math.PI / 2);
    geo.translate(topBounds.cx, wz, topBounds.cy);
    const mat = new THREE.MeshStandardMaterial({ color: livery.houseColor, roughness: 0.4 });
    const wheelhouse = new THREE.Mesh(geo, mat);
    wheelhouse.userData = { kind: "wheelhouse", name: "Passadiço / timoneira" };
    group.add(wheelhouse);
    addWindowStrip(group, {
      length: wheelhouseL,
      width: wheelhouseW,
      cap: Math.min(wheelhouseW * 0.9, wheelhouseL * 0.3),
      deckZ: wz,
      deckHeight: wheelhouseH,
    });

    // Asas de passadiço (bridge wings) — as plataformas laterais salientes
    // vistas nas fotos reais, para visibilidade lateral do timoneiro.
    const wingMat = new THREE.MeshStandardMaterial({ color: livery.houseColor, roughness: 0.6 });
    [1, -1].forEach((side) => {
      const wingGeo = new THREE.BoxGeometry(wheelhouseL * 0.5, 0.12, 0.7);
      const wing = new THREE.Mesh(wingGeo, wingMat);
      wing.position.set(
        topBounds.cx,
        wz + wheelhouseH * 0.35,
        topBounds.cy + side * (wheelhouseW / 2 + 0.35)
      );
      group.add(wing);
    });

    // Mastro + antena de radar
    const mastH = 3.2;
    const mastGeo = new THREE.CylinderGeometry(0.06, 0.08, mastH, 8);
    const mastMat = new THREE.MeshStandardMaterial({ color: 0xcfc9b4, roughness: 0.6 });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.set(topBounds.cx, wz + wheelhouseH + mastH / 2, topBounds.cy);
    group.add(mast);

    const radarGeo = new THREE.BoxGeometry(0.7, 0.08, 0.18);
    const radar = new THREE.Mesh(radarGeo, mastMat);
    radar.position.set(topBounds.cx, wz + wheelhouseH + mastH * 0.75, topBounds.cy);
    group.add(radar);
  }

  return group;
}

// Rampas de proa e popa do convés de veículos mais baixo — traço
// característico dos ferries "duplo-castelo" desta frota.
export function buildRamps(vessel) {
  const group = new THREE.Group();
  const garageDeck = vessel.decks.find((d) =>
    d.compartments.some((c) => c.type === "garagem")
  );
  if (!garageDeck) return group;

  const bounds = computeDeckBounds(garageDeck, vessel.dims);
  const rampWidth = Math.min(bounds.maxY - bounds.minY, vessel.dims.beam) * 0.5;
  const rampLen = Math.max(6, vessel.dims.beam * 0.7);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x3a3d42,
    roughness: 0.85,
    side: THREE.DoubleSide,
  });
  const geo = new THREE.PlaneGeometry(rampWidth, rampLen);

  [
    { x: bounds.maxX, dir: 1 },
    { x: bounds.minX, dir: -1 },
  ].forEach(({ x, dir }) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2 + dir * 0.55;
    mesh.position.set(x + dir * (rampLen * 0.42), garageDeck.z - rampLen * 0.28, 0);
    group.add(mesh);
  });

  return group;
}
