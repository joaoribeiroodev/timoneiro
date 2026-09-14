import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionFromCookies, requireRole, hashPassword } from "@/lib/auth";

export async function PUT(req, { params }) {
  const session = getSessionFromCookies();
  if (!requireRole(session, ["admin"])) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await req.json();
  const update = {};
  if (body.name !== undefined) update.name = body.name;
  if (body.email !== undefined) update.email = body.email || null;
  if (body.role !== undefined) {
    if (!["admin", "tecnico", "visualizador"].includes(body.role)) {
      return NextResponse.json({ error: "Papel inválido." }, { status: 400 });
    }
    update.role = body.role;
  }
  if (body.password) {
    if (body.password.length < 6) {
      return NextResponse.json({ error: "Senha precisa ter ao menos 6 caracteres." }, {
        status: 400,
      });
    }
    update.password_hash = await hashPassword(body.password);
  }

  const db = getDb();

  if (update.role && update.role !== "admin") {
    const { count } = await db
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    const { data: target } = await db.from("users").select("role").eq("id", params.id).single();
    if (target?.role === "admin" && count <= 1) {
      return NextResponse.json(
        { error: "Precisa existir ao menos um administrador." },
        { status: 400 }
      );
    }
  }

  const { data, error } = await db
    .from("users")
    .update(update)
    .eq("id", params.id)
    .select("id, username, name, email, role, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ user: data });
}

export async function DELETE(req, { params }) {
  const session = getSessionFromCookies();
  if (!requireRole(session, ["admin"])) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  if (session.id === params.id) {
    return NextResponse.json({ error: "Você não pode excluir seu próprio usuário." }, {
      status: 400,
    });
  }

  const db = getDb();
  const { data: target } = await db.from("users").select("role").eq("id", params.id).single();
  if (target?.role === "admin") {
    const { count } = await db
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if (count <= 1) {
      return NextResponse.json(
        { error: "Precisa existir ao menos um administrador." },
        { status: 400 }
      );
    }
  }

  const { error } = await db.from("users").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
