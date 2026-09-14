import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyPassword, signSession, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(req) {
  const { username, password } = await req.json();
  if (!username || !password) {
    return NextResponse.json(
      { error: "Informe usuário e senha." },
      { status: 400 }
    );
  }

  const db = getDb();
  const { data: user, error } = await db
    .from("users")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (error || !user) {
    return NextResponse.json({ error: "Usuário ou senha inválidos." }, { status: 401 });
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    return NextResponse.json({ error: "Usuário ou senha inválidos." }, { status: 401 });
  }

  const token = signSession(user);
  const res = NextResponse.json({
    user: { id: user.id, username: user.username, name: user.name, role: user.role },
  });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
