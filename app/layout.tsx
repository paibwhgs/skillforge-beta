import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SkillForge — AI Skill 发现与生成引擎",
  description: "按需从互联网挖掘已验证的 AI 交互知识，自动策展并生成标准格式的 skill 文件",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900 font-sans">
        <header className="border-b bg-white shrink-0">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="text-xl font-bold tracking-tight">
              <span className="text-blue-600">Skill</span>Forge
            </a>
            <nav className="flex items-center gap-4 text-sm">
              <a href="/" className="hover:text-blue-600 transition">首页</a>
              <a href="/history" className="hover:text-blue-600 transition">历史</a>
            </nav>
          </div>
        </header>
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
          {children}
        </main>
        <footer className="border-t py-4 text-center text-xs text-gray-400 shrink-0">
          内容由 AI 生成，仅供学习参考 · 提取模式而非复制原文
        </footer>
      </body>
    </html>
  );
}
