"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "Não foi possível entrar.");
      return;
    }
    const next = searchParams.get("next") || "/";
    router.push(next);
    router.refresh();
  }

  return (
    <div className="grid min-h-screen place-items-center grid-paper px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-sm border border-white/12 bg-navy-950/80 p-7"
      >
        <img
          src="/logo/internacional-travessias.png"
          alt="Internacional Travessias"
          className="mx-auto mb-4 h-14 w-14 rounded-full"
        />
        <h1 className="text-center font-display text-2xl text-white">Timoneiro</h1>
        <p className="mb-6 text-center font-mono text-xs text-white/45">
          acesso do setor de TI
        </p>

        <label className="mb-1 block text-xs text-white/60">Usuário</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mb-4 w-full rounded-sm border border-white/15 bg-navy-900 px-3 py-2 text-sm text-white outline-none focus:border-seagreen-600"
          autoFocus
        />

        <label className="mb-1 block text-xs text-white/60">Senha</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-5 w-full rounded-sm border border-white/15 bg-navy-900 px-3 py-2 text-sm text-white outline-none focus:border-seagreen-600"
        />

        {error && (
          <p className="mb-4 rounded-sm border border-coral-signal/40 bg-coral-signal/10 px-3 py-2 text-xs text-coral-signal">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-sm bg-seagreen-600 py-2 text-sm font-medium text-navy-950 hover:bg-seagreen-400 disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
