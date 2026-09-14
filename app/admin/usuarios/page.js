"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { useSession } from "@/lib/useSession";

const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "tecnico", label: "Técnico" },
  { value: "visualizador", label: "Visualizador" },
];

function emptyForm() {
  return { username: "", name: "", email: "", password: "", role: "tecnico" };
}

export default function UsersAdminPage() {
  const session = useSession();
  const [users, setUsers] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm());
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  function loadUsers() {
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => setUsers(d.users || []));
  }

  useEffect(() => {
    if (session?.role === "admin") loadUsers();
  }, [session]);

  if (session === undefined || (session?.role === "admin" && users === null)) {
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

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "Erro ao criar usuário.");
      return;
    }
    setShowCreate(false);
    setCreateForm(emptyForm());
    loadUsers();
  }

  function startEdit(u) {
    setEditingId(u.id);
    setEditForm({ name: u.name, email: u.email || "", role: u.role, password: "" });
    setError("");
  }

  async function handleSaveEdit(id) {
    setError("");
    const payload = { ...editForm };
    if (!payload.password) delete payload.password;
    const res = await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "Erro ao salvar.");
      return;
    }
    setEditingId(null);
    loadUsers();
  }

  async function handleDelete(u) {
    if (!confirm(`Excluir o usuário "${u.username}"?`)) return;
    const res = await fetch(`/api/users/${u.id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json();
      alert(d.error || "Erro ao excluir.");
      return;
    }
    loadUsers();
  }

  return (
    <div className="min-h-screen grid-paper">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-2xl text-white">Usuários</h1>
          {!showCreate && (
            <button
              onClick={() => {
                setShowCreate(true);
                setError("");
              }}
              className="rounded-sm bg-seagreen-600 px-3 py-1.5 text-xs font-medium text-navy-950 hover:bg-seagreen-400"
            >
              + novo usuário
            </button>
          )}
        </div>

        {showCreate && (
          <form
            onSubmit={handleCreate}
            className="mb-6 space-y-3 rounded-sm border border-white/12 bg-navy-950/60 p-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <MiniField label="Usuário (login)">
                <input
                  value={createForm.username}
                  onChange={(e) => setCreateForm((f) => ({ ...f, username: e.target.value }))}
                  className="mini-input"
                  autoFocus
                />
              </MiniField>
              <MiniField label="Nome">
                <input
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  className="mini-input"
                />
              </MiniField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MiniField label="E-mail (opcional)">
                <input
                  value={createForm.email}
                  onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                  className="mini-input"
                />
              </MiniField>
              <MiniField label="Senha">
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                  className="mini-input"
                />
              </MiniField>
            </div>
            <MiniField label="Papel">
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value }))}
                className="mini-input"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </MiniField>
            {error && <p className="text-xs text-coral-signal">{error}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-sm border border-white/15 px-3 py-1.5 text-xs text-white/60"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-sm bg-seagreen-600 px-3 py-1.5 text-xs font-medium text-navy-950 hover:bg-seagreen-400"
              >
                Criar
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="rounded-sm border border-white/12 bg-navy-950/60 p-3">
              {editingId === u.id ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <MiniField label="Nome">
                      <input
                        value={editForm.name}
                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                        className="mini-input"
                      />
                    </MiniField>
                    <MiniField label="E-mail">
                      <input
                        value={editForm.email}
                        onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                        className="mini-input"
                      />
                    </MiniField>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <MiniField label="Papel">
                      <select
                        value={editForm.role}
                        onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                        className="mini-input"
                      >
                        {ROLES.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </MiniField>
                    <MiniField label="Nova senha (opcional)">
                      <input
                        type="password"
                        value={editForm.password}
                        onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
                        className="mini-input"
                      />
                    </MiniField>
                  </div>
                  {error && <p className="text-xs text-coral-signal">{error}</p>}
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded-sm border border-white/15 px-3 py-1.5 text-xs text-white/60"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleSaveEdit(u.id)}
                      className="rounded-sm bg-seagreen-600 px-3 py-1.5 text-xs font-medium text-navy-950 hover:bg-seagreen-400"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white">
                      {u.name}{" "}
                      <span className="font-mono text-[11px] text-white/40">@{u.username}</span>
                    </p>
                    <p className="font-mono text-[11px] text-white/40">
                      {u.email || "sem e-mail"} · {ROLES.find((r) => r.value === u.role)?.label}
                      {u.id === session.id ? " · você" : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(u)}
                      className="rounded-sm border border-white/15 px-2 py-1 text-[11px] text-white/60 hover:border-seagreen-600 hover:text-seagreen-400"
                    >
                      editar
                    </button>
                    {u.id !== session.id && (
                      <button
                        onClick={() => handleDelete(u)}
                        className="rounded-sm border border-coral-signal/40 px-2 py-1 text-[11px] text-coral-signal hover:bg-coral-signal/10"
                      >
                        excluir
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <style jsx>{`
          .mini-input {
            width: 100%;
            border-radius: 2px;
            border: 1px solid rgba(255, 255, 255, 0.15);
            background: #01192f;
            padding: 0.45rem 0.6rem;
            font-size: 0.8rem;
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

function MiniField({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] text-white/50">{label}</span>
      {children}
    </label>
  );
}
