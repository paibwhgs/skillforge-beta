'use client';

import { useRouter } from 'next/navigation';
import type { SkillRecord } from '@/types';
import { StarRating } from './StarRating';

interface Props {
  skill: SkillRecord;
  variant?: 'featured' | 'default' | 'compact';
}

export function SkillCard({ skill, variant = 'default' }: Props) {
  const router = useRouter();
  const navigate = () => router.push(`/skills/${skill.id}`);

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
        className="group bg-[#080808] border border-zinc-900 rounded-lg p-6 hover:border-[#FF5C00]/30 transition-all cursor-pointer"
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

  // Default variant — full card with star rating
  return (
    <div
      onClick={navigate}
      className="group relative bg-[#080808] border border-zinc-900 rounded-lg overflow-hidden flex flex-col hover:border-zinc-700 transition-all cursor-pointer"
    >
      {/* Decorative header area */}
      <div className="h-32 bg-zinc-900/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] to-transparent" />
        <div className="absolute top-4 left-4 flex gap-2">
          <span className="bg-[#FF5C00]/10 border border-[#FF5C00]/20 text-[#FF5C00] font-label text-[10px] px-2 py-0.5 rounded">
            {skill.mode === 'direct' ? 'AI 直出' : '搜索策划'}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-4 flex-1 flex flex-col">
        <div className="flex-1">
          <h3 className="font-display text-lg text-white group-hover:text-[#FF5C00] transition-colors mb-1">
            {skill.title}
          </h3>
          <p className="text-zinc-500 text-xs">
            生成于: {new Date(skill.created_at).toLocaleDateString('zh-CN')}
          </p>
          <p className="text-sm text-zinc-400 mt-2 line-clamp-2">{skill.domain}</p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-zinc-900">
          <StarRating rating={skill.rating || 0} readonly size="sm" />
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
