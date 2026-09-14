"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "meshoptimizer";
import { buildPaintedHull } from "@/lib/three/hull";
import { buildDeckGroup } from "@/lib/three/deck";
import { buildExteriorGroup, buildRamps } from "@/lib/three/exterior";
import { getLivery } from "@/lib/three/livery";

const MARKER_COLORS = { camera: 0xc1462f, tv: 0xe8a33d };

export default function ThreeViewer({
  vessel,
  activeDeckCode, // null = ver navio inteiro; "all" also inteiro
  equipment = [],
  placementMode = false,
  onPlace, // (deckCode, x, y) => void
  onSelectEquipment, // (equipment) => void
  selectedEquipmentId,
}) {
  const mountRef = useRef(null);
  const stateRef = useRef({});
  const [hoverLabel, setHoverLabel] = useState(null);
  const [modelLoading, setModelLoading] = useState(false);

  // Setup cena (uma vez por navio)
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x052033);
    scene.fog = new THREE.Fog(0x052033, 90, 260);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    const loa = vessel.dims.loa;
    camera.position.set(loa * 0.55, loa * 0.42, loa * 0.65);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    mount.innerHTML = "";
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, vessel.dims.depth * 0.6, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxDistance = loa * 2.5;
    controls.minDistance = 4;
    controls.update();
    const homeCameraPos = camera.position.clone();
    const homeTarget = controls.target.clone();

    const hemi = new THREE.HemisphereLight(0xbfd8ff, 0x0a1a2b, 0.9);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff2d9, 1.1);
    sun.position.set(loa * 0.6, loa * 0.8, loa * 0.3);
    sun.castShadow = true;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x5c85ab, 0.35);
    fill.position.set(-loa * 0.5, loa * 0.3, -loa * 0.4);
    scene.add(fill);

    // Água
    const waterGeo = new THREE.PlaneGeometry(loa * 8, loa * 8);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0a4a7d,
      roughness: 0.35,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85,
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.02;
    water.receiveShadow = true;
    scene.add(water);

    // Casco + casaria: modelo real (.glb) quando a embarcação tiver um
    // arquivo CAD/reconstrução 3D importada, ou reconstrução paramétrica
    // caso contrário.
    let hull = null;
    let exteriorGroup = null;
    let rampsGroup = null;
    const gltfGroup = new THREE.Group();
    gltfGroup.visible = false;
    scene.add(gltfGroup);
    const livery = getLivery(vessel.slug);

    if (vessel.gltfUrl) {
      setModelLoading(true);
      const loader = new GLTFLoader();
      loader.setMeshoptDecoder(MeshoptDecoder);
      loader.load(
        vessel.gltfUrl,
        (gltf) => {
          const object = gltf.scene;

          // Os arquivos recebidos não vêm todos com o comprimento no
          // mesmo eixo — alinha o eixo mais comprido (proa-popa) com X,
          // que é o eixo longitudinal usado no resto do sistema.
          let box = new THREE.Box3().setFromObject(object);
          let size = new THREE.Vector3();
          box.getSize(size);
          if (size.z > size.x) {
            object.rotation.y = Math.PI / 2;
            box = new THREE.Box3().setFromObject(object);
            box.getSize(size);
          }

          // Auto-escala pelo comprimento real do navio (LOA) — os
          // arquivos não têm escala de mundo real confiável.
          const modelLength = size.x || 1;
          const scale = loa / modelLength;
          object.scale.setScalar(scale);

          const scaledBox = new THREE.Box3().setFromObject(object);
          const center = new THREE.Vector3();
          scaledBox.getCenter(center);
          object.position.sub(center);
          object.position.y += (scaledBox.max.y - scaledBox.min.y) / 2 - vessel.dims.draft;

          // Os modelos vêm sem cor/textura (reconstrução por foto única,
          // sem referência de pintura) — pinta por altura em relação à
          // linha d'água usando a mesma paleta real da embarcação
          // (antiincrustante abaixo, casco acima, superestrutura no
          // topo), nas mesmas cotas reais (calado / pontal) já
          // cadastradas para esse navio.
          object.updateMatrixWorld(true);
          const waterlineY = 0;
          const stripeH = Math.max(0.15, vessel.dims.depth * 0.05);
          const hullTopY = vessel.dims.depth - vessel.dims.draft;
          const belowColor = new THREE.Color(livery.belowWaterColor);
          const stripeColor = new THREE.Color(livery.stripeColor);
          const hullColor = new THREE.Color(livery.hullColor);
          const houseColor = new THREE.Color(livery.houseColor);

          object.traverse((child) => {
            if (!child.isMesh) return;
            child.castShadow = true;
            child.receiveShadow = true;
            const geo = child.geometry;
            const pos = geo.attributes.position;
            if (!pos) return;
            const m = child.matrixWorld.elements;
            const yScale = m[5];
            const yTrans = m[13];
            const colors = new Float32Array(pos.count * 3);
            for (let i = 0; i < pos.count; i++) {
              const worldY = pos.getY(i) * yScale + yTrans;
              let c;
              if (worldY < waterlineY) c = belowColor;
              else if (worldY < waterlineY + stripeH) c = stripeColor;
              else if (worldY < hullTopY) c = hullColor;
              else c = houseColor;
              colors[i * 3] = c.r;
              colors[i * 3 + 1] = c.g;
              colors[i * 3 + 2] = c.b;
            }
            geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
            child.material = new THREE.MeshStandardMaterial({
              vertexColors: true,
              roughness: 0.4,
              metalness: 0.12,
            });
          });

          gltfGroup.add(object);
          gltfGroup.visible = true;
          setModelLoading(false);
        },
        undefined,
        () => setModelLoading(false)
      );
    } else {
      hull = buildPaintedHull(vessel.dims, livery);
      scene.add(hull);

      exteriorGroup = buildExteriorGroup(vessel, livery);
      scene.add(exteriorGroup);
      rampsGroup = buildRamps(vessel);
      scene.add(rampsGroup);
    }

    // Decks
    const deckGroups = {};
    vessel.decks.forEach((deck) => {
      const g = buildDeckGroup(deck, vessel.dims);
      deckGroups[deck.code] = g;
      scene.add(g);
    });

    // Grupo de marcadores de equipamento
    const markerGroup = new THREE.Group();
    scene.add(markerGroup);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function onPointerMove(e) {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const s = stateRef.current;
      const isolating = s.activeDeckCode && s.activeDeckCode !== "all";
      const targets = [];
      if (isolating && deckGroups[s.activeDeckCode]) {
        targets.push(...deckGroups[s.activeDeckCode].children);
        targets.push(...markerGroup.children);
      } else if (exteriorGroup) {
        targets.push(exteriorGroup);
      }
      const hits = raycaster.intersectObjects(targets, true);
      if (hits.length > 0) {
        let obj = hits[0].object;
        while (obj && !obj.userData?.equipment && !obj.userData?.name) obj = obj.parent;
        if (obj?.userData?.equipment) {
          setHoverLabel(
            `${obj.userData.equipment.type === "camera" ? "Câmera" : "TV"}: ${
              obj.userData.equipment.name
            }`
          );
        } else if (obj?.userData?.name) {
          setHoverLabel(obj.userData.name);
        } else {
          setHoverLabel(null);
        }
        renderer.domElement.style.cursor = "pointer";
      } else {
        setHoverLabel(null);
        renderer.domElement.style.cursor = placementMode ? "crosshair" : "grab";
      }
    }

    function onClick(e) {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      // clique em marcador existente
      const markerHits = raycaster.intersectObjects(markerGroup.children, true);
      if (markerHits.length > 0) {
        let obj = markerHits[0].object;
        while (obj && !obj.userData?.equipment) obj = obj.parent;
        const eq = obj?.userData?.equipment;
        if (eq && stateRef.current.onSelectEquipment) {
          stateRef.current.onSelectEquipment(eq);
        }
        return;
      }

      if (!stateRef.current.placementMode) return;

      const activeDeck = stateRef.current.activeDeckCode;
      if (!activeDeck || activeDeck === "all") return;
      const g = deckGroups[activeDeck];
      if (!g) return;
      const floor = g.children.find((c) => c.userData?.kind === "deck-floor");
      if (!floor) return;
      const hits = raycaster.intersectObject(floor, false);
      if (hits.length > 0 && stateRef.current.onPlace) {
        const p = hits[0].point;
        stateRef.current.onPlace(activeDeck, p.x, p.z);
      }
    }

    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("click", onClick);

    let raf;
    function animate() {
      raf = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    function handleResize() {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener("resize", handleResize);

    stateRef.current = {
      scene,
      camera,
      renderer,
      controls,
      homeCameraPos,
      homeTarget,
      hull,
      exteriorGroup,
      rampsGroup,
      gltfGroup,
      deckGroups,
      markerGroup,
      placementMode,
      activeDeckCode,
      onPlace,
      onSelectEquipment,
    };

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("click", onClick);
      renderer.dispose();
      mount.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vessel.slug]);

  // Atualiza flags mutáveis sem recriar a cena
  useEffect(() => {
    stateRef.current.placementMode = placementMode;
    stateRef.current.activeDeckCode = activeDeckCode;
    stateRef.current.onPlace = onPlace;
    stateRef.current.onSelectEquipment = onSelectEquipment;
    if (stateRef.current.renderer) {
      stateRef.current.renderer.domElement.style.cursor = placementMode
        ? "crosshair"
        : "grab";
    }
  }, [placementMode, activeDeckCode, onPlace, onSelectEquipment]);

  // Visibilidade de deck / casco conforme deck ativo
  useEffect(() => {
    const s = stateRef.current;
    if (!s.deckGroups) return;
    const isolating = activeDeckCode && activeDeckCode !== "all";

    // Modo "navio inteiro": casaria sólida e realista visível, corte
    // (piso + compartimentos coloridos) escondido.
    // Modo "convés isolado": esconde a casaria daquele nível para expor
    // o corte com os compartimentos, mantendo o casco como referência.
    Object.entries(s.deckGroups).forEach(([code, g]) => {
      g.visible = isolating && code === activeDeckCode;
    });
    if (s.exteriorGroup) s.exteriorGroup.visible = !isolating;
    if (s.rampsGroup) s.rampsGroup.visible = !isolating;
    if (s.gltfGroup) s.gltfGroup.visible = !isolating && s.gltfGroup.children.length > 0;
    if (s.markerGroup) s.markerGroup.visible = isolating;
    if (s.hull) {
      s.hull.traverse((obj) => {
        if (obj.isMesh) {
          obj.material.transparent = true;
          obj.material.opacity = isolating ? 0.18 : 1;
          obj.material.needsUpdate = true;
        }
      });
    }

    // Enquadra a câmera no convés isolado — sem isso, as paredes dos
    // compartimentos ficam imperceptíveis (a câmera continua enquadrada
    // pro navio inteiro, muito mais longe do que o tamanho do convés).
    if (s.camera && s.controls) {
      if (isolating) {
        const deckMeta = vessel.decks.find((d) => d.code === activeDeckCode);
        const bounds = s.deckGroups[activeDeckCode]?.userData?.bounds;
        if (deckMeta && bounds) {
          const cx = (bounds.minX + bounds.maxX) / 2;
          const cz = (bounds.minY + bounds.maxY) / 2;
          const span = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY, 8);
          const dist = span * 0.68;
          const targetY = deckMeta.z + 1.3;
          s.camera.position.set(cx + dist * 0.6, targetY + dist * 0.55, cz + dist * 0.75);
          s.controls.target.set(cx, targetY, cz);
          s.controls.minDistance = 2;
          s.controls.maxDistance = span * 3.5;
        } else {
          s.controls.target.set(0, 0, 0);
        }
      } else {
        s.camera.position.copy(s.homeCameraPos);
        s.controls.target.copy(s.homeTarget);
        s.controls.minDistance = 4;
        s.controls.maxDistance = vessel.dims.loa * 2.5;
      }
      s.controls.update();
    }
  }, [activeDeckCode]);

  // Redesenha marcadores de equipamento
  useEffect(() => {
    const s = stateRef.current;
    if (!s.markerGroup) return;
    s.markerGroup.clear();
    equipment.forEach((eq) => {
      const deck = vessel.decks.find((d) => d.code === eq.deck_code);
      if (!deck) return;
      const isSelected = eq.id === selectedEquipmentId;
      const geo =
        eq.type === "camera"
          ? new THREE.ConeGeometry(0.35, 0.7, 12)
          : new THREE.BoxGeometry(0.55, 0.4, 0.08);
      const mat = new THREE.MeshStandardMaterial({
        color: isSelected ? 0xffffff : MARKER_COLORS[eq.type] || 0xffffff,
        emissive: isSelected ? 0x8ac640 : 0x000000,
        emissiveIntensity: isSelected ? 0.6 : 0,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(eq.pos_x, deck.z + 0.12 + 0.6, eq.pos_y);
      if (eq.type === "camera") mesh.rotation.x = Math.PI;
      mesh.userData = { equipment: eq };
      s.markerGroup.add(mesh);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.45, 0.55, 20),
        new THREE.MeshBasicMaterial({
          color: MARKER_COLORS[eq.type] || 0xffffff,
          side: THREE.DoubleSide,
        })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(eq.pos_x, deck.z + 0.14, eq.pos_y);
      s.markerGroup.add(ring);
    });
  }, [equipment, selectedEquipmentId, vessel.decks]);

  return (
    <div className="relative h-full w-full">
      <div ref={mountRef} className="h-full w-full" />
      {modelLoading && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-navy-950/40">
          <span className="rounded bg-navy-950/90 px-3 py-1.5 font-mono text-xs text-white/70">
            carregando modelo 3D real…
          </span>
        </div>
      )}
      {hoverLabel && (
        <div className="pointer-events-none absolute left-3 top-3 rounded bg-navy-900/90 px-3 py-1.5 font-mono text-xs text-chart-paper shadow-lg">
          {hoverLabel}
        </div>
      )}
      {placementMode && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded bg-seagreen-600/95 px-4 py-1.5 text-sm font-medium text-navy-950 shadow-lg">
          Clique em um ponto do convés isolado para posicionar o equipamento
        </div>
      )}
    </div>
  );
}
