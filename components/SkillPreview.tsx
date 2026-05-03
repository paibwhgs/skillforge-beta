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
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${skill.title.replace(/\s+/g, '-').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sourceLabel =
    skill.sources_level === 'rich'
      ? { text: '多来源策展', class: 'bg-[#FF5C00]/10 text-[#FF5C00] border border-[#FF5C00]/20' }
      : skill.sources_level === 'sparse'
        ? { text: '部分来源 + AI 补充', class: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' }
        : { text: 'AI 直出', class: 'bg-zinc-800 text-zinc-400 border border-zinc-700' };

  const formatLabel = skill.format === 'claude' ? 'Claude Code' : 'Markdown';

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Floating Action Buttons */}
      <div className="flex sm:flex-col gap-2 sm:fixed sm:right-6 sm:top-1/2 sm:-translate-y-1/2 z-30">
        <div className="flex sm:flex-col gap-2 bg-zinc-900/50 backdrop-blur border border-zinc-800 p-2 rounded-xl">
          <button
            onClick={handleCopy}
            className="group relative flex items-center justify-center w-10 h-10 rounded-lg hover:bg-[#FF5C00] text-zinc-400 hover:text-white transition-all"
            title="复制内容"
          >
            <span className="material-symbols-outlined text-lg">
              {copied ? 'check' : 'content_copy'}
            </span>
            <span className="absolute left-12 bg-zinc-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {copied ? '已复制' : '复制'}
            </span>
          </button>
          <button
            onClick={handleDownload}
            className="group relative flex items-center justify-center w-10 h-10 rounded-lg hover:bg-[#FF5C00] text-zinc-400 hover:text-white transition-all"
            title="下载 Markdown"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            <span className="absolute left-12 bg-zinc-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              下载 .md
            </span>
          </button>
          <div className="h-px bg-zinc-800 mx-2" />
          <button
            onClick={() => setEditing(!editing)}
            className="group relative flex items-center justify-center w-10 h-10 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all"
            title={editing ? '预览' : '编辑'}
          >
            <span className="material-symbols-outlined text-lg">{editing ? 'visibility' : 'edit'}</span>
            <span className="absolute left-12 bg-zinc-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {editing ? '预览' : '编辑'}
            </span>
          </button>
        </div>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${sourceLabel.class}`}>
          {sourceLabel.text}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
          {formatLabel}
        </span>
        {skill.sources_level === 'none' && (
          <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
            无搜索
          </span>
        )}
      </div>

      {/* Editor Card */}
      <div className="border border-zinc-900 rounded-xl overflow-hidden bg-[#080808]">
        {/* File Header Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-950 border-b border-zinc-900">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <span className="text-xs font-mono text-zinc-500">
              <span className="material-symbols-outlined text-blue-400 text-sm align-text-bottom mr-1">markdown</span>
              {skill.title.replace(/\s+/g, '-').toLowerCase()}.md
            </span>
          </div>
          <div className="flex items-center gap-4">
            {editing && (
              <span className="text-[10px] text-zinc-500 font-mono">编辑模式</span>
            )}
            <span className="text-[10px] text-zinc-600 font-mono">UTF-8</span>
            <span className="text-[10px] text-zinc-600 font-mono">Markdown</span>
          </div>
        </div>

        {/* Code Content */}
        {editing ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-[500px] p-6 text-sm font-mono leading-relaxed focus:outline-none resize-none bg-[#080808] text-zinc-300"
          />
        ) : (
          <pre className="p-6 text-sm font-mono leading-relaxed max-h-[600px] overflow-y-auto text-zinc-300 whitespace-pre-wrap">
            {content}
          </pre>
        )}
      </div>

      {/* Sources */}
      {skill.sources.length > 0 && (
        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4">
          <details className="group">
            <summary className="text-sm text-zinc-300 cursor-pointer hover:text-white list-none flex items-center gap-2 select-none">
              <span className="material-symbols-outlined text-zinc-500 text-lg transition-transform group-open:rotate-90">
                chevron_right
              </span>
              参考来源（{skill.sources.length} 条）
            </summary>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              {skill.sources.map((s, i) => (
                <a
                  key={i}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 border border-zinc-900 bg-black/40 rounded-lg hover:border-zinc-700 transition-colors group"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm text-zinc-200 font-medium group-hover:text-[#FF5C00] transition-colors truncate max-w-[80%]">
                      {s.title || s.url.replace(/https?:\/\//, '').slice(0, 30)}
                    </span>
                    <span className="material-symbols-outlined text-zinc-600 group-hover:text-zinc-400 text-sm shrink-0">
                      open_in_new
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 truncate">{s.url}</p>
                </a>
              ))}
            </div>
          </details>
        </div>
      )}

      <FeedbackBar skillId={skill.id} />
    </div>
  );
}
