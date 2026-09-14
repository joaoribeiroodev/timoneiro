import * as THREE from "three";

// Gera móveis/objetos simples (baixo-poli) dentro da área de um
// compartimento, de acordo com o tipo — para que o corte de convés
// mostre um espaço reconhecível (bancos, carros, camas, console...) em
// vez de um bloco colorido sólido representando o ambiente inteiro.
// Todas as funções recebem (w, l) em metros (largura/comprimento do
// compartimento) e devolvem um THREE.Group posicionado relativo ao
// centro do compartimento, já pousado sobre o piso (y = 0).

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.65, metalness: 0.05, ...opts });
}

function seat() {
  const g = new THREE.Group();
  const seatMat = mat(0x8ac640, { roughness: 0.8 });
  const frameMat = mat(0x3a3d42, { roughness: 0.5, metalness: 0.4 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.08, 0.46), seatMat);
  base.position.y = 0.42;
  g.add(base);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.5, 0.07), seatMat);
  back.position.set(0, 0.68, -0.2);
  back.rotation.x = -0.08;
  g.add(back);
  const legGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.42, 6);
  [
    [0.18, 0.18],
    [-0.18, 0.18],
    [0.18, -0.18],
    [-0.18, -0.18],
  ].forEach(([x, z]) => {
    const leg = new THREE.Mesh(legGeo, frameMat);
    leg.position.set(x, 0.21, z);
    g.add(leg);
  });
  return g;
}

export function seatRows(w, l) {
  const group = new THREE.Group();
  const pitchX = 0.65;
  const pitchZ = 0.6;
  const marginX = 0.5;
  const marginZ = 0.5;
  const cols = Math.max(1, Math.floor((l - marginX * 2) / pitchX));
  const rows = Math.max(1, Math.floor((w - marginZ * 2) / pitchZ));
  const total = Math.min(cols * rows, 40);
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
  const bodyColors = [0xb7c4cf, 0xc94f3d, 0x2f4a6b, 0xd9d2b8, 0x6b6f73];
  const color = bodyColors[Math.floor(Math.random() * bodyColors.length)];
  const bodyMat = mat(color, { metalness: 0.3, roughness: 0.4 });
  const glassMat = mat(0x101820, { metalness: 0.6, roughness: 0.2 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.45, 4.1), bodyMat);
  body.position.y = 0.35;
  g.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.4, 2.1), glassMat);
  cabin.position.set(0, 0.75, -0.2);
  g.add(cabin);
  const wheelGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.22, 10);
  const wheelMat = mat(0x1a1a1a, { roughness: 0.9 });
  [
    [0.8, -1.4],
    [-0.8, -1.4],
    [0.8, 1.4],
    [-0.8, 1.4],
  ].forEach(([x, z]) => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.14, z);
    g.add(wheel);
  });
  return g;
}

export function carLanes(w, l) {
  const group = new THREE.Group();
  const carW = 2.1;
  const carL = 4.6;
  const lanes = Math.max(1, Math.floor(w / carW));
  const perLane = Math.max(1, Math.floor(l / carL));
  const usedW = lanes * carW;
  const usedL = perLane * carL;
  const maxCars = 40;
  const totalSlots = lanes * perLane;
  const stride = Math.max(1, Math.ceil(totalSlots / maxCars));
  let slot = 0;
  for (let lane = 0; lane < lanes; lane++) {
    for (let i = 0; i < perLane; i++) {
      slot++;
      if (slot % stride !== 0) continue;
      const c = car();
      c.position.set(
        i * carL - usedL / 2 + carL / 2,
        0,
        lane * carW - usedW / 2 + carW / 2
      );
      group.add(c);
    }
  }
  return group;
}

export function engineRoom(w, l) {
  const group = new THREE.Group();
  const engineMat = mat(0xc1462f, { metalness: 0.4, roughness: 0.5 });
  const pipeMat = mat(0x8a8f96, { metalness: 0.7, roughness: 0.3 });
  const count = Math.max(1, Math.min(2, Math.floor(l / 4)));
  for (let i = 0; i < count; i++) {
    const block = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 2.4), engineMat);
    block.position.set(i * 3 - ((count - 1) * 3) / 2, 0.5, 0);
    group.add(block);
    const manifold = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.0, 8), pipeMat);
    manifold.rotation.z = Math.PI / 2;
    manifold.position.set(i * 3 - ((count - 1) * 3) / 2, 1.05, 0);
    group.add(manifold);
  }
  // tubulação ao longo da parede
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, l * 0.8, 8), pipeMat);
  pipe.rotation.x = Math.PI / 2;
  pipe.position.set(0, 1.6, -w / 2 + 0.15);
  group.add(pipe);
  return group;
}

