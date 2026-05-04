'use client';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-16">

        {/* Hero */}
        <section className="text-center space-y-4 pt-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#FF5C00]/30 bg-[#FF5C00]/5 text-[#FF5C00] text-[10px] font-bold uppercase tracking-widest mb-2">
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            文档
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-white leading-tight">
            什么是 <span className="text-[#FF5C00]">Skill</span> ？
          </h1>
          <p className="text-zinc-400 text-base max-w-2xl mx-auto leading-relaxed">
            Skill 是一个标准化的 AI 交互知识文件，帮助 AI 编程助手（如 Claude Code）快速理解你的技术栈和项目上下文。
          </p>
        </section>

        {/* What is Skill */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FF5C00]/10 border border-[#FF5C00]/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#FF5C00]">description</span>
            </div>
            <h2 className="font-display text-2xl text-white">Skill 文件</h2>
          </div>
          <div className="bg-[#080808] border border-zinc-900 rounded-xl p-6 md:p-8 space-y-4 text-zinc-300 text-sm leading-relaxed">
            <p>
              Skill 是一个遵循 <code className="text-[#FF5C00] bg-zinc-900 px-1.5 py-0.5 rounded text-xs">CLAUDE.md</code> 格式的结构化文档，它封装了特定领域的最佳实践、架构知识、常用命令和工作流程。当你在 Claude Code 项目中放置一个 Skill 文件时，Claude 会自动读取并理解该领域的上下文。
            </p>
            <p>一个典型的 Skill 文件包含：</p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li><strong className="text-zinc-200">领域描述</strong> — 该 Skill 覆盖的技术或知识领域</li>
              <li><strong className="text-zinc-200">核心概念</strong> — 关键术语、架构原理和设计模式</li>
              <li><strong className="text-zinc-200">最佳实践</strong> — 经过验证的开发流程和编码规范</li>
              <li><strong className="text-zinc-200">常用命令</strong> — 开发、测试、部署等操作指南</li>
              <li><strong className="text-zinc-200">参考资源</strong> — 官方文档和进一步学习的链接</li>
            </ul>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 mt-2">
              <p className="text-xs text-zinc-500 mb-2 font-mono">示例结构：</p>
              <pre className="text-xs font-mono text-zinc-400 whitespace-pre-wrap">
{`# CLAUDE.md

## 领域
Next.js 全栈开发

## 架构
App Router、Server Components、API Routes

## 命令
\`npm run dev\` — 启动开发服务器
\`npm run build\` — 生产构建

## 最佳实践
- 优先使用 Server Components
- 数据获取在服务端进行
- ...`}
              </pre>
            </div>
          </div>
        </section>

        {/* What is SkillForge */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FF5C00]/10 border border-[#FF5C00]/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#FF5C00]">bolt</span>
            </div>
            <h2 className="font-display text-2xl text-white">SkillForge 引擎</h2>
          </div>
          <div className="bg-[#080808] border border-zinc-900 rounded-xl p-6 md:p-8 space-y-4 text-zinc-300 text-sm leading-relaxed">
            <p>
              SkillForge 是一个 AI 驱动的技能合成引擎，它能自动从互联网挖掘、策展并生成高质量的 Skill 文件。你只需输入一个领域描述，SkillForge 就会完成剩下的一切。
            </p>

            <h3 className="text-white font-bold mt-6">工作流程</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              <div className="bg-zinc-900/30 border border-zinc-900 rounded-lg p-4">
                <div className="w-8 h-8 rounded-full bg-[#FF5C00]/10 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-[#FF5C00] text-sm">travel_explore</span>
                </div>
                <h4 className="text-white text-sm font-bold mb-1">1. 搜索</h4>
                <p className="text-zinc-500 text-xs">
                  同时调用 Tavily 和 DashScope 搜索引挚，从互联网获取最新技术资料和文档。
                </p>
              </div>
              <div className="bg-zinc-900/30 border border-zinc-900 rounded-lg p-4">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-amber-400 text-sm">psychology</span>
                </div>
                <h4 className="text-white text-sm font-bold mb-1">2. 策展</h4>
                <p className="text-zinc-500 text-xs">
                  AI 分析、去重、整合搜索结果为结构化知识，提取核心概念和最佳实践。
                </p>
              </div>
              <div className="bg-zinc-900/30 border border-zinc-900 rounded-lg p-4">
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-green-400 text-sm">auto_awesome</span>
                </div>
                <h4 className="text-white text-sm font-bold mb-1">3. 生成</h4>
                <p className="text-zinc-500 text-xs">
                  输出标准 CLAUDE.md 格式的 Skill 文件，可直接用于 Claude Code 项目。
                </p>
              </div>
            </div>

            <h3 className="text-white font-bold mt-6">生成模式</h3>
            <div className="space-y-3 mt-2">
              <div className="bg-zinc-900/30 border border-zinc-900 rounded-lg p-4 flex items-start gap-3">
                <span className="material-symbols-outlined text-[#FF5C00] shrink-0 mt-0.5">search</span>
                <div>
                  <h4 className="text-white text-sm font-bold mb-0.5">自动模式（默认）</h4>
                  <p className="text-zinc-500 text-xs">
                    先搜索网络获取最新资料，再通过 AI 策展合成。结果质量高，适合大多数场景。
                  </p>
                </div>
              </div>
              <div className="bg-zinc-900/30 border border-zinc-900 rounded-lg p-4 flex items-start gap-3">
                <span className="material-symbols-outlined text-zinc-500 shrink-0 mt-0.5">auto_awesome</span>
                <div>
                  <h4 className="text-white text-sm font-bold mb-0.5">AI 直出模式</h4>
                  <p className="text-zinc-500 text-xs">
                    完全依赖 AI 内部知识生成，速度快但可能不包含最新信息。适合通用领域。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Formats */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FF5C00]/10 border border-[#FF5C00]/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#FF5C00]">file_copy</span>
            </div>
            <h2 className="font-display text-2xl text-white">输出格式</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#080808] border border-zinc-900 rounded-xl p-6">
              <h3 className="text-white font-bold mb-2">Claude Code</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                标准的 CLAUDE.md 格式，单文件输出，直接放入项目根目录即可被 Claude Code 识别使用。
              </p>
            </div>
            <div className="bg-[#080808] border border-zinc-900 rounded-xl p-6">
              <h3 className="text-white font-bold mb-2">OpenCLAW</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                多文件包格式，包含主文档、参考文档和自动化脚本，适合复杂项目使用。
              </p>
            </div>
            <div className="bg-[#080808] border border-zinc-900 rounded-xl p-6">
              <h3 className="text-white font-bold mb-2">Markdown</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                纯 Markdown 格式，通用性强，可导入任何支持 Markdown 的工具或平台。
              </p>
            </div>
          </div>
        </section>

        {/* Quick Start */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FF5C00]/10 border border-[#FF5C00]/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#FF5C00]">rocket_launch</span>
            </div>
            <h2 className="font-display text-2xl text-white">快速开始</h2>
          </div>
          <div className="bg-[#080808] border border-zinc-900 rounded-xl p-6 md:p-8 space-y-4 text-zinc-300 text-sm leading-relaxed">
            <ol className="list-decimal pl-5 space-y-3 text-zinc-400">
              <li>在首页输入你的技术领域（如 <code className="text-[#FF5C00] bg-zinc-900 px-1.5 py-0.5 rounded text-xs">React 性能优化</code>）</li>
              <li>选择生成模式（自动搜索 / AI 直出）和输出格式</li>
              <li>点击生成，等待 SkillForge 完成搜索和策展</li>
              <li>预览生成的 Skill 内容，可在线编辑或直接下载</li>
              <li>将下载的 <code className="text-[#FF5C00] bg-zinc-900 px-1.5 py-0.5 rounded text-xs">CLAUDE.md</code> 放入项目根目录</li>
            </ol>
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-4 mt-4">
              <p className="text-xs text-zinc-500 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">lightbulb</span>
                提示：生成后可以在详情页通过 AI 对话进一步编辑和优化 Skill 内容。
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
