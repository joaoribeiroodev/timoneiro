import * as THREE from "three";

// Móveis/objetos representativos por tipo de compartimento — poucos itens,
// formas arredondadas, cores discretas. O objetivo é sugerir o uso do
// espaço (bancos, carros, beliches, console) sem lotar a cena de peças
// repetidas: são símbolos, não um inventário exato de lugares/veículos.

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.08, ...opts });
}

function seat() {
  const g = new THREE.Group();
  const seatMat = mat(0xdfe6ea, { roughness: 0.75 });
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.14, 16), seatMat);
  pad.position.y = 0.42;
  g.add(pad);
  const back = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.32, 4, 10), seatMat);
  back.rotation.z = Math.PI / 2;
  back.scale.set(1, 1, 0.5);
  back.position.set(0, 0.68, -0.18);
  g.add(back);
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.05, 0.4, 8),
    mat(0x8a8f96, { metalness: 0.5, roughness: 0.4 })
  );
  stem.position.y = 0.2;
  g.add(stem);
  return g;
}

export function seatRows(w, l) {
  const group = new THREE.Group();
  const pitchX = 0.85;
  const pitchZ = 0.8;
  const marginX = 0.6;
  const marginZ = 0.6;
  const cols = Math.max(1, Math.floor((l - marginX * 2) / pitchX));
  const rows = Math.max(1, Math.floor((w - marginZ * 2) / pitchZ));
  const total = Math.min(cols * rows, 16);
  let n = 0;
  for (let r = 0; r < rows && n < total; r++) {
    for (let c = 0; c < cols && n < total; c++) {
      const s = seat();
      s.position.set(c * pitchX - ((cols - 1) * pitchX) / 2, 0, r * pitchZ - ((rows - 1) * pitchZ) / 2);
      s.rotation.y = Math.PI;
      group.add(s);
      n++;
    }
  }
  return group;
}

function car() {
  const g = new THREE.Group();
  const palette = [0xb9c3cc, 0xaeb7be, 0xc7cdd2, 0x9fb0bd];
  const color = palette[Math.floor(Math.random() * palette.length)];
  const bodyMat = mat(color, { metalness: 0.35, roughness: 0.35 });
  const glassMat = mat(0x16222c, { metalness: 0.5, roughness: 0.25 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.55, 2.9, 4, 12), bodyMat);
  body.rotation.z = Math.PI / 2;
  body.scale.set(1, 1, 0.78);
  body.position.y = 0.5;
  g.add(body);
  const cabin = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 1.5, 4, 10), glassMat);
  cabin.rotation.z = Math.PI / 2;
  cabin.scale.set(1, 0.85, 0.85);
  cabin.position.set(-0.1, 0.92, 0);
  g.add(cabin);
  return g;
}

export function carLanes(w, l) {
  const group = new THREE.Group();
  const carW = 2.2;
  const carL = 4.6;
  const lanes = Math.max(1, Math.floor(w / carW));
  const perLane = Math.max(1, Math.floor(l / carL));
  const usedW = lanes * carW;
  const usedL = perLane * carL;
  const maxCars = 10;
  const totalSlots = lanes * perLane;
  const stride = Math.max(1, Math.ceil(totalSlots / maxCars));
  let slot = 0;
  for (let lane = 0; lane < lanes; lane++) {
    for (let i = 0; i < perLane; i++) {
      slot++;
      if (slot % stride !== 0) continue;
      const c = car();
      c.position.set(i * carL - usedL / 2 + carL / 2, 0, lane * carW - usedW / 2 + carW / 2);
      group.add(c);
    }
  }
  return group;
}

export function engineRoom(w, l) {
  const group = new THREE.Group();
  const engineMat = mat(0x8a8f96, { metalness: 0.5, roughness: 0.4 });
  const block = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 1.1, 16), engineMat);
  block.rotation.z = Math.PI / 2;
  block.position.set(0, 0.6, 0);
  group.add(block);
  const manifold = new THREE.Mesh(
    new THREE.TorusGeometry(0.5, 0.06, 8, 20),
    mat(0xc1462f, { metalness: 0.4, roughness: 0.4 })
  );
  manifold.position.set(0, 1.05, 0);
  group.add(manifold);
  return group;
}