function bunk() {
  const g = new THREE.Group();
  const frameMat = mat(0x5c85ab, { roughness: 0.6 });
  const matMat = mat(0xe9e4d4, { roughness: 0.85 });
  [0, 0.75].forEach((y) => {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 1.9), frameMat);
    frame.position.y = 0.35 + y;
    g.add(frame);
    const mattress = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.1, 1.8), matMat);
    mattress.position.y = 0.4 + y;
    g.add(mattress);
  });
  const postGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6);
  [
    [0.4, 0.9],
    [-0.4, 0.9],
    [0.4, -0.9],
    [-0.4, -0.9],
  ].forEach(([x, z]) => {
    const post = new THREE.Mesh(postGeo, frameMat);
    post.position.set(x, 0.6, z);
    g.add(post);
  });
  return g;
}

export function bunkRoom(w, l) {
  const group = new THREE.Group();
  const cols = Math.max(1, Math.floor(l / 2.1));
  const rows = Math.max(1, Math.floor(w / 1.1));
  const total = Math.min(cols * rows, 6);
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
  const consoleMat = mat(0x022544, { roughness: 0.5, metalness: 0.3 });
  const screenMat = mat(0x1c3a55, { emissive: 0x1c3a55, emissiveIntensity: 0.4 });
  const desk = new THREE.Mesh(new THREE.BoxGeometry(Math.min(l * 0.7, 3), 0.9, 0.6), consoleMat);
  desk.position.set(0, 0.45, -w / 2 + 0.4);
  group.add(desk);
  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.05), screenMat);
  screen.position.set(0, 1.0, -w / 2 + 0.65);
  group.add(screen);
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.03, 8, 20), mat(0x1a1a1a));
  wheel.position.set(0, 0.95, -w / 2 + 0.7);
  wheel.rotation.x = Math.PI / 2.4;
  group.add(wheel);
  const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.5, 12), mat(0x5c85ab));
  stool.position.set(0, 0.25, -w / 2 + 1.3);
  group.add(stool);
  return group;
}

export function counter(w, l) {
  const group = new THREE.Group();
  const counterMat = mat(0xe8a33d, { roughness: 0.6 });
  const bar = new THREE.Mesh(new THREE.BoxGeometry(Math.min(l * 0.8, 4), 0.9, 0.7), counterMat);
  bar.position.set(0, 0.45, -w / 2 + 0.45);
  group.add(bar);
  const stoolGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.55, 10);
  const stoolMat = mat(0x3a3d42);
  for (let i = -1; i <= 1; i++) {
    const stool = new THREE.Mesh(stoolGeo, stoolMat);
    stool.position.set(i * 0.6, 0.28, 0.2);
    group.add(stool);
  }
  return group;
}

export function crates(w, l) {
  const group = new THREE.Group();
  const crateMat = mat(0x7a6a53, { roughness: 0.9 });
  const count = Math.min(5, Math.max(2, Math.floor((w * l) / 3)));
  for (let i = 0; i < count; i++) {
    const size = 0.5 + Math.random() * 0.3;
    const crate = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), crateMat);
    crate.position.set(
      (Math.random() - 0.5) * (l - size),
      size / 2,
      (Math.random() - 0.5) * (w - size)
    );
    group.add(crate);
  }
  return group;
}

export function benches(w, l) {
  const group = new THREE.Group();
  const benchMat = mat(0xa3d966, { roughness: 0.7 });
  const count = Math.max(1, Math.floor(l / 2.5));
  for (let i = 0; i < count; i++) {
    const bench = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.42, 0.45), benchMat);
    bench.position.set(i * 2.5 - ((count - 1) * 2.5) / 2, 0.21, -w / 2 + 0.4);
    group.add(bench);
  }
  return group;
}

// Mapa tipo -> gerador. Compartimentos sem gerador específico ficam só
// com piso + paredes (sem mobília), o que já é bem menos "bloco" do que
// antes.
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
