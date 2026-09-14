import * as THREE from "three";

// Curva de boca ao longo do comprimento (0 = popa/proa, 1 = boca cheia) —
// corpo médio paralelo largo, afinando suavemente nas extremidades,
// igual ao observado nos conveses de arranjo geral e nas fotos reais
// (proa/popa arredondadas, casco reto no meio).
function beamFactor(t) {
  const bow = 1 - Math.pow(Math.max(0, t - 0.55) / 0.45, 2.2);
  const stern = 1 - Math.pow(Math.max(0, -t - 0.55) / 0.45, 2.2);
  return Math.max(0.08, Math.min(1, Math.min(bow, stern)));
}

export function buildHullFootprintShape(loa, beam) {
  const halfLoa = loa / 2;
  const halfBeam = beam / 2;
  const sections = 28;
  const shape = new THREE.Shape();
  for (let i = 0; i <= sections; i++) {
    const t = (i / sections) * 2 - 1;
    const x = t * halfLoa;
    const y = beamFactor(t) * halfBeam;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  for (let i = sections; i >= 0; i--) {
    const t = (i / sections) * 2 - 1;
    const x = t * halfLoa;
    const y = -beamFactor(t) * halfBeam;
    shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

function extrudeSection(shape, { height, yBottom, bevelTop, bevelBottom }) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: bevelTop || bevelBottom,
    bevelThickness: height * 0.06,
    bevelSize: 0.1,
    bevelSegments: 2,
    curveSegments: 1,
  });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, yBottom, 0);
  return geo;
}

// Casco "pintado" em 2 seções (antiincrustante abaixo da linha d'água +
// casco acima) mais uma faixa de acabamento — reproduzindo o esquema de
// pintura visto nas fotos reais de cada embarcação, em vez de um casco
// de cor única.
export function buildPaintedHull(dims, livery) {
  const group = new THREE.Group();
  const shape = buildHullFootprintShape(dims.loa, dims.beam);

  const bottomY = -dims.draft;
  const stripeH = Math.max(0.12, dims.depth * 0.04);
  const topY = dims.depth - dims.draft;

  const belowGeo = extrudeSection(shape, {
    height: dims.draft,
    yBottom: bottomY,
    bevelBottom: true,
  });
  const belowMat = new THREE.MeshStandardMaterial({
    color: livery.belowWaterColor,
    roughness: 0.75,
    metalness: 0.05,
  });
  const below = new THREE.Mesh(belowGeo, belowMat);
  below.castShadow = true;
  below.receiveShadow = true;
  group.add(below);

  const stripeGeo = extrudeSection(shape, { height: stripeH, yBottom: 0 });
  const stripeMat = new THREE.MeshStandardMaterial({
    color: livery.stripeColor,
    roughness: 0.5,
  });
  const stripe = new THREE.Mesh(stripeGeo, stripeMat);
  group.add(stripe);

  const aboveGeo = extrudeSection(shape, {
    height: topY - stripeH,
    yBottom: stripeH,
    bevelTop: true,
  });
  const aboveMat = new THREE.MeshStandardMaterial({
    color: livery.hullColor,
    roughness: 0.55,
    metalness: 0.1,
  });
  const above = new THREE.Mesh(aboveGeo, aboveMat);
  above.castShadow = true;
  above.receiveShadow = true;
  group.add(above);

  return group;
}
