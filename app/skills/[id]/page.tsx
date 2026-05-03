'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SkillPreview } from '@/components/SkillPreview';
import { FeedbackBar } from '@/components/FeedbackBar';
import { ChatPanel } from '@/components/ChatPanel';
import { useAuth } from '@/components/AuthProvider';
import type { SkillRecord } from '@/types';

interface SourceItem {
  title: string;
  url: string;
}

export default function SkillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [skill, setSkill] = useState<SkillRecord | null>(null);
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSkill = () => {
    setLoading(true);
    setError('');
    fetch(`/api/v1/skills/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error('Skill 不存在或已被删除');
        return r.json();
      })
      .then((data) => {
        setSkill(data.skill);
        setSources(
          (data.sources || []).map((s: any) => ({ title: s.title, url: s.url }))
        );
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSkill();
  }, [id]);

  const handleContentUpdate = (content: string) => {
    setSkill((prev) => (prev ? { ...prev, content } : prev));
  };

  const modeLabel = skill?.mode === 'direct'
    ? { text: 'AI 直出', class: 'bg-[#FF5C00]/10 text-[#FF5C00] border border-[#FF5C00]/20' }
    : { text: '搜索策划', class: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' };

  const sourcesLevel = sources.length >= 3
    ? 'rich' as const
    : sources.length >= 1
      ? 'sparse' as const
      : 'none' as const;

  return (
    <div className="min-h-screen bg-black">
      {/* Loading */}
      {loading && (
        <div className="max-w-5xl mx-auto px-6 pt-20 animate-fadeIn space-y-6">
          <div className="h-8 bg-zinc-900 rounded w-1/3 animate-pulse" />
          <div className="h-4 bg-zinc-900 rounded w-1/4 animate-pulse" />
          <div className="h-[500px] bg-zinc-900/50 rounded-xl animate-pulse" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-5xl text-zinc-800 mb-4">error_outline</span>
          <p className="text-zinc-500 mb-4">{error}</p>
          <button
            onClick={() => router.push('/history')}
            className="bg-[#FF5C00] text-white px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition"
          >
            返回历史库
          </button>
        </div>
      )}

      {/* Skill Detail */}
      {skill && !loading && (
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Back button */}
          <button
            onClick={() => router.push('/history')}
            className="flex items-center gap-1 text-zinc-500 hover:text-white transition-colors text-sm mb-4 group"
          >
            <span className="material-symbols-outlined text-sm group-hover:-translate-x-0.5 transition-transform">
              arrow_back
            </span>
            返回库
          </button>

          {/* Two-column layout */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left: Skill Content */}
            <div className="flex-1 min-w-0 space-y-4">
              {/* Skill Header */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${modeLabel.class}`}>
                    {modeLabel.text}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {skill.format === 'claude' ? 'Claude Code' : 'Markdown'}
                  </span>
                  <span className="text-zinc-600 text-[10px] font-mono">
                    {new Date(skill.created_at).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                <h1 className="font-display text-2xl md:text-3xl text-white">{skill.title}</h1>
                <p className="text-zinc-400 text-sm mt-0.5">{skill.domain}</p>
              </div>

              <div className="h-px bg-zinc-900" />

              <SkillPreview
                skill={{
                  id: skill.id,
                  title: skill.title,
                  domain: skill.domain,
                  format: skill.format,
                  content: skill.content,
                  sources,
                  sources_level: sourcesLevel,
                  created_at: skill.created_at,
                }}
              />

              <FeedbackBar skillId={skill.id} />
            </div>

            {/* Right: Chat Panel — permanently visible */}
            {user && (
              <div className="w-full md:w-[420px] lg:w-[480px] shrink-0">
                <div className="md:sticky md:top-20 md:h-[calc(100vh-7rem)] flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-[#FF5C00] text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                      history
                    </span>
                    <h2 className="font-display text-sm text-white">生成日志 · AI 对话</h2>
                  </div>
                  <div className="flex-1 min-h-0">
                    <ChatPanel skillId={skill.id} onContentUpdate={handleContentUpdate} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
