import type { Metadata } from 'next';
import { AuthProvider } from '@/components/AuthProvider';
import { Header } from '@/components/Header';
import { BottomNavWrapper } from '@/components/BottomNavWrapper';
import './globals.css';

export const metadata: Metadata = {
  title: 'SkillForge — AI Skill 发现与生成引擎',
  description: '按需从互联网挖掘已验证的 AI 交互知识，自动策展并生成标准格式的 skill 文件',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-black text-[#e3e2e2] font-body">
        <AuthProvider>
          <Header />
          <main className="flex-1 w-full pt-14">{children}</main>
          <footer className="border-t border-zinc-900 bg-black text-zinc-600 text-xs shrink-0">
            <div className="max-w-7xl mx-auto px-8 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <span className="font-display text-zinc-400">SkillForge v1.0.4-alpha</span>
                <span className="w-1 h-1 bg-zinc-800 rounded-full" />
                <span className="text-zinc-500">内容由 AI 生成，仅供学习参考</span>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  系统运行正常
                </div>
              </div>
            </div>
          </footer>
          <BottomNavWrapper />
        </AuthProvider>
      </body>
    </html>
  );
}
