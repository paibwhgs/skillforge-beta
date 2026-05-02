import type { SearchResult } from '@/types';

const DASHSCOPE_MCP_URL = 'https://dashscope.aliyuncs.com/api/v1/mcps/WebSearch/mcp';

interface DashscopeSearchItem {
  title: string;
  url: string;
  content: string;
  score: number;
}

function parseSearchResults(text: string): DashscopeSearchItem[] {
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.map(normalizeItem);
    if (parsed.pages) return parsed.pages.map(normalizeItem);
    if (parsed.items) return parsed.items.map(normalizeItem);
    if (parsed.results) return parsed.results.map(normalizeItem);
    if (parsed.entries) return parsed.entries.map(normalizeItem);
  } catch {
    // not JSON, try line-by-line extraction below
  }

  const results: DashscopeSearchItem[] = [];
  const lines = text.split('\n');
  let current: Partial<DashscopeSearchItem> = {};
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

function normalizeItem(item: any): DashscopeSearchItem {
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
): Promise<DashscopeSearchItem[]> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) throw new Error('DASHSCOPE_API_KEY not configured');

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
        arguments: {
          query,
          count: maxResults,
        },
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Dashscope API error (${res.status}): ${text}`);
  }

  const json = await res.json();
  if (json.error) {
    throw new Error(`Dashscope MCP error: ${json.error.message || JSON.stringify(json.error)}`);
  }

  const content = json.result?.content || [];
  const allTexts = content
    .filter((c: any) => c.type === 'text')
    .map((c: any) => c.text)
    .join('\n');

  return parseSearchResults(allTexts).slice(0, maxResults);
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
  depth: 'quick' | 'deep',
): Promise<{ results: SearchResult[]; level: 'rich' | 'sparse' | 'none' }> {
  const queries = genQueries(domain);
  const maxResults = depth === 'deep' ? 10 : 5;
  const allResults = await Promise.allSettled(queries.map((q) => dashscopeSearch(q, maxResults)));

  const merged: DashscopeSearchItem[] = [];
  for (const r of allResults) {
    if (r.status === 'fulfilled') merged.push(...r.value);
  }

  const seen = new Set<string>();
  const deduped: SearchResult[] = [];
  for (const r of merged) {
    const key = r.url;
    if (seen.has(key)) continue;
    if (LOW_QUALITY_DOMAINS.some((d) => key.includes(d))) continue;
    seen.add(key);
    deduped.push(r);
  }

  const level = deduped.length >= 3 ? 'rich' : deduped.length > 0 ? 'sparse' : 'none';
  return { results: deduped, level };
}
