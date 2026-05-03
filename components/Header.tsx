'use client';

import { useAuth } from './AuthProvider';

export function Header() {
  const { user, loading, logout } = useAuth();

  return (
    <header className="border-b bg-white shrink-0">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <a href="/" className="text-xl font-bold tracking-tight">
          <span className="text-blue-600">Skill</span>Forge
        </a>
        <nav className="flex items-center gap-4 text-sm">
          <a href="/" className="hover:text-blue-600 transition">
            首页
          </a>
          <a href="/history" className="hover:text-blue-600 transition">
            历史
          </a>
          {loading ? (
            <span className="text-gray-400 text-xs">...</span>
          ) : user ? (
            <div className="flex items-center gap-3">
              <span className="text-gray-600">{user.username}</span>
              <button
                onClick={logout}
                className="text-gray-400 hover:text-red-500 transition text-xs"
              >
                退出
              </button>
            </div>
          ) : (
            <a href="/login" className="text-blue-600 hover:underline">
              登录
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}
