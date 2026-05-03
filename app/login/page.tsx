'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative">
      {/* Background glow */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[600px] h-[600px] bg-[#FF5C00]/5 rounded-full blur-[120px]" />

      <div className="w-full max-w-md">
        <div className="glass-panel p-8 rounded-lg relative overflow-hidden">
          {/* Accent line */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#508eff] via-[#ff5c00] to-[#508eff]" />

          <div className="mb-8 text-center">
            <h1 className="font-display text-2xl text-white mb-2">登录 SkillForge</h1>
            <p className="text-sm text-zinc-500">使用您的账号继续锻造。</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-900/30 border border-red-800 text-red-400 px-3 py-2 rounded text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="font-label text-[10px] text-zinc-400 uppercase tracking-wider block">
                电子邮件
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@company.com"
                className="w-full bg-black border border-zinc-800 px-4 py-3 text-white focus:outline-none focus:border-[#FF5C00] focus:ring-1 focus:ring-[#FF5C00]/20 transition-all text-sm placeholder:text-zinc-700"
              />
            </div>

            <div className="space-y-2">
              <label className="font-label text-[10px] text-zinc-400 uppercase tracking-wider block">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full bg-black border border-zinc-800 px-4 py-3 text-white focus:outline-none focus:border-[#FF5C00] focus:ring-1 focus:ring-[#FF5C00]/20 transition-all text-sm placeholder:text-zinc-700"
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-[#FF5C00] text-white font-bold py-4 flex items-center justify-center gap-2 hover:bg-[#E65300] transition-colors active:scale-[0.98] font-display uppercase tracking-widest text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? '登录中...' : (
                <>
                  <span>立即登录</span>
                  <span className="material-symbols-outlined text-sm">login</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-zinc-900 text-center">
            <p className="text-sm text-zinc-500">
              还没有账号？
              <a href="/register" className="text-[#FF5C00] hover:underline font-bold ml-1">
                注册
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
