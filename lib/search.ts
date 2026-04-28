import type { SearchResult } from "@/types";

const TAVILY_BASE = "https://api.tavily.com/search";

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export async function tavilySearch(
  query: string,
  depth: "basic" | "advanced" = "basic"
): Promise<TavilyResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("TAVILY_API_KEY not configured");

  const res = await fetch(TAVILY_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: depth,
      max_results: depth === "advanced" ? 10 : 5,
      include_answer: false,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tavily API error (${res.status}): ${text}`);
  }

  const json = await res.json();
  return (json.results || []).map((r: any) => ({
    title: r.title || "",
    url: r.url || "",
    content: r.content || "",
    score: r.score || 0,
  }));
}

export function genQueries(domain: string): string[] {
  const queries: string[] = [
    `${domain} AI assistant best practices Claude skill prompt`,
    `${domain} effective AI interaction patterns workflow tips`,
    `${domain} AI coding debugging productivity techniques`,
  ];

  if (/[一-鿿]/.test(domain)) {
    queries.push(`${domain} AI 辅助 高效 prompt 模板 技巧`);
    queries.push(`${domain} AI 使用经验 交互模式 最佳实践`);
  } else {
    queries.push(`${domain} prompt engineering template examples github`);
    queries.push(`${domain} AI workflow automation patterns community`);
  }

  return queries.slice(0, 5);
}

export async function multiSearch(
  domain: string,
  depth: "quick" | "deep"
): Promise<{ results: SearchResult[]; level: "rich" | "sparse" | "none" }> {
  const queries = genQueries(domain);
  const tavilyDepth = depth === "deep" ? "advanced" : "basic";

  const allResults = await Promise.allSettled(
    queries.map((q) => tavilySearch(q, tavilyDepth))
  );

  const merged: TavilyResult[] = [];
  for (const r of allResults) {
    if (r.status === "fulfilled") merged.push(...r.value);
  }

  const seen = new Set<string>();
  const deduped: SearchResult[] = [];
  for (const r of merged) {
    const key = r.url;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(r);
    }
  }

  const level = deduped.length >= 3 ? "rich" : deduped.length > 0 ? "sparse" : "none";
  return { results: deduped, level };
}
