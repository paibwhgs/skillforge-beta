import { NextRequest, NextResponse } from "next/server";
import { initDB, insertSkill, insertSources } from "@/lib/db";
import { multiSearch } from "@/lib/search";
import { curate } from "@/lib/curator";
import { formatSkill, extractTitle } from "@/lib/formatter";
import type { GenerateRequest } from "@/types";

export async function POST(request: NextRequest) {
  await initDB();

  let body: GenerateRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const domain = body.domain?.trim();
  if (!domain || domain.length < 3) {
    return NextResponse.json(
      { error: "domain is required (min 3 characters)" },
      { status: 400 }
    );
  }

  const format = body.format || "claude";
  if (!["claude", "openclaw", "markdown"].includes(format)) {
    return NextResponse.json(
      { error: "format must be claude, openclaw, or markdown" },
      { status: 400 }
    );
  }

  const depth = body.depth || "quick";

  // Phase 1: Search
  const { results, level } = await multiSearch(domain, depth);

  // Phase 2: Curate
  const rawContent = await curate(domain, results, level);

  // Phase 3: Format
  const content = formatSkill(rawContent, format);
  const title = extractTitle(content);

  // Save to DB
  const id = await insertSkill(title, domain, format, content, depth);
  await insertSources(
    id,
    results.map((r) => ({ title: r.title, url: r.url }))
  );

  return NextResponse.json({
    success: true,
    skill: {
      id,
      title,
      domain,
      format,
      content,
      sources: results.map((r) => ({ title: r.title, url: r.url })),
      sources_level: level,
      created_at: new Date().toISOString(),
    },
  });
}
