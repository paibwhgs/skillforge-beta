import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  let body: { content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const content = body.content?.trim();
  if (!content) return NextResponse.json({ error: 'content is required' }, { status: 400 });

  try {
    const res = await fetch('https://opencode.ai/zen/go/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENCODE_GO_API_KEY || ''}`,
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash',
        messages: [
          {
            role: 'system',
            content: `你是一个 Skill 质量分析师。你的任务是分析用户提交的 SKILL.md，输出评分和改进版本。

输出格式（严格按此 JSON 格式，不要 markdown 包裹）：
{
  "score": { "trigger": 0-10, "clarity": 0-10, "structure": 0-10, "examples": 0-10, "actionability": 0-10 },
  "summary": "一句话总结问题",
  "issues": ["问题1", "问题2"],
  "optimized": "---\\nname: ...\\n...\\n完整的优化后 SKILL.md"
}

评分维度：
- trigger: description 是否准确覆盖触发场景
- clarity: 规则是否清晰可执行
- structure: 结构是否对齐 Anthropic 规范（frontmatter + when-to-use + core-rules + pitfalls）
- examples: 是否有实用的代码示例
- actionability: 用户能否直接拿来用

要求：
1. 保持原 skill 的核心意图不变
2. 修复 frontmatter 格式问题
3. 补充缺失的必要部分（when-to-use、pitfalls）
4. 如果太长（>150行），压缩多余内容，把详细示例移到 references/examples.md
5. 输出 JSON 中的 optimized 字段是完整的优化后 SKILL.md（含 frontmatter）`,
          },
          { role: 'user', content },
        ],
        temperature: 0.3,
        max_tokens: 8192,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'AI 分析失败' }, { status: 500 });
    }

    const json = await res.json();
    const text = json.choices?.[0]?.message?.content || '';
    const cleaned = text.replace(/```json\s*|```/g, '').trim();

    try {
      const result = JSON.parse(cleaned);
      return NextResponse.json(result);
    } catch {
      return NextResponse.json({ error: 'AI 输出格式异常', raw: cleaned }, { status: 422 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
