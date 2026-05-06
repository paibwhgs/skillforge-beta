'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading, register } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Already logged in → redirect to home
  useEffect(() => {
    if (!loading && user) router.replace('/');
  }, [user, loading, router]);

  if (loading) return null;
  if (user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(email, username, password);
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
      <div className="fixed bottom-1/4 right-1/4 -z-10 w-[500px] h-[500px] bg-[#508eff]/5 blur-[100px] rounded-full" />

      <div className="w-full max-w-md">
        <div className="bg-[#080808] border border-zinc-900 p-8 md:p-10 relative overflow-hidden">
          <div className="mb-8 text-center">
            <h1 className="font-display text-2xl text-white mb-2">加入 SkillForge</h1>
            <p className="text-sm text-zinc-500">开启您的 AI 技能锻造之旅。</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-900/30 border border-red-800 text-red-400 px-3 py-2 rounded text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="font-label text-[10px] text-zinc-400 uppercase tracking-wider">
                用户名 / Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={2}
                  placeholder="Enter your handle"
                  className="w-full bg-black border border-zinc-800 focus:border-[#FF5C00] focus:ring-1 focus:ring-[#FF5C00]/20 text-white py-3 px-4 transition-all outline-none text-sm placeholder:text-zinc-700"
                />
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 text-sm">
                  person
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-label text-[10px] text-zinc-400 uppercase tracking-wider">
                邮箱 / Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="dev@skillforge.tech"
                  className="w-full bg-black border border-zinc-800 focus:border-[#FF5C00] focus:ring-1 focus:ring-[#FF5C00]/20 text-white py-3 px-4 transition-all outline-none text-sm placeholder:text-zinc-700"
                />
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 text-sm">
                  alternate_email
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-label text-[10px] text-zinc-400 uppercase tracking-wider">
                密码 / Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full bg-black border border-zinc-800 focus:border-[#FF5C00] focus:ring-1 focus:ring-[#FF5C00]/20 text-white py-3 px-4 transition-all outline-none text-sm placeholder:text-zinc-700"
                />
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 text-sm">
                  lock
                </span>
              </div>
            </div>

            <div className="bg-zinc-900/30 border border-zinc-800 p-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-[#FF5C00] text-sm">verified_user</span>
              <span className="font-mono text-xs text-zinc-400">Zero external dependencies, pure JWT auth</span>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-[#FF5C00] hover:bg-[#E65300] text-white font-bold py-4 transition-all active:scale-[0.98] font-display text-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? '注册中...' : '立即注册 / Sign Up'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-zinc-500">
              已经拥有账户？
              <a href="/login" className="text-white hover:text-[#FF5C00] transition-colors ml-1 font-bold">
                立即登录 / Login
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
