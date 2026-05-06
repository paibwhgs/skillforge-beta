import { NextRequest } from 'next/server';
import { initDB, insertSkill, insertSources, extractScoreFromContent, stripScoreFromContent } from '@/lib/db';
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
  if (!['claude', 'openclaw', 'markdown'].includes(format)) {
    return new Response(JSON.stringify({ error: 'format must be claude, openclaw, or markdown' }), { status: 400 });
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
        let tokenCount = 0;
        if (mode === 'auto' && level === 'none') {
          const { curate } = await import('@/lib/curator');
          rawContent = await curate(domain, results, level, format, engine, model);
          write('token', { text: rawContent });
          console.error(`[stream] fallback seed, rawContent length=${rawContent.length}`);
        } else {
          for await (const token of curateStream(domain, results, level, format, engine, model)) {
            rawContent += token;
            tokenCount++;
            write('token', { text: token });
          }
          console.error(`[stream] tokens=${tokenCount}, rawContent length=${rawContent.length}`);
        }

        if (!rawContent.trim()) {
          throw new Error('AI 返回了空内容，请重试。如果持续失败，可尝试切换模型或换一个领域。');
        }

        // Phase 3: Format
        write('log', { type: 'format', text: '格式化输出中...', ts: now() });
        const score = extractScoreFromContent(rawContent);
        const cleanedRaw = stripScoreFromContent(rawContent);
        const content = formatSkill(cleanedRaw, format);
        const title = extractTitle(content);
        console.error(`[stream] content length=${content.length}, title="${title}", score=${score}`);

        // Save
        const userId = getUserId(request);
        const id = await insertSkill(title, domain, format, content, depth, userId || undefined, mode, score, engine, model);
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
            score,
            files: undefined,
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
