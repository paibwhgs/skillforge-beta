'use client';

import { useState, useEffect } from 'react';
import type { GenerateResponse } from '@/types';
import { FeedbackBar } from './FeedbackBar';

interface Props {
  skill: GenerateResponse['skill'];
}

export function SkillPreview({ skill }: Props) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(skill.content);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setContent(skill.content);
  }, [skill.content]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = content;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = skill.format === 'claude' ? 'md' : 'md';
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${skill.title.replace(/\s+/g, '-').toLowerCase()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sourceLabel =
    skill.sources_level === 'rich'
      ? '多来源策展'
      : skill.sources_level === 'sparse'
        ? '部分来源 + AI 补充'
        : '种子库生成';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              {sourceLabel}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {skill.format === 'claude' ? 'Claude Code' : 'Markdown'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(!editing)}
            className="px-3 py-1.5 rounded-lg text-xs border border-gray-200 hover:border-gray-300 transition"
          >
            {editing ? '预览' : '编辑'}
          </button>
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg text-xs border border-gray-200 hover:border-gray-300 transition"
          >
            {copied ? '已复制' : '复制'}
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 rounded-lg text-xs border border-gray-200 hover:border-gray-300 transition"
          >
            下载
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        {editing ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-[500px] p-4 text-sm font-mono focus:outline-none resize-none"
          />
        ) : (
          <pre className="p-4 text-sm whitespace-pre-wrap font-mono leading-relaxed max-h-[600px] overflow-y-auto">
            {content}
          </pre>
        )}
      </div>

      {skill.sources.length > 0 && (
        <details className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
          <summary className="cursor-pointer hover:text-gray-700">
            参考来源（{skill.sources.length} 条）
          </summary>
          <ul className="mt-2 space-y-1">
            {skill.sources.map((s, i) => (
              <li key={i}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}

      <FeedbackBar skillId={skill.id} />
    </div>
  );
}
