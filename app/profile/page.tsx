'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { SkillCard } from '@/components/SkillCard';
import type { SkillRecord } from '@/types';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [skills, setSkills] = useState<SkillRecord[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    fetch('/api/v1/skills?limit=50')
      .then((r) => r.json())
      .then((data) => setSkills(data.skills || []))
      .catch(() => setSkills([]))
      .finally(() => setSkillsLoading(false));
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-black pt-14 flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-500">
          <span className="material-symbols-outlined animate-spin text-lg">hourglass_top</span>
          <span className="text-sm">加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-14">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Profile Header */}
        <div className="flex items-center gap-6 mb-12 animate-fadeInUp">
          <div className="w-16 h-16 rounded-full bg-[#FF5C00]/20 border-2 border-[#FF5C00]/30 flex items-center justify-center shrink-0">
            <span className="text-2xl font-display font-bold text-[#FF5C00]">
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="font-display text-2xl text-white font-bold mb-1">{user.username}</h1>
            <p className="text-zinc-500 text-sm">{user.email}</p>
            <p className="text-zinc-600 text-xs mt-1">
              注册于 {new Date(user.created_at).toLocaleDateString('zh-CN')}
            </p>
          </div>
        </div>

        {/* Skills Section */}
        <div className="mb-6 animate-fadeInUp stagger-1">
          <h2 className="font-display text-lg text-white font-bold mb-2">我的 Skill</h2>
          <p className="text-zinc-500 text-sm">共生成 {skills.length} 个 skill</p>
        </div>

        {skillsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-zinc-950/50 border border-zinc-900 rounded-lg p-6 animate-pulse">
                <div className="h-4 bg-zinc-900 rounded w-2/3 mb-4" />
                <div className="h-3 bg-zinc-900 rounded w-1/2 mb-3" />
                <div className="h-3 bg-zinc-900 rounded w-full" />
              </div>
            ))}
          </div>
        ) : skills.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-zinc-900 rounded-xl animate-fadeInUp stagger-2">
            <span className="material-symbols-outlined text-4xl text-zinc-800 mb-4 block">auto_awesome</span>
            <p className="text-zinc-500 mb-2">还没有生成过 skill</p>
            <button
              onClick={() => router.push('/')}
              className="bg-[#FF5C00] text-white px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition"
            >
              开始生成
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skills.map((skill, i) => (
              <div key={skill.id} className="animate-fadeInUp" style={{ animationDelay: `${(i % 6) * 60}ms` }}>
                <SkillCard skill={skill} variant="compact" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
