"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [session, setSession] = useState(undefined);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setSession(d.session))
      .catch(() => setSession(null));
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setSession(null);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-b border-white/10 bg-navy-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-3">
          <img
            src="/logo/internacional-travessias.png"
            alt="Internacional Travessias"
            className="h-9 w-9 rounded-full"
          />
          <div className="leading-tight">
            <div className="font-display text-lg text-white">Timoneiro</div>
            <div className="font-mono text-[10px] tracking-wide text-white/45">
              mapeamento de TI da frota
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-5 text-sm text-white/75">
          <Link href="/" className="hover:text-seagreen-400">
            Embarcações
          </Link>
          {session === null && (
            <Link
              href="/login"
              className="rounded border border-seagreen-600 px-3 py-1.5 text-seagreen-400 hover:bg-seagreen-600/10"
            >
              Entrar
            </Link>
          )}
          {session && (
            <>
              {session.role === "admin" && (
                <Link href="/admin" className="hover:text-seagreen-400">
                  Admin
                </Link>
              )}
              <span className="font-mono text-xs text-white/45">
                {session.name} · {session.role}
              </span>
              <button
                onClick={handleLogout}
                className="rounded border border-white/20 px-3 py-1.5 hover:border-coral-signal hover:text-coral-signal"
              >
                Sair
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
