"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useSession } from "@/lib/useSession";

export default function AdminNaviosPage() {
  const session = useSession();
  const [vessels, setVessels] = useState(null);

  useEffect(() => {
    fetch("/api/vessels")
      .then((r) => r.json())
      .then((d) => setVessels(d.vessels || []));
  }, []);

  if (session === undefined || vessels === null) {
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

  return (
    <div className="min-h-screen grid-paper">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="mb-6 font-display text-2xl text-white">Embarcações</h1>
        <div className="space-y-3">
          {vessels.map((v) => (
            <Link
              key={v.slug}
              href={`/admin/navios/${v.slug}`}
              className="flex items-center justify-between rounded-sm border border-white/12 bg-navy-950/60 p-4 hover:border-seagreen-600"
            >
              <div>
                <h2 className="font-display text-base text-white">{v.name}</h2>
                <p className="font-mono text-[11px] text-white/40">
                  LOA {v.dims.loa.toFixed(2)} m · {v.deckCount} conveses
                  {v.gltfUrl ? " · modelo 3D real" : ""}
                </p>
              </div>
              <span className="font-mono text-xs text-seagreen-400">editar →</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
