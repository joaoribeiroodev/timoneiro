"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function HomePage() {
  const [vessels, setVessels] = useState(null);
  const [counts, setCounts] = useState({});

  useEffect(() => {
    fetch("/api/vessels")
      .then((r) => r.json())
      .then((d) => {
        setVessels(d.vessels || []);
        setCounts(d.counts || {});
      })
      .catch(() => setVessels([]));
  }, []);

  return (
    <div className="min-h-screen grid-paper">
      <Navbar />

      <main className="mx-auto max-w-7xl px-5 py-10">
        <div className="mb-10 flex flex-col gap-2 border-l-2 border-seagreen pl-4">
          <span className="font-mono text-xs uppercase tracking-wider text-seagreen-400">
            Internacional Travessias Salvador — Setor de TI
          </span>
          <h1 className="font-display text-3xl text-white sm:text-4xl">
            Escolha uma embarcação para inspecionar
          </h1>
          <p className="max-w-2xl text-sm text-white/60">
            Cada modelo 3D é construído a partir das plantas de arranjo geral e
            docagem da embarcação, convés por convés. Clique em um navio para
            navegar pelo casco, isolar um convés e conferir onde cada câmera e
            televisão está instalada.
          </p>
        </div>

        {vessels === null && (
          <p className="font-mono text-sm text-white/40">carregando frota…</p>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {vessels?.map((v) => {
            const c = counts[v.slug] || { camera: 0, tv: 0, total: 0 };
            return (
              <Link
                key={v.slug}
                href={`/navio/${v.slug}`}
                className="group relative flex flex-col justify-between overflow-hidden rounded-sm border border-white/12 bg-navy-950/60 p-5 transition hover:border-seagreen-600"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <h2 className="font-display text-xl text-white">{v.name}</h2>
                    {v.gltfUrl && (
                      <span className="rounded-sm bg-seagreen-600/20 px-2 py-0.5 font-mono text-[10px] text-seagreen-400">
                        modelo real
                      </span>
                    )}
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-white/40">
                    doc. {v.doc}
                  </p>

                  <dl className="mt-4 grid grid-cols-2 gap-y-1.5 font-mono text-xs text-white/70">
                    <dt className="text-white/40">Comprimento</dt>
                    <dd>{v.dims.loa.toFixed(2)} m</dd>
                    <dt className="text-white/40">Boca</dt>
                    <dd>{v.dims.beam.toFixed(2)} m</dd>
                    <dt className="text-white/40">Conveses</dt>
                    <dd>{v.deckCount}</dd>
                    <dt className="text-white/40">Passageiros</dt>
                    <dd>{v.dims.passengers ?? "—"}</dd>
                  </dl>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3">
                  <div className="flex gap-3 font-mono text-xs">
                    <span className="text-coral-signal">{c.camera} câm.</span>
                    <span className="text-amber-signal">{c.tv} TV</span>
                  </div>
                  <span className="text-sm text-seagreen-400 group-hover:translate-x-0.5 transition-transform">
                    ver modelo 3D
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <p className="font-mono text-[11px] text-white/35">
            dimensões e conveses editáveis em /admin/navios
          </p>
          <Link
            href="/admin/navios"
            className="rounded-sm border border-white/15 px-3 py-1.5 font-mono text-xs text-white/60 hover:border-seagreen-600 hover:text-seagreen-400"
          >
            painel de embarcações →
          </Link>
        </div>
      </main>
    </div>
  );
}
