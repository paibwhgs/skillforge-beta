import { NextRequest } from 'next/server';
import { initDB, insertSkill, insertSources } from '@/lib/db';
import { multiSearch } from '@/lib/search';
import { curateStream } from '@/lib/curator';
import { formatSkill, extractTitle } from '@/lib/formatter';
import { getUserId } from '@/lib/auth';
import type { GenerateRequest } from '@/types';

function now(): string {
  return new Date().toLocaleTimeString('zh-CN', { hour12: false });
}

function writeEvent(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  event: string,
  data: unknown,
) {
  controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
}

export async function POST(request: NextRequest) {
  await initDB();

  let body: GenerateRequest;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const domain = body.domain?.trim();
  if (!domain || domain.length < 3) {
    return new Response(JSON.stringify({ error: 'domain is required (min 3 characters)' }), { status: 400 });
  }

  const format = body.format || 'claude';
  if (!['claude', 'markdown'].includes(format)) {
    return new Response(JSON.stringify({ error: 'format must be claude or markdown' }), { status: 400 });
  }

  const depth = body.depth || 'quick';
  const mode = body.mode || 'auto';
  const engine = body.engine;
  const model = body.model;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const write = (event: string, data: unknown) => writeEvent(controller, encoder, event, data);

      try {
        let results: any[] = [];
        let level: 'rich' | 'sparse' | 'none' = 'none';

        // Phase 1: Search
        if (mode === 'auto') {
          write('log', { type: 'search', text: `正在搜索「${domain}」...`, ts: now() });

          const searchResults = await multiSearch(domain, depth);
          results = searchResults.results;
          level = searchResults.level;

          write('log', { type: 'check', text: `找到 ${results.length} 个来源`, ts: now() });
          for (const r of results) {
            write('source', { title: r.title, url: r.url });
          }
        } else {
          write('log', { type: 'search', text: 'AI 直出模式，跳过搜索', ts: now() });
        }

        // Phase 2: Curate (streaming)
        write('log', { type: 'curating', text: 'AI 正在策展提炼...', ts: now() });

        let rawContent = '';
        if (mode === 'auto' && level === 'none') {
          rawContent = results.length === 0 ? await (await import('@/lib/curator')).curate(domain, results, level, engine, model) : '';
          // Fallback — just yield the whole content at once
          write('token', { text: rawContent });
        } else {
          for await (const token of curateStream(domain, results, level, engine, model)) {
            rawContent += token;
            write('token', { text: token });
          }
        }

        // Phase 3: Format
        write('log', { type: 'format', text: '格式化输出中...', ts: now() });
        const content = formatSkill(rawContent, format);
        const title = extractTitle(content);

        // Save
        const userId = getUserId(request);
        const id = await insertSkill(title, domain, format, content, depth, userId || undefined, mode);
        if (results.length > 0) {
          await insertSources(
            id,
            results.map((r) => ({ title: r.title, url: r.url })),
          );
        }

        // Done
        write('done', {
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
      } catch (err: any) {
        write('error', { error: err.message || '生成失败' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
