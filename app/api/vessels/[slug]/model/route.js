import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionFromCookies, requireRole } from "@/lib/auth";

export async function POST(req, { params }) {
  const session = getSessionFromCookies();
  if (!requireRole(session, ["admin"])) {
    return NextResponse.json({ error: "Apenas administradores podem enviar modelos 3D." }, {
      status: 401,
    });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "Envie um arquivo .glb." }, { status: 400 });
  }
  if (!file.name.toLowerCase().endsWith(".glb")) {
    return NextResponse.json(
      { error: "Só arquivos .glb (glTF binário) são aceitos por enquanto." },
      { status: 400 }
    );
  }
  if (file.size > 80 * 1024 * 1024) {
    return NextResponse.json({ error: "Arquivo maior que 80 MB." }, { status: 400 });
  }

  const db = getDb();
  const path = `${params.slug}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await db.storage
    .from("models")
    .upload(path, buffer, { contentType: "model/gltf-binary", upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: publicUrlData } = db.storage.from("models").getPublicUrl(path);
  const gltf_url = publicUrlData.publicUrl;

  const { data, error } = await db
    .from("vessels")
    .update({ gltf_url })
    .eq("slug", params.slug)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ gltf_url: data.gltf_url });
}

export async function DELETE(req, { params }) {
  const session = getSessionFromCookies();
  if (!requireRole(session, ["admin"])) {
    return NextResponse.json({ error: "Apenas administradores podem remover o modelo 3D." }, {
      status: 401,
    });
  }

  const db = getDb();
  const { error } = await db
    .from("vessels")
    .update({ gltf_url: null })
    .eq("slug", params.slug);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
