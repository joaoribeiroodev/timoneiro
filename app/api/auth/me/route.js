import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";

export async function GET() {
  const session = getSessionFromCookies();
  return NextResponse.json({ session });
}
