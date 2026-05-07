import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  let body: { domain?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const domain = body.domain?.trim();
  if (!domain) return NextResponse.json({ error: 'domain is required' }, { status: 400 });

  // Use a simple prompt to generate clarifying questions
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
          { role: 'system', content: '你是一个需求分析师。根据用户输入的技术领域，生成 3 个精炼的 clarifying questions（每个问题一句话，中文）。问题要帮助确定该 Skill 的受众、核心覆盖范围和边界。直接返回 JSON 数组，不要 markdown 包裹。格式: ["问题1", "问题2", "问题3"]' },
          { role: 'user', content: domain },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!res.ok) {
      // Return default questions on failure
      return NextResponse.json({
        questions: [
          '这个 Skill 的主要受众是谁？开发者、运维还是普通用户？',
          '你期望覆盖哪些核心技术点或场景？',
          '有没有特别的要求或限制？（如技术栈版本、偏好的工具链等）',
        ],
      });
    }

    const json = await res.json();
    const text = json.choices?.[0]?.message?.content || '';
    const cleaned = text.replace(/```json\s*|```/g, '').trim();

    let questions: string[];
    try {
      questions = JSON.parse(cleaned);
    } catch {
      questions = text.split('\n').filter((l: string) => l.match(/^["\d]/)).slice(0, 3).map((l: string) => l.replace(/^\d+[.、．]\s*/, '').replace(/^"/, '').replace(/",?$/, ''));
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      questions = [
        '这个 Skill 的主要受众是谁？开发者、运维还是普通用户？',
        '你期望覆盖哪些核心技术点或场景？',
        '有没有特别的要求或限制？（如技术栈版本、偏好的工具链等）',
      ];
    }

    return NextResponse.json({ questions: questions.slice(0, 3) });
  } catch {
    return NextResponse.json({
      questions: [
        '这个 Skill 的主要受众是谁？开发者、运维还是普通用户？',
        '你期望覆盖哪些核心技术点或场景？',
        '有没有特别的要求或限制？（如技术栈版本、偏好的工具链等）',
      ],
    });
  }
}
