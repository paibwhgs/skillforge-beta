import type { SearchResult } from '@/types';

const TAVILY_BASE = 'https://api.tavily.com/search';
const DASHSCOPE_MCP_URL = 'https://dashscope.aliyuncs.com/api/v1/mcps/WebSearch/mcp';

interface RawResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

// ── Tavily ──────────────────────────────────────────

export async function tavilySearch(
  query: string,
  depth: 'basic' | 'advanced' = 'basic',
): Promise<RawResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return [];

  const res = await fetch(TAVILY_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: depth,
      max_results: depth === 'advanced' ? 10 : 5,
      include_answer: false,
    }),
  });

  if (!res.ok) return [];
  const json = await res.json();
  return (json.results || []).map((r: any) => ({
    title: r.title || '',
    url: r.url || '',
    content: r.content || '',
    score: r.score || 0,
  }));
}

// ── Dashscope / 百炼 ────────────────────────────────

function parseDashscopeResult(text: string): RawResult[] {
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.map(normalizeItem);
    if (parsed.pages) return parsed.pages.map(normalizeItem);
    if (parsed.items) return parsed.items.map(normalizeItem);
    if (parsed.results) return parsed.results.map(normalizeItem);
    if (parsed.entries) return parsed.entries.map(normalizeItem);
  } catch {
    // fall through to text extraction
  }

  const results: RawResult[] = [];
  const lines = text.split('\n');
  let current: Partial<RawResult> = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (current.title || current.url) {
        results.push({ title: '', url: '', content: '', score: 0, ...current });
        current = {};
      }
      continue;
    }
    if (!current.title && !trimmed.startsWith('http')) {
      current.title = trimmed.replace(/^\d+[.、．]\s*/, '');
    } else if (trimmed.match(/^https?:\/\//)) {
      current.url = trimmed;
    } else if (current.title && trimmed.length > 10) {
      current.content = (current.content || '') + trimmed + ' ';
    }
  }
  if (current.title || current.url) {
    results.push({ title: '', url: '', content: '', score: 0, ...current });
  }
  return results;
}

function normalizeItem(item: any): RawResult {
  return {
    title: item.title || '',
    url: item.url || item.link || '',
    content: item.content || item.snippet || item.description || '',
    score: item.score ?? item.relevance ?? 0,
  };
}

const LOW_QUALITY_DOMAINS = [
  'blog.csdn.net', 'csdn.net',
  'toutiao.com', 'web.toutiao.com',
];

export async function dashscopeSearch(
  query: string,
  maxResults: number = 5,
): Promise<RawResult[]> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) return [];

  const res = await fetch(DASHSCOPE_MCP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now().toString(),
      method: 'tools/call',
      params: {
        name: 'bailian_web_search',
        arguments: { query, count: maxResults },
      },
    }),
  });

  if (!res.ok) return [];
  const json = await res.json();
  if (json.error) return [];

  const content = json.result?.content || [];
  const allTexts = content
    .filter((c: any) => c.type === 'text')
    .map((c: any) => c.text)
    .join('\n');

  return parseDashscopeResult(allTexts).slice(0, maxResults);
}

// ── Queries ─────────────────────────────────────────

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

// ── Multi-search ────────────────────────────────────

function isGoodSource(url: string): boolean {
  return !LOW_QUALITY_DOMAINS.some((d) => url.includes(d));
}

function mergeResults(...batches: RawResult[][]): SearchResult[] {
  const seen = new Set<string>();
  const out: SearchResult[] = [];
  for (const batch of batches) {
    for (const r of batch) {
      if (!seen.has(r.url) && isGoodSource(r.url)) {
        seen.add(r.url);
        out.push(r);
      }
    }
  }
  return out;
}

export async function multiSearch(
  domain: string,
  depth: 'quick' | 'deep',
): Promise<{ results: SearchResult[]; level: 'rich' | 'sparse' | 'none' }> {
  const queries = genQueries(domain);
  const maxResults = depth === 'deep' ? 10 : 5;
  const tavilyDepth = depth === 'deep' ? 'advanced' : 'basic';

  // Run both search engines in parallel
  const [tavilyBatch, dashBatch] = await Promise.all([
    // Tavily: 5 queries merged into one batch
    (async () => {
      const results = await Promise.allSettled(
        queries.map((q) => tavilySearch(q, tavilyDepth)),
      );
      const all: RawResult[] = [];
      for (const r of results) {
        if (r.status === 'fulfilled') all.push(...r.value);
      }
      return all;
    })(),
    // Dashscope: 5 queries merged into one batch
    (async () => {
      const results = await Promise.allSettled(
        queries.map((q) => dashscopeSearch(q, maxResults)),
      );
      const all: RawResult[] = [];
      for (const r of results) {
        if (r.status === 'fulfilled') all.push(...r.value);
      }
      return all;
    })(),
  ]);

  const deduped = mergeResults(tavilyBatch, dashBatch);
  const level = deduped.length >= 3 ? 'rich' : deduped.length > 0 ? 'sparse' : 'none';

  return { results: deduped, level };
}
