import { NextRequest } from 'next/server';
import { initDB, getSkill, updateSkillContent, getChatMessages, saveChatMessage } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { chatStream, chatStreamOpenCodeGo } from '@/lib/llm-stream';

export async function GET(request: NextRequest) {
  await initDB();
  const { searchParams } = new URL(request.url);
  const skillId = searchParams.get('skillId');
  if (!skillId) {
    return new Response(JSON.stringify({ error: 'skillId required' }), { status: 400 });
  }
  const messages = await getChatMessages(skillId);
  return new Response(JSON.stringify({ messages }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: NextRequest) {
  await initDB();

  const userId = getUserId(request);
  if (!userId) {
    return new Response(JSON.stringify({ error: '请先登录' }), { status: 401 });
  }

  let body: { skillId?: string; message?: string; history?: { role: string; content: string }[]; engine?: string; model?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { skillId, message, history = [] } = body;
  const engine = body.engine || 'deepseek';
  const model = body.model || 'deepseek-chat';

  if (!skillId || !message) {
    return new Response(JSON.stringify({ error: 'skillId and message required' }), { status: 400 });
  }

  const skill = await getSkill(skillId);
  if (!skill) {
    return new Response(JSON.stringify({ error: 'Skill not found' }), { status: 404 });
  }

  const systemPrompt = `你是一个帮助用户修改 skill 文档的 AI 助手。Skill 文档是 Markdown 格式，包含特定领域的结构化知识。

当前 skill 内容如下（用 --- 包裹）：

---
${skill.content}
---

当用户要求修改时，你可以在正常对话中回复修改建议。如果要提供完整更新后的内容，请在你的回复末尾用下面的格式包裹：

~~~skill-content
[完整的更新后内容]
~~~

确保内容块包含完整的 skill 文件内容。如果用户没有要求具体改动，正常对话即可。`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ];

  const encoder = new TextEncoder();
  let fullContent = '';
  let skillContentUpdated = false;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const llmStream = engine === 'opencode-go'
          ? chatStreamOpenCodeGo({ system: systemPrompt, user: message, temperature: 0.7, maxTokens: 8192, messages, model })
          : chatStream({ system: systemPrompt, user: message, model, temperature: 0.7, maxTokens: 8192, messages });

        for await (const token of llmStream) {
          fullContent += token;
          controller.enqueue(
            encoder.encode(`event: token\ndata: ${JSON.stringify({ text: token })}\n\n`),
          );
        }

        // Save messages to chat history
        await saveChatMessage(skillId, 'user', message);
        await saveChatMessage(skillId, 'assistant', fullContent);

        // After stream ends, detect skill-content block
        const match = fullContent.match(/~~~skill-content\n?([\s\S]*?)\n?~~~/);
        if (match) {
          const updated = match[1].trim();
          if (updated && updated !== skill.content) {
            await updateSkillContent(skillId, updated);
            skillContentUpdated = true;
            controller.enqueue(
              encoder.encode(`event: update\ndata: ${JSON.stringify({ content: updated })}\n\n`),
            );
          }
        }

        controller.enqueue(encoder.encode('event: done\ndata: {}\n\n'));
        controller.close();
      } catch (err) {
        controller.enqueue(
          encoder.encode(`event: error\ndata: ${JSON.stringify({ error: String(err) })}\n\n`),
        );
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
