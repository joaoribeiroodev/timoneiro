import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionFromCookies, requireRole } from "@/lib/auth";

export async function PUT(req, { params }) {
  const session = getSessionFromCookies();
  if (!requireRole(session, ["admin", "tecnico"])) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await req.json();
  const allowed = [
    "name",
    "model",
    "serial_number",
    "ip_address",
    "area_name",
    "install_date",
    "status",
    "pos_x",
    "pos_y",
    "notes",
    "deck_code",
    "type",
  ];
  const update = {};
  for (const key of allowed) {
    if (body[key] !== undefined) update[key] = body[key];
  }

  const db = getDb();
  const { data, error } = await db
    .from("equipment")
    .update(update)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ equipment: data });
}

export async function DELETE(req, { params }) {
  const session = getSessionFromCookies();
  if (!requireRole(session, ["admin"])) {
    return NextResponse.json({ error: "Apenas administradores podem excluir." }, { status: 401 });
  }

  const db = getDb();
  const { error } = await db.from("equipment").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