function bunk() {
  const g = new THREE.Group();
  const frameMat = mat(0x8fa9c2, { roughness: 0.55 });
  const matMat = mat(0xefe9db, { roughness: 0.85 });
  [0, 0.72].forEach((y) => {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.06, 1.8), frameMat);
    frame.position.y = 0.32 + y;
    g.add(frame);
    const mattress = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 1.2, 4, 8), matMat);
    mattress.rotation.z = Math.PI / 2;
    mattress.scale.set(1, 1, 0.5);
    mattress.position.y = 0.42 + y;
    g.add(mattress);
  });
  return g;
}

export function bunkRoom(w, l) {
  const group = new THREE.Group();
  const cols = Math.max(1, Math.floor(l / 2.1));
  const rows = Math.max(1, Math.floor(w / 1.1));
  const total = Math.min(cols * rows, 4);
  let n = 0;
  for (let r = 0; r < rows && n < total; r++) {
    for (let c = 0; c < cols && n < total; c++) {
      const b = bunk();
      b.position.set(c * 2.1 - ((cols - 1) * 2.1) / 2, 0, r * 1.1 - ((rows - 1) * 1.1) / 2);
      group.add(b);
      n++;
    }
  }
  return group;
}

export function commandConsole(w, l) {
  const group = new THREE.Group();
  const consoleMat = mat(0x0a4a7d, { roughness: 0.45, metalness: 0.2 });
  const desk = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.35, Math.min(l * 0.6, 2.4), 4, 10),
    consoleMat
  );
  desk.rotation.z = Math.PI / 2;
  desk.scale.set(1, 0.6, 0.8);
  desk.position.set(0, 0.45, -w / 2 + 0.45);
  group.add(desk);
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 8, 20), mat(0x2a2d31));
  wheel.position.set(0, 0.85, -w / 2 + 0.65);
  wheel.rotation.x = Math.PI / 2.4;
  group.add(wheel);
  return group;
}

export function counter(w, l) {
  const group = new THREE.Group();
  const counterMat = mat(0xe8a33d, { roughness: 0.55 });
  const bar = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.32, Math.min(l * 0.6, 3), 4, 10),
    counterMat
  );
  bar.rotation.z = Math.PI / 2;
  bar.scale.set(1, 0.6, 0.7);
  bar.position.set(0, 0.42, -w / 2 + 0.4);
  group.add(bar);
  return group;
}

export function crates(w, l) {
  const group = new THREE.Group();
  const crateMat = mat(0x9c8f76, { roughness: 0.85 });
  const count = Math.min(3, Math.max(2, Math.floor((w * l) / 5)));
  for (let i = 0; i < count; i++) {
    const size = 0.45 + Math.random() * 0.2;
    const crate = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), crateMat);
    crate.position.set(
      (i - (count - 1) / 2) * (size + 0.3),
      size / 2,
      0
    );
    group.add(crate);
  }
  return group;
}

export function benches(w, l) {
  const group = new THREE.Group();
  const benchMat = mat(0xc9d6c1, { roughness: 0.65 });
  const count = Math.max(1, Math.min(2, Math.floor(l / 3.5)));
  for (let i = 0; i < count; i++) {
    const bench = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 1.2, 4, 8), benchMat);
    bench.rotation.z = Math.PI / 2;
    bench.scale.set(1, 1, 0.7);
    bench.position.set(i * 2.6 - ((count - 1) * 2.6) / 2, 0.21, -w / 2 + 0.4);
    group.add(bench);
  }
  return group;
}

// Mapa tipo -> gerador. Compartimentos sem gerador específico ficam só
// com piso + parede, sem mobília.
export const FURNITURE_BY_TYPE = {
  salao: seatRows,
  garagem: carLanes,
  maquinas: engineRoom,
  camarote: bunkRoom,
  comando: commandConsole,
  servico: counter,
  paiol: crates,
  tecnico: crates,
  aberta: benches,
};
