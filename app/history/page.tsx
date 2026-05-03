'use client';

import { useEffect, useState } from 'react';
import type { SkillRecord } from '@/types';

export default function HistoryPage() {
  const [skills, setSkills] = useState<SkillRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/skills?limit=50')
      .then((r) => r.json())
      .then((data) => setSkills(data.skills || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatLabel = (f: string) =>
    f === 'claude' ? 'Claude Code' : f === 'markdown' ? 'Markdown' : f;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">历史记录</h1>

      {loading && <p className="text-gray-400 text-sm">加载中...</p>}

      {!loading && skills.length === 0 && (
        <p className="text-gray-400 text-center py-12">暂无记录</p>
      )}

      <div className="space-y-3">
        {skills.map((s) => (
          <div key={s.id} className="bg-white rounded-lg border overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === s.id ? null : s.id)}
              className="w-full text-left p-4 hover:bg-gray-50 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{s.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{s.domain}</p>
                </div>
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                    {formatLabel(s.format)}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      s.rating === 1
                        ? 'bg-green-100 text-green-700'
                        : s.rating === -1
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {s.rating === 1 ? '👍' : s.rating === -1 ? '👎' : '—'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(s.created_at).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              </div>
            </button>

            {expanded === s.id && (
              <div className="border-t p-4">
                <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed max-h-80 overflow-y-auto bg-gray-50 p-3 rounded">
                  {s.content}
                </pre>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(s.content);
                    }}
                    className="text-xs px-3 py-1 rounded border border-gray-200 hover:border-gray-300 transition"
                  >
                    复制
                  </button>
                  <button
                    onClick={() => {
                      const blob = new Blob([s.content], {
                        type: 'text/markdown',
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${s.title.replace(/\s+/g, '-').toLowerCase()}.md`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="text-xs px-3 py-1 rounded border border-gray-200 hover:border-gray-300 transition"
                  >
                    下载
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
