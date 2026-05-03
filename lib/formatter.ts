export function formatClaudeCode(content: string): string {
  return content.trim();
}

export function formatMarkdown(content: string): string {
  const lines = content.trim().split('\n');
  let inFrontmatter = false;
  const body: string[] = [];

  for (const line of lines) {
    if (line.trim() === '---') {
      if (inFrontmatter) {
        inFrontmatter = false;
        continue;
      }
      inFrontmatter = true;
      continue;
    }
    if (!inFrontmatter) {
      body.push(line);
    }
  }

  return body.join('\n').trim();
}

export function extractTitle(content: string): string {
  const match = content.match(/^# (.+)$/m);
  return match ? match[1].trim() : 'Untitled Skill';
}

export function formatSkill(content: string, format: string): string {
  switch (format) {
    case 'claude':
      return formatClaudeCode(content);
    case 'markdown':
      return formatMarkdown(content);
    default:
      return content.trim();
  }
}
