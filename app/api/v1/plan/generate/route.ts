import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  let body: { domain?: string; answers?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const domain = body.domain?.trim();
  const answers = body.answers?.trim();
  if (!domain) return NextResponse.json({ error: 'domain is required' }, { status: 400 });

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
            content: `你是一个 Skill 规划师。根据用户提供的领域和需求问答，生成一份结构化的 Skill 规划方案。

要求：
1. 输出纯文本 Markdown，不要代码块包裹
2. 包含以下部分：
   - ## 概述（Skill 定位一句话）
   - ## 覆盖范围（核心技术点、场景列表）
   - ## 输出结构（SKILL.md 及各附属文件）
   - ## 核心规则要点（3-5 条）
3. 保持简洁，不超过 500 字
4. 用中文输出`,
          },
          {
            role: 'user',
            content: `领域: ${domain}\n\n需求问答:\n${answers || '用户未提供额外需求'}`,
          },
        ],
        temperature: 0.4,
        max_tokens: 2000,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({
        plan: `## ${domain} - 规划方案\n\n### 覆盖范围\n- 核心概念与最佳实践\n- 常用工具与框架\n- 代码示例与模式\n\n### 输出结构\n- \`SKILL.md\`: 核心规则与触发条件\n- \`references/examples.md\`: 详细代码示例`,
      });
    }

    const json = await res.json();
    const plan = json.choices?.[0]?.message?.content || '';
    return NextResponse.json({ plan });
  } catch {
    return NextResponse.json({
      plan: `## ${domain} - 规划方案\n\n### 覆盖范围\n- 核心概念与最佳实践\n- 常用工具与框架\n- 代码示例与模式\n\n### 输出结构\n- \`SKILL.md\`: 核心规则与触发条件\n- \`references/examples.md\`: 详细代码示例`,
    });
  }
}
