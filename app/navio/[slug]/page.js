"use client";

import { useEffect, useMemo, useState } from "react";
import { notFound, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import EquipmentForm from "@/components/EquipmentForm";
import { useSession, canEdit } from "@/lib/useSession";

const ThreeViewer = dynamic(() => import("@/components/ThreeViewer"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center font-mono text-sm text-white/40">
      carregando modelo 3D…
    </div>
  ),
});

export default function VesselPage() {
  const { slug } = useParams();
  const [vessel, setVessel] = useState(undefined); // undefined = carregando, null = não encontrado
  const session = useSession();
  const editable = canEdit(session);

  const [activeDeck, setActiveDeck] = useState("all");
  const [equipment, setEquipment] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [placeType, setPlaceType] = useState(null); // "camera" | "tv" | null
  const [pendingPoint, setPendingPoint] = useState(null); // {deckCode, x, y}
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    fetch(`/api/vessels/${slug}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setVessel(d.vessel))
      .catch(() => setVessel(null));
  }, [slug]);

  useEffect(() => {
    if (!vessel) return;
    fetch(`/api/equipment?vessel=${vessel.slug}`)
      .then((r) => r.json())
      .then((d) => setEquipment(d.equipment || []));
  }, [vessel]);

  const currentDeck = useMemo(
    () => vessel?.decks.find((d) => d.code === activeDeck) || null,
    [vessel, activeDeck]
  );

  const visibleEquipment = useMemo(() => {
    let list = equipment;
    if (filterType !== "all") list = list.filter((e) => e.type === filterType);
    if (activeDeck !== "all") list = list.filter((e) => e.deck_code === activeDeck);
    return list;
  }, [equipment, filterType, activeDeck]);

  if (vessel === undefined) {
    return (
      <div className="grid min-h-screen place-items-center grid-paper">
        <p className="font-mono text-sm text-white/40">carregando embarcação…</p>
      </div>
    );
  }
  if (vessel === null) return notFound();

  function handlePlace(deckCode, x, y) {
    setPendingPoint({ deckCode, x, y });
  }

  async function handleCreate(formData) {
    const res = await fetch("/api/equipment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        vessel_slug: vessel.slug,
        deck_code: pendingPoint.deckCode,
        type: placeType,
        pos_x: pendingPoint.x,
        pos_y: pendingPoint.y,
      }),
    });
    if (!res.ok) {
      const d = await res.json();
      throw new Error(d.error);
    }
    const d = await res.json();
    setEquipment((eq) => [d.equipment, ...eq]);
    setPendingPoint(null);
    setPlaceType(null);
  }

  async function handleUpdate(formData) {
    const res = await fetch(`/api/equipment/${editingEquipment.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (!res.ok) {
      const d = await res.json();
      throw new Error(d.error);
    }
    const d = await res.json();
    setEquipment((eq) => eq.map((e) => (e.id === d.equipment.id ? d.equipment : e)));
    setEditingEquipment(null);
  }

  async function handleDelete(id) {
    if (!confirm("Excluir este equipamento do cadastro?")) return;
    const res = await fetch(`/api/equipment/${id}`, { method: "DELETE" });
    if (res.ok) {
      setEquipment((eq) => eq.filter((e) => e.id !== id));
      setEditingEquipment(null);
      setSelectedId(null);
    }
  }

  return (
    <div className="flex h-screen flex-col grid-paper">
      <Navbar />

      {/* Title block, no estilo das plantas originais */}
      <div className="title-block mx-4 mt-3 flex flex-wrap items-center justify-between gap-3 bg-navy-950/70 px-4 py-2">
        <div>
          <h1 className="font-display text-xl text-white">{vessel.name}</h1>
          <p className="font-mono text-[11px] text-white/40">
            doc. {vessel.doc} · {vessel.shipyard}
          </p>
        </div>
        <dl className="flex gap-5 font-mono text-[11px] text-white/60">
          <div>
            <dt className="text-white/35">LOA</dt>
            <dd>{vessel.dims.loa.toFixed(2)} m</dd>
          </div>
          <div>
            <dt className="text-white/35">Boca</dt>
            <dd>{vessel.dims.beam.toFixed(2)} m</dd>
          </div>
          <div>
            <dt className="text-white/35">Calado</dt>
            <dd>{vessel.dims.draft.toFixed(2)} m</dd>
          </div>
          <div>
            <dt className="text-white/35">Conveses</dt>
            <dd>{vessel.decks.length}</dd>
          </div>
          {session?.role === "admin" && (
            <a
              href={`/admin/navios/${vessel.slug}`}
              className="self-center rounded-sm border border-white/15 px-2 py-1 text-white/60 hover:border-seagreen-600 hover:text-seagreen-400"
            >
              editar navio
            </a>
          )}
        </dl>
      </div>

      {vessel.gltfUrl && (
        <p className="mx-4 mt-2 rounded-sm border border-seagreen-600/40 bg-seagreen-600/10 px-3 py-2 font-mono text-[11px] text-seagreen-400">
          Exibindo o modelo 3D real (.glb) enviado para esta embarcação, em vez da reconstrução paramétrica.
        </p>
      )}

      <div className="mt-3 flex flex-1 gap-3 overflow-hidden px-4 pb-4">
        {/* Coluna de conveses */}
        <aside className="w-40 shrink-0 overflow-y-auto rounded-sm border border-white/10 bg-navy-950/60 p-2 scrollbar-thin">
          <button
            onClick={() => setActiveDeck("all")}
            className={`mb-1 w-full rounded-sm px-2 py-2 text-left text-xs ${
              activeDeck === "all"
                ? "bg-seagreen-600 text-navy-950"
                : "text-white/70 hover:bg-white/5"
            }`}
          >
            Navio inteiro
          </button>
          {vessel.decks.map((d) => (
            <button
              key={d.code}
              onClick={() => setActiveDeck(d.code)}
              className={`mb-1 w-full rounded-sm px-2 py-2 text-left text-xs leading-tight ${
                activeDeck === d.code
                  ? "bg-seagreen-600 text-navy-950"
                  : "text-white/70 hover:bg-white/5"
              }`}
            >
              {d.name}
            </button>
          ))}
        </aside>

        {/* Viewer 3D */}
        <div className="relative flex-1 overflow-hidden rounded-sm border border-white/10 bg-brine">
          <ThreeViewer
            vessel={vessel}
            activeDeckCode={activeDeck}
            equipment={equipment}
            placementMode={!!placeType}
            onPlace={handlePlace}
            onSelectEquipment={(eq) => {
              setSelectedId(eq.id);
              if (editable) setEditingEquipment(eq);
            }}
            selectedEquipmentId={selectedId}
          />

          {editable && activeDeck !== "all" && (
            <div className="absolute right-3 top-3 flex flex-col gap-2">
              <button
                onClick={() => setPlaceType(placeType === "camera" ? null : "camera")}
                className={`rounded-sm border px-3 py-1.5 text-xs font-medium shadow ${
                  placeType === "camera"
                    ? "border-coral-signal bg-coral-signal text-white"
                    : "border-white/20 bg-navy-950/90 text-white/80 hover:border-coral-signal"
                }`}
              >
                + Câmera
              </button>
              <button
                onClick={() => setPlaceType(placeType === "tv" ? null : "tv")}
                className={`rounded-sm border px-3 py-1.5 text-xs font-medium shadow ${
                  placeType === "tv"
                    ? "border-amber-signal bg-amber-signal text-navy-950"
                    : "border-white/20 bg-navy-950/90 text-white/80 hover:border-amber-signal"
                }`}
              >
                + TV
              </button>
            </div>
          )}

          {activeDeck === "all" && editable && (
            <p className="pointer-events-none absolute right-3 top-3 max-w-[220px] rounded-sm bg-navy-950/90 px-3 py-2 text-right font-mono text-[11px] text-white/50">
              isole um convés na coluna à esquerda para cadastrar equipamentos
            </p>
          )}
        </div>

        {/* Lista de equipamentos */}
        <aside className="w-72 shrink-0 overflow-y-auto rounded-sm border border-white/10 bg-navy-950/60 p-3 scrollbar-thin">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm text-white">
              Equipamentos {activeDeck !== "all" && `· ${currentDeck?.name}`}
            </h2>
          </div>
          <div className="mb-3 flex gap-1 font-mono text-[11px]">
            {["all", "camera", "tv"].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`rounded-sm px-2 py-1 ${
                  filterType === t
                    ? "bg-white/15 text-white"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {t === "all" ? "todos" : t === "camera" ? "câmeras" : "TVs"}
              </button>
            ))}
          </div>

          {visibleEquipment.length === 0 && (
            <p className="font-mono text-xs text-white/35">
              Nenhum equipamento cadastrado{activeDeck !== "all" ? " neste convés" : ""}.
            </p>
          )}

          <ul className="space-y-2">
            {visibleEquipment.map((eq) => (
              <li
                key={eq.id}
                onClick={() => {
                  setSelectedId(eq.id);
                  if (editable) setEditingEquipment(eq);
                }}
                className={`cursor-pointer rounded-sm border px-3 py-2 text-xs transition ${
                  selectedId === eq.id
                    ? "border-seagreen-600 bg-seagreen-600/10"
                    : "border-white/10 hover:border-white/25"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">{eq.name}</span>
                  <span
                    className={`rounded-sm px-1.5 py-0.5 font-mono text-[10px] ${
                      eq.type === "camera"
                        ? "bg-coral-signal/20 text-coral-signal"
                        : "bg-amber-signal/20 text-amber-signal"
                    }`}
                  >
                    {eq.type === "camera" ? "CAM" : "TV"}
                  </span>
                </div>
                <p className="mt-0.5 text-white/45">
                  {eq.area_name || vessel.decks.find((d) => d.code === eq.deck_code)?.name}
                </p>
                <p className="mt-0.5 font-mono text-[10px] text-white/30">
                  {eq.status}
                  {eq.ip_address ? ` · ${eq.ip_address}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      {pendingPoint && (
        <EquipmentForm
          deckName={currentDeck?.name}
          initial={{ type: placeType }}
          onCancel={() => {
            setPendingPoint(null);
            setPlaceType(null);
          }}
          onSubmit={handleCreate}
        />
      )}

      {editingEquipment && !pendingPoint && (
        <EquipmentForm
          deckName={vessel.decks.find((d) => d.code === editingEquipment.deck_code)?.name}
          initial={editingEquipment}
          canDelete={session?.role === "admin"}
          onCancel={() => setEditingEquipment(null)}
          onSubmit={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
