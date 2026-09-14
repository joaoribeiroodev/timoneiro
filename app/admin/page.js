"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useSession } from "@/lib/useSession";

export default function AdminHome() {
  const session = useSession();

  if (session === undefined) {
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
        <h1 className="mb-6 font-display text-2xl text-white">Administração</h1>
        <Link
          href="/admin/navios"
          className="block rounded-sm border border-white/12 bg-navy-950/60 p-5 hover:border-seagreen-600"
        >
          <h2 className="font-display text-lg text-white">Embarcações</h2>
          <p className="mt-1 text-sm text-white/55">
            Editar dimensões, conveses e compartimentos de cada navio, e
            enviar um modelo 3D real (.glb) quando houver arquivo CAD.
          </p>
        </Link>
        <Link
          href="/admin/usuarios"
          className="mt-4 block rounded-sm border border-white/12 bg-navy-950/60 p-5 hover:border-seagreen-600"
        >
          <h2 className="font-display text-lg text-white">Usuários</h2>
          <p className="mt-1 text-sm text-white/55">
            Criar, editar papel/senha e remover usuários do setor de TI.
          </p>
        </Link>
      </main>
    </div>
  );
}
