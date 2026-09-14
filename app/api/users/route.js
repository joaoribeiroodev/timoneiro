import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionFromCookies, requireRole, hashPassword } from "@/lib/auth";

export async function GET() {
  const session = getSessionFromCookies();
  if (!requireRole(session, ["admin"])) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const db = getDb();
  const { data, error } = await db
    .from("users")
    .select("id, username, name, email, role, created_at")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users: data });
}

export async function POST(req) {
  const session = getSessionFromCookies();
  if (!requireRole(session, ["admin"])) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await req.json();
  const { username, name, email, password, role } = body;
  if (!username || !name || !password) {
    return NextResponse.json(
      { error: "Preencha usuário, nome e senha." },
      { status: 400 }
    );
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Senha precisa ter ao menos 6 caracteres." }, { status: 400 });
  }
  if (!["admin", "tecnico", "visualizador"].includes(role)) {
    return NextResponse.json({ error: "Papel inválido." }, { status: 400 });
  }

  const db = getDb();
  const password_hash = await hashPassword(password);
  const { data, error } = await db
    .from("users")
    .insert({ username, name, email: email || null, password_hash, role })
    .select("id, username, name, email, role, created_at")
    .single();

  if (error) {
    const msg = error.code === "23505" ? "Já existe um usuário com esse login." : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  return NextResponse.json({ user: data }, { status: 201 });
}
