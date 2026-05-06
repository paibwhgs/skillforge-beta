'use client';

import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', icon: 'rss_feed', label: '首页' },
  { href: '/history', icon: 'folder_special', label: '库' },
  { href: '/community', icon: 'forum', label: '社区' },
  { href: '/profile', icon: 'account_circle', label: '个人中心' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 w-full z-50 md:hidden bg-black/90 backdrop-blur-xl border-t border-zinc-800 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = item.href !== '#' && pathname.startsWith(item.href);
          return (
            <a
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center text-[10px] uppercase tracking-widest transition-all active:scale-90 ${
                isActive
                  ? 'text-[#FF5C00] scale-110'
                  : 'text-zinc-600 hover:text-zinc-300'
              }`}
            >
              <span className="material-symbols-outlined text-lg mb-1">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
