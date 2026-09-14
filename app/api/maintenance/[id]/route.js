import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionFromCookies, requireRole } from "@/lib/auth";

export async function DELETE(req, { params }) {
  const session = getSessionFromCookies();
  if (!requireRole(session, ["admin"])) {
    return NextResponse.json({ error: "Apenas administradores podem excluir." }, { status: 401 });
  }

  const db = getDb();
  const { error } = await db.from("equipment_maintenance").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
