import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionFromCookies, requireRole } from "@/lib/auth";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const vessel = searchParams.get("vessel");

  const db = getDb();
  let query = db.from("equipment").select("*").order("created_at", { ascending: false });
  if (vessel) query = query.eq("vessel_slug", vessel);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ equipment: data });
}

export async function POST(req) {
  const session = getSessionFromCookies();
  if (!requireRole(session, ["admin", "tecnico"])) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await req.json();
  const required = ["vessel_slug", "deck_code", "type", "name", "pos_x", "pos_y"];
  for (const field of required) {
    if (body[field] === undefined || body[field] === null || body[field] === "") {
      return NextResponse.json(
        { error: `Campo obrigatório ausente: ${field}` },
        { status: 400 }
      );
    }
  }

  const db = getDb();
  const { data, error } = await db
    .from("equipment")
    .insert({
      vessel_slug: body.vessel_slug,
      deck_code: body.deck_code,
      type: body.type,
      name: body.name,
      model: body.model || null,
      serial_number: body.serial_number || null,
      ip_address: body.ip_address || null,
      area_name: body.area_name || null,
      install_date: body.install_date || null,
      status: body.status || "ativo",
      pos_x: body.pos_x,
      pos_y: body.pos_y,
      notes: body.notes || null,
      created_by: session.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ equipment: data }, { status: 201 });
}
