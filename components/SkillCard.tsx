'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { SkillRecord } from '@/types';

interface Props {
  skill: SkillRecord;
  variant?: 'featured' | 'default' | 'compact';
}

export function SkillCard({ skill, variant = 'default' }: Props) {
  const router = useRouter();
  const navigate = () => router.push(`/skills/${skill.id}`);
  const [bookmarked, setBookmarked] = useState(skill.bookmarked === 1);

  useEffect(() => {
    setBookmarked(skill.bookmarked === 1);
  }, [skill.bookmarked]);

  const toggleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !bookmarked;
    setBookmarked(next); // optimistic
    try {
      await fetch(`/api/v1/skills/${skill.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookmarked: next ? 1 : 0 }),
      });
    } catch {
      setBookmarked(!next); // revert on failure
    }
  };

  if (variant === 'featured') {
    return (
      <div
        onClick={navigate}
        className="md:col-span-2 lg:col-span-3 row-span-2 group relative overflow-hidden rounded-xl border border-zinc-900 bg-zinc-950/50 hover:border-zinc-700 transition-all cursor-pointer"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/50 to-zinc-950 opacity-50" />
        <div className="relative p-8 h-full flex flex-col justify-end">
          <div className="mb-4">
            <span className="px-2 py-1 bg-[#FF5C00] text-white text-[10px] font-black uppercase tracking-tighter rounded">
              热门生成
            </span>
          </div>
          <h3 className="font-display text-2xl text-white mb-2">{skill.title}</h3>
          <p className="text-zinc-400 text-sm mb-6 max-w-sm line-clamp-2">{skill.domain}</p>
          <div className="flex items-center gap-4 text-zinc-500 text-xs">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">schedule</span>
              {new Date(skill.created_at).toLocaleDateString('zh-CN')}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        onClick={navigate}
        className="group bg-[#080808] border border-zinc-900 rounded-lg p-6 hover:border-[#FF5C00]/30 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="w-10 h-10 bg-zinc-900 rounded border border-zinc-800 flex items-center justify-center">
            <span className="material-symbols-outlined text-zinc-400 group-hover:text-[#FF5C00] transition-colors">
              auto_awesome
            </span>
          </div>
          <span className="text-[10px] font-label text-zinc-600 uppercase">
            {new Date(skill.created_at).toLocaleDateString('zh-CN')}
          </span>
        </div>
        <h4 className="text-white font-bold mb-2 group-hover:text-[#FF5C00] transition-colors">{skill.title}</h4>
        <p className="text-xs text-zinc-500 mb-4 line-clamp-2">{skill.domain}</p>
        <div className="flex gap-2">
          <span className="px-2 py-1 bg-zinc-900 text-zinc-500 rounded text-[9px] font-label uppercase tracking-wider">
            {skill.format === 'claude' ? 'Claude Code' : skill.format === 'openclaw' ? 'OpenCLAW' : 'Markdown'}
          </span>
        </div>
      </div>
    );
  }

  // Color themes for card headers
  const cardThemes = [
    { gradient: 'from-[#FF5C00]/20 via-[#FF8C00]/10', icon: 'auto_awesome', iconColor: 'text-[#FF5C00]', dotColor: '#FF5C00' },
    { gradient: 'from-[#3b82f6]/20 via-[#60a5fa]/10', icon: 'terminal', iconColor: 'text-blue-400', dotColor: '#3b82f6' },
    { gradient: 'from-[#10b981]/20 via-[#34d399]/10', icon: 'code', iconColor: 'text-emerald-400', dotColor: '#10b981' },
    { gradient: 'from-[#8b5cf6]/20 via-[#a78bfa]/10', icon: 'psychology', iconColor: 'text-violet-400', dotColor: '#8b5cf6' },
    { gradient: 'from-[#ec4899]/20 via-[#f472b6]/10', icon: 'rocket_launch', iconColor: 'text-pink-400', dotColor: '#ec4899' },
    { gradient: 'from-[#f59e0b]/20 via-[#fbbf24]/10', icon: 'lightbulb', iconColor: 'text-amber-400', dotColor: '#f59e0b' },
  ];
  const themeIdx = skill.title.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % cardThemes.length;
  const theme = cardThemes[themeIdx];

  const contentPreview = skill.content
    .replace(/^#[^\n]*\n?/gm, '')
    .replace(/[#*`\[\]]/g, '')
    .replace(/\n+/g, ' ')
    .trim()
    .slice(0, 120);

  // Default variant — full card with colored header and content preview
  return (
    <div
      onClick={navigate}
      className="group relative bg-[#080808] border border-zinc-900 rounded-lg overflow-hidden flex flex-col hover:border-zinc-700 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
    >
      {/* Colored gradient header */}
      <div className="h-36 bg-zinc-900/50 relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} to-transparent`} />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, ${theme.dotColor} 1px, transparent 0)`,
            backgroundSize: '20px 20px',
          }}
        />
        <div className="absolute -bottom-6 -right-6 opacity-[0.12] group-hover:opacity-[0.18] transition-opacity">
          <span className={`material-symbols-outlined text-7xl ${theme.iconColor}`}>{theme.icon}</span>
        </div>
        <div className="absolute top-4 left-4 flex gap-2">
          <span className="bg-black/50 backdrop-blur-sm border border-white/10 text-white font-label text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
            <span className={`material-symbols-outlined text-[10px] ${theme.iconColor}`}>{theme.icon}</span>
            {skill.mode === 'direct' ? 'AI 直出' : '搜索策划'}
          </span>
          <span className="bg-black/50 backdrop-blur-sm border border-white/10 text-zinc-300 font-label text-[10px] px-2 py-0.5 rounded">
            {skill.format === 'claude' ? 'Claude Code' : skill.format === 'openclaw' ? 'OpenCLAW' : 'Markdown'}
          </span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/40 to-transparent" />
      </div>

      <div className="p-5 space-y-3 flex-1 flex flex-col">
        <div className="flex-1 min-h-0">
          <h3 className="font-display text-base text-white group-hover:text-[#FF5C00] transition-colors mb-1 font-bold leading-snug">
            {skill.title}
          </h3>
          <p className="text-[11px] text-zinc-500 flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">schedule</span>
            {new Date(skill.created_at).toLocaleDateString('zh-CN')}
          </p>
          {contentPreview && (
            <p className="text-xs text-zinc-500 mt-3 leading-relaxed line-clamp-3 border-l-2 border-zinc-800 pl-3">
              {contentPreview}...
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-zinc-900">
          <button
            onClick={toggleBookmark}
            className={`material-symbols-outlined transition-all text-lg ${
              bookmarked ? 'text-[#FF5C00] scale-110' : 'text-zinc-600 hover:text-zinc-400 hover:scale-110'
            }`}
            style={{ fontVariationSettings: bookmarked ? "'FILL' 1" : "'FILL' 0" }}
            title={bookmarked ? '取消收藏' : '收藏'}
          >
            bookmark
          </button>
          <div className="flex items-center gap-2 text-zinc-500 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">{theme.icon}</span>
            </span>
            <span className="text-zinc-600">{skill.domain}</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(); }}
            className="material-symbols-outlined text-zinc-500 hover:text-white transition-colors text-lg"
          >
            open_in_new
          </button>
        </div>
      </div>
    </div>
  );
}
