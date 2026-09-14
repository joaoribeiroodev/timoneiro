import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { dbRowToVessel } from "@/lib/vesselShape";

export async function GET() {
  const db = getDb();

  const { data: vesselRows, error: vesselError } = await db
    .from("vessels")
    .select("*")
    .order("loa", { ascending: false });
  if (vesselError) {
    return NextResponse.json({ error: vesselError.message }, { status: 500 });
  }

  const { data: equipmentRows, error: equipmentError } = await db
    .from("equipment")
    .select("vessel_slug, type, status");
  if (equipmentError) {
    return NextResponse.json({ error: equipmentError.message }, { status: 500 });
  }

  const counts = {};
  vesselRows.forEach((v) => {
    counts[v.slug] = { camera: 0, tv: 0, manutencao: 0, total: 0 };
  });
  (equipmentRows || []).forEach((row) => {
    const c = counts[row.vessel_slug];
    if (!c) return;
    c.total += 1;
    if (row.type === "camera") c.camera += 1;
    if (row.type === "tv") c.tv += 1;
    if (row.status === "manutencao") c.manutencao += 1;
  });

  const vessels = vesselRows.map((row) => ({
    ...dbRowToVessel(row),
    deckCount: (row.decks || []).length,
  }));

  return NextResponse.json({ vessels, counts });
}
