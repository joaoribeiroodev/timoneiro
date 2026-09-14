import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionFromCookies, requireRole } from "@/lib/auth";

export async function GET(req, { params }) {
  const db = getDb();
  const { data, error } = await db
    .from("equipment_maintenance")
    .select("*")
    .eq("equipment_id", params.id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ maintenance: data });
}

export async function POST(req, { params }) {
  const session = getSessionFromCookies();
  if (!requireRole(session, ["admin", "tecnico"])) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await req.json();
  if (!body.description || !body.description.trim()) {
    return NextResponse.json({ error: "Descreva o que foi feito." }, { status: 400 });
  }

  const db = getDb();
  const { data, error } = await db
    .from("equipment_maintenance")
    .insert({
      equipment_id: params.id,
      date: body.date || new Date().toISOString().slice(0, 10),
      type: body.type || "preventiva",
      description: body.description,
      performed_by: body.performed_by || null,
      created_by: session.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ maintenance: data }, { status: 201 });
}
