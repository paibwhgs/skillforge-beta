import type { Metadata } from 'next';
import { AuthProvider } from '@/components/AuthProvider';
import { Header } from '@/components/Header';
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
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900 font-sans">
        <AuthProvider>
          <Header />
          <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">{children}</main>
          <footer className="border-t py-4 text-center text-xs text-gray-400 shrink-0">
            内容由 AI 生成，仅供学习参考 · 提取模式而非复制原文
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
