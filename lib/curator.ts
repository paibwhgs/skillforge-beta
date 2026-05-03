import { chat } from './llm';
import type { SearchResult } from '@/types';
import { seeds } from '@/seeds/skills';

const CURATION_SYSTEM = `You are an AI Skill curator. Your job is to synthesize internet search results into a high-quality, immediately usable AI Skill file.

## Core principles
1. **Extract patterns, not text**: Never copy paragraphs from sources. Identify reusable workflows, prompt structures, and interaction patterns.
2. **Merge similar themes**: Combine overlapping ideas from different sources into cohesive rules.
3. **Prioritize community-validated content**: Patterns mentioned by multiple sources or with concrete examples get priority.
4. **Be honest about gaps**: If search results lack certain aspects, note it rather than fabricating.

## What NOT to do
- Do NOT copy original text passages (copyright risk)
- Do NOT include advertisements or promotional links
- Do NOT fabricate citations
- Skip irrelevant search results silently
- Do NOT claim knowledge breadth you don't have

## Required skill structure
Every generated skill MUST contain:
1. **YAML Frontmatter**: name (kebab-case), description (English, for Claude Code)
2. **When to use**: Specific scenarios that trigger this skill
3. **Rules**: Clear, actionable, verifiable instructions
4. **Examples**: Concrete before/after examples adapted from search results
5. **Boundaries**: What NOT to do, when to stop

## Output format
---
name: skill-name-here
description: "One-line description of what this skill does and when to use it"
---

# Skill Title

## When to use
- Scenario 1
- Scenario 2

## Rules
1. Rule with clear action
2. Rule with clear action

## Examples
### Example 1: descriptive title
**User**: what the user says
**Assistant**: what the assistant should do

## Boundaries
- Don't do X
- Stop when Y
- Escalate Z cases

## Sources
- [Title](URL)
- [Title](URL)
`;

function buildCuratorPrompt(domain: string, results: SearchResult[]): string {
  const resultsBlock = results
    .map(
      (r, i) =>
        `${i + 1}. **${r.title}**\n   URL: ${r.url}\n   Snippet: ${r.content.slice(0, 500)}`,
    )
    .join('\n\n');

  return `## User domain
${domain}

## Search results
${resultsBlock}

Generate a comprehensive skill file for this domain based on the search results above. Follow the curation principles and output format exactly.`;
}

const DIRECT_SYSTEM = `You are an AI Skill author. Your job is to generate a high-quality, immediately usable AI Skill file based on your training knowledge.

## Core principles
1. **Focus on actionable patterns**: Provide concrete workflows, prompt structures, and interaction patterns.
2. **Be specific**: Give real examples and precise instructions, not vague advice.
3. **Acknowledge limitations**: You are generating from existing knowledge, not live research. If you're uncertain about something, state it clearly.

## Required skill structure
Every generated skill MUST contain:
1. **YAML Frontmatter**: name (kebab-case), description (English, for Claude Code)
2. **When to use**: Specific scenarios that trigger this skill
3. **Rules**: Clear, actionable, verifiable instructions
4. **Examples**: Concrete before/after examples
5. **Boundaries**: What NOT to do, when to stop

## Output format
---
name: skill-name-here
description: "One-line description of what this skill does and when to use it"
---

# Skill Title

## When to use
- Scenario 1
- Scenario 2

## Rules
1. Rule with clear action
2. Rule with clear action

## Examples
### Example 1: descriptive title
**User**: what the user says
**Assistant**: what the assistant should do

## Boundaries
- Don't do X
- Stop when Y
- Escalate Z cases

**Note**: This skill was generated from AI knowledge without web search. For the most up-to-date information, consider enabling web search.`;

export async function directGenerate(domain: string): Promise<string> {
  return chat({
    system: DIRECT_SYSTEM,
    user: `Generate a comprehensive skill file for the domain: "${domain}"

Draw from your training knowledge to create the most useful, accurate skill possible. Include practical examples and specific rules that someone working in this domain would find valuable.

If the domain is highly specific or rapidly changing (e.g., a particular framework version), note any uncertainty about currency.`,
    temperature: 0.7,
  });
}

export async function curate(
  domain: string,
  results: SearchResult[],
  level: 'rich' | 'sparse' | 'none',
): Promise<string> {
  const block = results
    .map((r) => `- ${r.title} (${r.url}): ${r.content.slice(0, 300)}`)
    .join('\n');

  // L1: Rich results — normal curation
  if (level === 'rich') {
    return chat({
      system: CURATION_SYSTEM,
      user: buildCuratorPrompt(domain, results),
      temperature: 0.7,
    });
  }

  // L2: Sparse results — mix search + AI knowledge
  if (level === 'sparse') {
    return chat({
      system: CURATION_SYSTEM,
      user: `## User domain
${domain}

## Search results (limited — only ${results.length} found)
${block || '(no useful results)'}

## Special instruction
Search results are sparse. Supplement with general AI knowledge for this domain, but clearly note in the output that "Search results were limited; content partially based on AI general knowledge." Do NOT fabricate citations.`,
      temperature: 0.7,
    });
  }

  // L3: No results — fallback to seed library
  return fallbackSeed(domain);
}

function fallbackSeed(domain: string): string {
  const keywords = domain.toLowerCase();
  let bestMatch = seeds.general; // default

  for (const [key, skill] of Object.entries(seeds)) {
    if (key === 'general') continue;
    if (keywords.includes(key)) {
      bestMatch = skill;
      break;
    }
  }

  const fallbackSkill = `---
name: ai-assistant-for-${domain.slice(0, 30).replace(/[^a-z0-9-]/g, '-')}
description: "General AI assistant skill for ${domain}. Generated from seed library because web search returned no results."
---

${bestMatch.replace('{domain}', domain)}

> Note: Search results unavailable. Generated from seed library. Refine with detailed prompts for best results.
`;

  return fallbackSkill;
}
