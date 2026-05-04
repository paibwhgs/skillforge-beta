interface ChatOpts {
  system: string;
  user: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  messages?: { role: string; content: string }[];
}

const DEEPSEEK_BASE = 'https://api.deepseek.com/v1';

export async function* chatStream(opts: ChatOpts): AsyncGenerator<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY not configured');

  const res = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: opts.model || 'deepseek-v4-flash',
      stream: true,
      messages: opts.messages || [
        { role: 'system', content: opts.system },
        { role: 'user', content: opts.user },
      ],
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 4096,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DeepSeek API error (${res.status}): ${text}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === '[DONE]') return;

      try {
        const json = JSON.parse(payload);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch {
        // skip malformed lines
      }
    }
  }
}

const OPENCODE_GO_BASE = 'https://opencode.ai/zen/go/v1';

export async function* chatStreamOpenCodeGo(opts: ChatOpts & { model: string }): AsyncGenerator<string> {
  const apiKey = process.env.OPENCODE_GO_API_KEY;
  if (!apiKey) throw new Error('OPENCODE_GO_API_KEY not configured');

  console.error(`[llm-stream] opencode-go request: model=${opts.model}, systemLen=${opts.system?.length}, userLen=${opts.user?.length}`);

  const res = await fetch(`${OPENCODE_GO_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: opts.model,
      stream: true,
      messages: opts.messages || [
        { role: 'system', content: opts.system },
        { role: 'user', content: opts.user },
      ],
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 4096,
    }),
  });

  console.error(`[llm-stream] opencode-go response status=${res.status}`);

  if (!res.ok) {
    const text = await res.text();
    console.error(`[llm-stream] opencode-go error body=${text.slice(0, 500)}`);
    throw new Error(`OpenCode Go API error (${res.status}): ${text}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === '[DONE]') return;

      try {
        const json = JSON.parse(payload);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch {
        // skip malformed lines
      }
    }
  }
}
