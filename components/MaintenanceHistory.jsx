"use client";

import { useEffect, useState } from "react";
import { MAINTENANCE_TYPES } from "@/lib/vessels";

export default function MaintenanceHistory({ equipmentId, canAdd, canDelete }) {
  const [entries, setEntries] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: "preventiva",
    description: "",
    performed_by: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/equipment/${equipmentId}/maintenance`)
      .then((r) => r.json())
      .then((d) => setEntries(d.maintenance || []));
  }, [equipmentId]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.description.trim()) {
      setError("Descreva o que foi feito.");
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch(`/api/equipment/${equipmentId}/maintenance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "Erro ao salvar.");
      return;
    }
    const d = await res.json();
    setEntries((list) => [d.maintenance, ...(list || [])]);
    setForm({ date: new Date().toISOString().slice(0, 10), type: "preventiva", description: "", performed_by: "" });
    setShowForm(false);
  }

  async function handleDelete(id) {
    if (!confirm("Excluir este registro de manutenção?")) return;
    const res = await fetch(`/api/maintenance/${id}`, { method: "DELETE" });
    if (res.ok) setEntries((list) => list.filter((e) => e.id !== id));
  }

  return (
    <div className="mt-5 border-t border-white/10 pt-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-display text-sm text-white">Histórico de manutenção</h3>
        {canAdd && !showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-sm border border-white/15 px-2 py-1 text-[11px] text-white/60 hover:border-seagreen-600 hover:text-seagreen-400"
          >
            + registrar
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-3 space-y-2 rounded-sm border border-white/10 bg-navy-900/60 p-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1 block text-[11px] text-white/50">Data</span>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="mini-input"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] text-white/50">Tipo</span>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="mini-input"
              >
                {MAINTENANCE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-[11px] text-white/50">O que foi feito *</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="mini-input h-14 resize-none"
              placeholder="Ex: troca de fonte, ajuste de foco, cabo de rede substituído..."
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] text-white/50">Feito por</span>
            <input
              value={form.performed_by}
              onChange={(e) => setForm((f) => ({ ...f, performed_by: e.target.value }))}
              className="mini-input"
              placeholder="Nome do técnico ou empresa terceirizada"
            />
          </label>
          {error && <p className="text-[11px] text-coral-signal">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-sm border border-white/15 px-3 py-1.5 text-[11px] text-white/60"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleAdd}
              className="rounded-sm bg-seagreen-600 px-3 py-1.5 text-[11px] font-medium text-navy-950 hover:bg-seagreen-400 disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Adicionar"}
            </button>
          </div>
        </div>
      )}

      {entries === null && (
        <p className="font-mono text-[11px] text-white/35">carregando…</p>
      )}
      {entries?.length === 0 && (
        <p className="font-mono text-[11px] text-white/35">Nenhum registro ainda.</p>
      )}
      <ul className="max-h-40 space-y-2 overflow-y-auto scrollbar-thin">
        {entries?.map((m) => (
          <li key={m.id} className="rounded-sm border border-white/10 px-2.5 py-2 text-[11px]">
            <div className="flex items-center justify-between text-white/50">
              <span className="font-mono">
                {new Date(m.date + "T00:00:00").toLocaleDateString("pt-BR")} ·{" "}
                {MAINTENANCE_TYPES.find((t) => t.value === m.type)?.label || m.type}
              </span>
              {canDelete && (
                <button
                  type="button"
                  onClick={() => handleDelete(m.id)}
                  className="text-white/30 hover:text-coral-signal"
                >
                  excluir
                </button>
              )}
            </div>
            <p className="mt-1 text-white/80">{m.description}</p>
            {m.performed_by && (
              <p className="mt-0.5 text-white/40">por {m.performed_by}</p>
            )}
          </li>
        ))}
      </ul>

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
    </div>
  );
}
