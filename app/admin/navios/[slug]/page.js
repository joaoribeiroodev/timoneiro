"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useSession } from "@/lib/useSession";
import { COMPARTMENT_TYPES } from "@/lib/vessels";

function emptyCompartment() {
  return { name: "Novo compartimento", type: "salao", x: 0, y: 0, w: 4, l: 4 };
}

function emptyDeck(index) {
  return {
    code: `conves-${index}`,
    name: "Novo convés",
    z: 0,
    height: 2.8,
    compartments: [],
  };
}

export default function EditVesselPage() {
  const { slug } = useParams();
  const router = useRouter();
  const session = useSession();

  const [vessel, setVessel] = useState(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    fetch(`/api/vessels/${slug}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setVessel(d.vessel))
      .catch(() => setVessel(null));
  }, [slug]);

  if (session === undefined || vessel === undefined) {
    return (
      <div className="grid min-h-screen place-items-center grid-paper">
        <p className="font-mono text-sm text-white/40">carregando…</p>
      </div>
    );
  }
  if (!session || session.role !== "admin") {
    return (
      <div className="min-h-screen grid-paper">
        <Navbar />
        <main className="mx-auto max-w-lg px-5 py-16 text-center">
          <p className="font-mono text-sm text-white/60">
            Esta área é restrita a administradores.
          </p>
        </main>
      </div>
    );
  }
  if (vessel === null) {
    return (
      <div className="min-h-screen grid-paper">
        <Navbar />
        <main className="mx-auto max-w-lg px-5 py-16 text-center">
          <p className="font-mono text-sm text-white/60">Embarcação não encontrada.</p>
        </main>
      </div>
    );
  }

  function setDims(field, value) {
    setVessel((v) => ({ ...v, dims: { ...v.dims, [field]: value === "" ? null : Number(value) } }));
  }

  function setField(field, value) {
    setVessel((v) => ({ ...v, [field]: value }));
  }

  function updateDeck(idx, patch) {
    setVessel((v) => {
      const decks = v.decks.map((d, i) => (i === idx ? { ...d, ...patch } : d));
      return { ...v, decks };
    });
  }

  function addDeck() {
    setVessel((v) => ({ ...v, decks: [...v.decks, emptyDeck(v.decks.length + 1)] }));
  }

  function removeDeck(idx) {
    if (!confirm("Remover este convés e todos os compartimentos dele?")) return;
    setVessel((v) => ({ ...v, decks: v.decks.filter((_, i) => i !== idx) }));
  }

  function updateCompartment(deckIdx, compIdx, patch) {
    setVessel((v) => {
      const decks = v.decks.map((d, i) => {
        if (i !== deckIdx) return d;
        const compartments = d.compartments.map((c, j) => (j === compIdx ? { ...c, ...patch } : c));
        return { ...d, compartments };
      });
      return { ...v, decks };
    });
  }

  function addCompartment(deckIdx) {
    setVessel((v) => {
      const decks = v.decks.map((d, i) =>
        i === deckIdx ? { ...d, compartments: [...d.compartments, emptyCompartment()] } : d
      );
      return { ...v, decks };
    });
  }

  function removeCompartment(deckIdx, compIdx) {
    setVessel((v) => {
      const decks = v.decks.map((d, i) =>
        i === deckIdx ? { ...d, compartments: d.compartments.filter((_, j) => j !== compIdx) } : d
      );
      return { ...v, decks };
    });
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSavedAt(null);
    const res = await fetch(`/api/vessels/${slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(vessel),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "Erro ao salvar.");
      return;
    }
    const d = await res.json();
    setVessel(d.vessel);
    setSavedAt(new Date());
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/vessels/${slug}/model`, { method: "POST", body: formData });
    setUploading(false);
    e.target.value = "";
    if (!res.ok) {
      const d = await res.json();
      setUploadError(d.error || "Erro ao enviar o arquivo.");
      return;
    }
    const d = await res.json();
    setVessel((v) => ({ ...v, gltfUrl: d.gltf_url }));
  }

  async function handleRemoveModel() {
    if (!confirm("Voltar para o casco reconstruído por parâmetros (remover o modelo 3D real)?"))
      return;
    const res = await fetch(`/api/vessels/${slug}/model`, { method: "DELETE" });
    if (res.ok) setVessel((v) => ({ ...v, gltfUrl: null }));
  }

  return (
    <div className="min-h-screen grid-paper pb-20">
      <Navbar />
      <main className="mx-auto max-w-4xl px-5 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-white">{vessel.name}</h1>
            <p className="font-mono text-[11px] text-white/40">/admin/navios/{slug}</p>
          </div>
          <button
            onClick={() => router.push(`/navio/${slug}`)}
            className="rounded-sm border border-white/15 px-3 py-1.5 font-mono text-xs text-white/60 hover:border-seagreen-600"
          >
            ver modelo 3D →
          </button>
        </div>

        {/* Dados básicos */}
        <Section title="Dados básicos">
          <div className="grid gap-3 sm:grid-cols-3">
            <TextField label="Nome" value={vessel.name} onChange={(v) => setField("name", v)} />
            <TextField label="Estaleiro" value={vessel.shipyard || ""} onChange={(v) => setField("shipyard", v)} />
            <TextField label="Documento" value={vessel.doc || ""} onChange={(v) => setField("doc", v)} />
          </div>
        </Section>

        {/* Dimensões */}
        <Section title="Características principais">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <NumField label="Comprimento total (m)" value={vessel.dims.loa} onChange={(v) => setDims("loa", v)} step="0.01" />
            <NumField label="Compr. entre PP (m)" value={vessel.dims.lpp} onChange={(v) => setDims("lpp", v)} step="0.01" />
            <NumField label="Boca moldada (m)" value={vessel.dims.beam} onChange={(v) => setDims("beam", v)} step="0.01" />
            <NumField label="Pontal (m)" value={vessel.dims.depth} onChange={(v) => setDims("depth", v)} step="0.01" />
            <NumField label="Calado máximo (m)" value={vessel.dims.draft} onChange={(v) => setDims("draft", v)} step="0.01" />
            <NumField label="Tripulação" value={vessel.dims.crew} onChange={(v) => setDims("crew", v)} step="1" />
            <NumField label="Passageiros" value={vessel.dims.passengers} onChange={(v) => setDims("passengers", v)} step="1" />
          </div>
        </Section>

        {/* Modelo 3D real */}
        <Section title="Modelo 3D real (CAD)">
          <p className="mb-3 text-sm text-white/55">
            Quando houver o arquivo CAD da embarcação, envie um{" "}
            <span className="font-mono text-white/70">.glb</span> (glTF binário, até 60&nbsp;MB)
            para usar no lugar do casco reconstruído por parâmetros. O cadastro de câmeras/TVs por
            convés continua funcionando normalmente, independente do modelo.
          </p>
          {vessel.gltfUrl ? (
            <div className="flex items-center justify-between rounded-sm border border-seagreen-600/40 bg-seagreen-600/10 px-3 py-2 text-sm">
              <a
                href={vessel.gltfUrl}
                target="_blank"
                rel="noreferrer"
                className="truncate font-mono text-xs text-seagreen-400 underline"
              >
                {vessel.gltfUrl}
              </a>
              <button
                onClick={handleRemoveModel}
                className="ml-3 shrink-0 rounded-sm border border-coral-signal/50 px-2 py-1 text-[11px] text-coral-signal hover:bg-coral-signal/10"
              >
                remover
              </button>
            </div>
          ) : (
            <p className="mb-2 font-mono text-[11px] text-white/40">
              Nenhum modelo real enviado — usando reconstrução paramétrica.
            </p>
          )}
          <label className="mt-2 inline-block cursor-pointer rounded-sm border border-white/15 px-3 py-2 text-xs text-white/70 hover:border-seagreen-600">
            {uploading ? "Enviando…" : "Escolher arquivo .glb"}
            <input type="file" accept=".glb" onChange={handleUpload} className="hidden" disabled={uploading} />
          </label>
          {uploadError && <p className="mt-2 text-xs text-coral-signal">{uploadError}</p>}
        </Section>

        {/* Conveses e compartimentos */}
        <Section title="Conveses e compartimentos">
          <div className="space-y-4">
            {vessel.decks.map((deck, deckIdx) => (
              <div key={deckIdx} className="rounded-sm border border-white/12 bg-navy-950/40 p-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  <TextField
                    label="Código"
                    value={deck.code}
                    onChange={(v) => updateDeck(deckIdx, { code: v })}
                  />
                  <TextField
                    label="Nome"
                    value={deck.name}
                    onChange={(v) => updateDeck(deckIdx, { name: v })}
                  />
                  <NumField label="Altura Z (m)" value={deck.z} onChange={(v) => updateDeck(deckIdx, { z: Number(v) })} step="0.1" />
                  <NumField label="Pé-direito (m)" value={deck.height} onChange={(v) => updateDeck(deckIdx, { height: Number(v) })} step="0.1" />
                  <button
                    onClick={() => removeDeck(deckIdx)}
                    className="h-fit self-end rounded-sm border border-coral-signal/40 px-2 py-2 text-[11px] text-coral-signal hover:bg-coral-signal/10"
                  >
                    remover convés
                  </button>
                </div>

                <div className="mt-3 space-y-2">
                  {deck.compartments.map((c, compIdx) => (
                    <div
                      key={compIdx}
                      className="grid grid-cols-2 gap-2 rounded-sm border border-white/8 bg-navy-900/50 p-2 sm:grid-cols-7"
                    >
                      <TextField
                        label="Nome"
                        value={c.name}
                        onChange={(v) => updateCompartment(deckIdx, compIdx, { name: v })}
                        className="sm:col-span-2"
                      />
                      <label className="block">
                        <span className="mb-1 block text-[10px] text-white/45">Tipo</span>
                        <select
                          value={c.type}
                          onChange={(e) => updateCompartment(deckIdx, compIdx, { type: e.target.value })}
                          className="mini-input"
                        >
                          {COMPARTMENT_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <NumField label="x (m)" value={c.x} onChange={(v) => updateCompartment(deckIdx, compIdx, { x: Number(v) })} step="0.5" mini />
                      <NumField label="y (m)" value={c.y} onChange={(v) => updateCompartment(deckIdx, compIdx, { y: Number(v) })} step="0.5" mini />
                      <NumField label="largura (m)" value={c.w} onChange={(v) => updateCompartment(deckIdx, compIdx, { w: Number(v) })} step="0.5" mini />
                      <NumField label="compr. (m)" value={c.l} onChange={(v) => updateCompartment(deckIdx, compIdx, { l: Number(v) })} step="0.5" mini />
                      <button
                        onClick={() => removeCompartment(deckIdx, compIdx)}
                        className="h-fit self-end rounded-sm border border-coral-signal/30 px-2 py-1.5 text-[10px] text-coral-signal hover:bg-coral-signal/10"
                      >
                        remover
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addCompartment(deckIdx)}
                    className="rounded-sm border border-white/15 px-2 py-1 text-[11px] text-white/60 hover:border-seagreen-600 hover:text-seagreen-400"
                  >
                    + compartimento
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={addDeck}
            className="mt-3 rounded-sm border border-white/15 px-3 py-1.5 text-xs text-white/60 hover:border-seagreen-600 hover:text-seagreen-400"
          >
            + adicionar convés
          </button>
        </Section>

        <div className="sticky bottom-4 mt-6 flex items-center justify-end gap-3 rounded-sm border border-white/15 bg-navy-950/95 p-3 backdrop-blur">
          {error && <p className="mr-auto text-xs text-coral-signal">{error}</p>}
          {savedAt && !error && (
            <p className="mr-auto font-mono text-[11px] text-seagreen-400">
              salvo às {savedAt.toLocaleTimeString("pt-BR")}
            </p>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-sm bg-seagreen-600 px-5 py-2 text-sm font-medium text-navy-950 hover:bg-seagreen-400 disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>

        <style jsx>{`
          .mini-input {
            width: 100%;
            border-radius: 2px;
            border: 1px solid rgba(255, 255, 255, 0.15);
            background: #01192f;
            padding: 0.4rem 0.5rem;
            font-size: 0.78rem;
            color: white;
            outline: none;
          }
          .mini-input:focus {
            border-color: #8ac640;
          }
        `}</style>
      </main>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="mb-6 rounded-sm border border-white/12 bg-navy-950/50 p-4">
      <h2 className="mb-3 font-display text-base text-white">{title}</h2>
      {children}
    </section>
  );
}

function TextField({ label, value, onChange, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[11px] text-white/50">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mini-input"
      />
      <style jsx>{`
        .mini-input {
          width: 100%;
          border-radius: 2px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: #01192f;
          padding: 0.4rem 0.5rem;
          font-size: 0.8rem;
          color: white;
          outline: none;
        }
        .mini-input:focus {
          border-color: #8ac640;
        }
      `}</style>
    </label>
  );
}

function NumField({ label, value, onChange, step = "1" }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] text-white/50">{label}</span>
      <input
        type="number"
        step={step}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="mini-input"
      />
      <style jsx>{`
        .mini-input {
          width: 100%;
          border-radius: 2px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: #01192f;
          padding: 0.4rem 0.5rem;
          font-size: 0.8rem;
          color: white;
          outline: none;
        }
        .mini-input:focus {
          border-color: #8ac640;
        }
      `}</style>
    </label>
  );
}
