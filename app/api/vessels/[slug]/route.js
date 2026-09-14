import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionFromCookies, requireRole } from "@/lib/auth";
import { dbRowToVessel, vesselToDbRow } from "@/lib/vesselShape";

export async function GET(req, { params }) {
  const db = getDb();
  const { data, error } = await db
    .from("vessels")
    .select("*")
    .eq("slug", params.slug)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Embarcação não encontrada." }, { status: 404 });

  return NextResponse.json({ vessel: dbRowToVessel(data) });
}

export async function PUT(req, { params }) {
  const session = getSessionFromCookies();
  if (!requireRole(session, ["admin"])) {
    return NextResponse.json({ error: "Apenas administradores podem editar embarcações." }, {
      status: 401,
    });
  }

  const body = await req.json();
  if (!body.dims || typeof body.dims.loa !== "number") {
    return NextResponse.json({ error: "Dimensões inválidas." }, { status: 400 });
  }
  if (!Array.isArray(body.decks)) {
    return NextResponse.json({ error: "Lista de conveses inválida." }, { status: 400 });
  }

  const row = vesselToDbRow(body);
  const db = getDb();
  const { data, error } = await db
    .from("vessels")
    .update(row)
    .eq("slug", params.slug)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ vessel: dbRowToVessel(data) });
}
