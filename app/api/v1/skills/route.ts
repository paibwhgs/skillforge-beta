import { NextRequest, NextResponse } from "next/server";
import { initDB, getSkills } from "@/lib/db";

export async function GET(request: NextRequest) {
  await initDB();
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);
  const records = await getSkills(limit);
  return NextResponse.json({ skills: records });
}
