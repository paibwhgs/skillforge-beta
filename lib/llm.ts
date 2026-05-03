interface ChatOpts {
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
}

const DEEPSEEK_BASE = 'https://api.deepseek.com/v1';

export async function chat(opts: ChatOpts): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY not configured');

  const res = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
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

  const json = await res.json();
  const content = json.choices[0]?.message?.content?.trim() || '';
  if (!content) throw new Error('Empty response from DeepSeek');
  return content;
}

const OPENCODE_GO_BASE = 'https://opencode.ai/zen/go/v1';

export async function chatOpenCodeGo(opts: ChatOpts & { model: string }): Promise<string> {
  const apiKey = process.env.OPENCODE_GO_API_KEY;
  if (!apiKey) throw new Error('OPENCODE_GO_API_KEY not configured');

  const res = await fetch(`${OPENCODE_GO_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: opts.model,
      messages: [
        { role: 'system', content: opts.system },
        { role: 'user', content: opts.user },
      ],
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 4096,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenCode Go API error (${res.status}): ${text}`);
  }

  const json = await res.json();
  const content = json.choices[0]?.message?.content?.trim() || '';
  if (!content) throw new Error('Empty response from OpenCode Go');
  return content;
}
