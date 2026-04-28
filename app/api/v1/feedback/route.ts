import { NextRequest, NextResponse } from "next/server";
import { initDB, updateSkillRating } from "@/lib/db";
import type { FeedbackRequest } from "@/types";

export async function POST(request: NextRequest) {
  await initDB();

  let body: FeedbackRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.skill_id) {
    return NextResponse.json(
      { error: "skill_id is required" },
      { status: 400 }
    );
  }
  if (![1, -1, 0].includes(body.rating)) {
    return NextResponse.json(
      { error: "rating must be 1 (good), -1 (bad), or 0 (reset)" },
      { status: 400 }
    );
  }

  const updated = await updateSkillRating(
    body.skill_id,
    body.rating,
    body.feedback || ""
  );
  if (!updated) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
