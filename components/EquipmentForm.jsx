"use client";

import { useState } from "react";
import { EQUIPMENT_STATUS } from "@/lib/vessels";
import MaintenanceHistory from "@/components/MaintenanceHistory";

export default function EquipmentForm({
  initial,
  deckName,
  onCancel,
  onSubmit,
  onDelete,
  canDelete,
}) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    model: initial?.model || "",
    serial_number: initial?.serial_number || "",
    ip_address: initial?.ip_address || "",
    area_name: initial?.area_name || "",
    install_date: initial?.install_date || "",
    status: initial?.status || "ativo",
    notes: initial?.notes || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Dê um nome/identificação para o equipamento.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  const typeLabel = initial?.type === "tv" ? "Televisão" : "Câmera";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
      <form
        onSubmit={handleSubmit}
        className="max-h-[calc(100vh-3rem)] w-full max-w-md overflow-y-auto rounded-sm border border-white/15 bg-navy-950 p-6 scrollbar-thin"
      >
        <div className="mb-1 flex items-center justify-between">
          <h2 className="font-display text-lg text-white">
            {initial?.id ? "Editar" : "Nova"} {typeLabel.toLowerCase()}
          </h2>
          <span className="font-mono text-[10px] text-white/40">{deckName}</span>
        </div>

        <div className="mt-4 space-y-3">
          <Field label="Nome / identificação *">
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="input"
              placeholder="Ex: CAM-CVS-04"
              autoFocus
            />
          </Field>
          <Field label="Área / ambiente">
            <input
              value={form.area_name}
              onChange={(e) => set("area_name", e.target.value)}
              className="input"
              placeholder="Ex: Salão de passageiros - proa"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Modelo">
              <input
                value={form.model}
                onChange={(e) => set("model", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Nº de série">
              <input
                value={form.serial_number}
                onChange={(e) => set("serial_number", e.target.value)}
                className="input"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Endereço IP">
              <input
                value={form.ip_address}
                onChange={(e) => set("ip_address", e.target.value)}
                className="input font-mono"
                placeholder="10.0.x.x"
              />
            </Field>
            <Field label="Data de instalação">
              <input
                type="date"
                value={form.install_date || ""}
                onChange={(e) => set("install_date", e.target.value)}
                className="input"
              />
            </Field>
          </div>
          <Field label="Status">
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              className="input"
            >
              {EQUIPMENT_STATUS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Observações">
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              className="input h-16 resize-none"
            />
          </Field>
        </div>

        {error && (
          <p className="mt-3 rounded-sm border border-coral-signal/40 bg-coral-signal/10 px-3 py-2 text-xs text-coral-signal">
            {error}
          </p>
        )}

        {initial?.id && (
          <MaintenanceHistory equipmentId={initial.id} canAdd canDelete={canDelete} />
        )}

        <div className="mt-5 flex items-center justify-between gap-2">
          <div>
            {initial?.id && canDelete && (
              <button
                type="button"
                onClick={() => onDelete(initial.id)}
                className="rounded-sm border border-coral-signal/50 px-3 py-2 text-xs text-coral-signal hover:bg-coral-signal/10"
              >
                Excluir
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-sm border border-white/15 px-4 py-2 text-sm text-white/70 hover:border-white/30"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-sm bg-seagreen-600 px-4 py-2 text-sm font-medium text-navy-950 hover:bg-seagreen-400 disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>

        <style jsx>{`
          .input {
            width: 100%;
            border-radius: 2px;
            border: 1px solid rgba(255, 255, 255, 0.15);
            background: #01192f;
            padding: 0.5rem 0.65rem;
            font-size: 0.85rem;
            color: white;
            outline: none;
          }
          .input:focus {
            border-color: #8ac640;
          }
        `}</style>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-white/55">{label}</span>
      {children}
    </label>
  );
}
