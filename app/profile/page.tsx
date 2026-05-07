'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
    <div className="min-h-screen bg-theme pt-14 flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-500">
          <span className="material-symbols-outlined animate-spin text-lg">hourglass_top</span>
          <span className="text-sm">加载中...</span>
        </div>
      </div>
    );
  }

  const links = [
    { href: '/history', icon: 'folder_special', label: '历史库', desc: '查看和管理所有生成的 Skill' },
    { href: '/', icon: 'bolt', label: '生成 Skill', desc: '输入领域描述，开始铸造' },
    { href: '/docs', icon: 'menu_book', label: '使用文档', desc: '了解 SkillForge 的功能和用法' },
    { href: '/community', icon: 'forum', label: '社区', desc: '交流 skill 使用心得和技巧' },
  ];

  return (
    <div className="min-h-screen bg-theme pt-14">
      <div className="max-w-2xl mx-auto px-6 py-12 space-y-10">
        {/* Profile Header */}
        <div className="flex items-center gap-6 animate-fadeInUp">
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

        <div className="h-px bg-zinc-900" />

        {/* Quick Links */}
        <div className="space-y-3">
          <h2 className="font-display text-sm text-zinc-400 uppercase tracking-widest font-bold">快捷入口</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {links.map((link) => (
              <button
                key={link.href}
                onClick={() => router.push(link.href)}
                className="group bg-[#080808] border border-zinc-900 rounded-xl p-4 text-left hover:border-zinc-700 hover:-translate-y-0.5 transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-[#FF5C00]/10 border border-[#FF5C00]/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#FF5C00] text-sm">{link.icon}</span>
                  </div>
                  <h3 className="text-white text-sm font-bold group-hover:text-[#FF5C00] transition-colors">{link.label}</h3>
                </div>
                <p className="text-zinc-500 text-xs pl-12">{link.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-zinc-900" />

        {/* Account Actions */}
        <div className="space-y-3">
          <h2 className="font-display text-sm text-zinc-400 uppercase tracking-widest font-bold">账户</h2>
          <div className="bg-[#080808] border border-zinc-900 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-zinc-500 text-sm">person</span>
                <span className="text-sm text-zinc-300">用户名</span>
              </div>
              <span className="text-sm text-white font-medium">{user.username}</span>
            </div>
            <div className="h-px bg-zinc-900" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-zinc-500 text-sm">email</span>
                <span className="text-sm text-zinc-300">邮箱</span>
              </div>
              <span className="text-sm text-zinc-400">{user.email}</span>
            </div>
            <div className="h-px bg-zinc-900" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-zinc-500 text-sm">calendar_month</span>
                <span className="text-sm text-zinc-300">注册时间</span>
              </div>
              <span className="text-sm text-zinc-400">
                {new Date(user.created_at).toLocaleDateString('zh-CN')}
              </span>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full py-3 rounded-xl border border-red-900/50 text-red-400 text-sm font-bold hover:bg-red-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">logout</span>
          退出登录
        </button>
      </div>
    </div>
  );
}
