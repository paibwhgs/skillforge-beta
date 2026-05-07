'use client';

import { useAuth } from './AuthProvider';
import { usePathname } from 'next/navigation';
import { useTheme } from './ThemeProvider';

export function Header() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  const isActive = (path: string) => pathname === path;

  return (
    <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-zinc-900 h-14">
      <div className="h-full max-w-7xl mx-auto px-6 flex items-center justify-between">
        <a href="/" className="text-xl font-bold text-[#FF5C00] font-display tracking-tighter">
          SkillForge
        </a>
        <nav className="hidden md:flex items-center gap-8 h-full text-sm">
          <a
            href="/"
            className={`h-full flex items-center transition-colors ${
              isActive('/')
                ? 'text-white border-b-2 border-[#FF5C00] font-medium'
                : 'text-zinc-500 hover:text-zinc-200'
            }`}
          >
            首页
          </a>
          <a
            href="/history"
            className={`h-full flex items-center transition-colors ${
              isActive('/history')
                ? 'text-white border-b-2 border-[#FF5C00] font-medium'
                : 'text-zinc-500 hover:text-zinc-200'
            }`}
          >
            控制台
          </a>
          <a
            href="/community"
            className={`h-full flex items-center transition-colors ${
              isActive('/community')
                ? 'text-white border-b-2 border-[#FF5C00] font-medium'
                : 'text-zinc-500 hover:text-zinc-200'
            }`}
          >
            社区
          </a>
          <a
            href="/docs"
            className={`h-full flex items-center transition-colors ${
              isActive('/docs')
                ? 'text-white border-b-2 border-[#FF5C00] font-medium'
                : 'text-zinc-500 hover:text-zinc-200'
            }`}
          >
            文档
          </a>
        </nav>
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggle}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-all active:scale-90"
            title={theme === 'dark' ? '切换日间模式' : '切换夜间模式'}
          >
            <span className="material-symbols-outlined text-sm">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
          {loading ? (
            <span className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-3 pl-3 border-l border-zinc-800">
              <span className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center text-xs font-medium">
                {user.username.charAt(0).toUpperCase()}
              </span>
              <span className="text-zinc-300 text-sm hidden sm:block">{user.username}</span>
              <button
                onClick={logout}
                className="text-xs text-zinc-500 hover:text-red-400 transition"
              >
                退出
              </button>
            </div>
          ) : (
            <a
              href="/login"
              className="bg-[#FF5C00] text-white px-4 py-1.5 text-sm font-bold hover:opacity-90 active:scale-95 transition-all rounded-lg"
            >
              登录
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
