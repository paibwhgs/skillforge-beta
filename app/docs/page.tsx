'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';

const SECTIONS = [
  { id: 'hero', label: '概览' },
  { id: 'quickstart', label: '快速开始' },
  { id: 'workflow', label: '工作流程' },
  { id: 'modes', label: '生成模式' },
  { id: 'formats', label: '输出格式' },
  { id: 'users', label: '用户系统' },
  { id: 'community', label: '社区' },
  { id: 'faq', label: '常见问题' },
];

function SectionLink({
  id,
  label,
  active,
}: {
  id: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={`#${id}`}
      className={`block text-sm py-1.5 px-3 rounded-lg transition-all border-l-2 ${
        active
          ? 'text-white border-[#FF5C00] bg-[#FF5C00]/5 font-medium'
          : 'text-zinc-500 border-transparent hover:text-zinc-300 hover:border-zinc-700'
      }`}
      scroll={false}
    >
      {label}
    </Link>
  );
}

function SectionHeading({
  icon,
  children,
}: {
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-lg bg-[#FF5C00]/10 border border-[#FF5C00]/20 flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-[#FF5C00]">{icon}</span>
      </div>
      <h2 className="font-display text-2xl text-white">{children}</h2>
    </div>
  );
}

function CodeInline({ children }: { children: React.ReactNode }) {
  return (
    <code className="text-[#FF5C00] bg-zinc-900 px-1.5 py-0.5 rounded text-xs font-mono">
      {children}
    </code>
  );
}

function TipBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-4 mt-4">
      <p className="text-xs text-zinc-500 flex items-start gap-2">
        <span className="material-symbols-outlined text-sm shrink-0 mt-0.5">lightbulb</span>
        <span>{children}</span>
      </p>
    </div>
  );
}

function FormatCard({
  icon,
  title,
  children,
  accent = '#FF5C00',
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="bg-[#080808] border border-zinc-900 rounded-xl p-6">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: `${accent}15`, border: `1px solid ${accent}25` }}>
        <span className="material-symbols-outlined text-sm" style={{ color: accent }}>{icon}</span>
      </div>
      <h3 className="text-white text-sm font-bold mb-2">{title}</h3>
      <p className="text-zinc-400 text-xs leading-relaxed">{children}</p>
    </div>
  );
}

function FaqItem({
  question,
  answer,
}: {
  question: string;
  answer: React.ReactNode;
}) {
  return (
    <div className="border border-zinc-900 rounded-xl p-5 bg-[#080808]">
      <h3 className="text-white text-sm font-bold mb-2">{question}</h3>
      <div className="text-zinc-400 text-xs leading-relaxed">{answer}</div>
    </div>
  );
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('hero');
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);

  const handleIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
    const visible = entries
      .filter((e) => e.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
    if (visible.length > 0) {
      setActiveSection(visible[0].target.id);
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: '-80px 0px -60% 0px',
      threshold: 0,
    });
    document.querySelectorAll('section[id]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [handleIntersect]);

  useEffect(() => {
    const onScroll = () => setShowTopBtn(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-theme">
      <div className="max-w-7xl mx-auto flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-56 shrink-0 relative">
          <nav className="fixed top-14 w-56 h-[calc(100vh-3.5rem)] overflow-y-auto custom-scrollbar py-8 pr-4 pl-6">
            <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-4 pl-3">
              目录
            </div>
            <div className="space-y-0.5">
              {SECTIONS.map((s) => (
                <SectionLink key={s.id} id={s.id} label={s.label} active={activeSection === s.id} />
              ))}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0 px-6 py-12">
          <div className="max-w-4xl space-y-20">

            {/* ===== Hero ===== */}
            <section id="hero" className="text-center space-y-4 pt-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#FF5C00]/30 bg-[#FF5C00]/5 text-[#FF5C00] text-[10px] font-bold uppercase tracking-widest mb-2">
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                文档
              </div>
              <h1 className="font-display text-4xl md:text-5xl text-white leading-tight">
                什么是 <span className="text-[#FF5C00]">Skill</span> ？
              </h1>
              <p className="text-zinc-400 text-base max-w-2xl mx-auto leading-relaxed">
                Skill 是一个标准化的 AI 交互知识文件，帮助 AI 编程助手快速理解你的技术栈和项目上下文。
                SkillForge 引擎可在数秒内从互联网挖掘、策展并生成高质量的 Skill 文件。
              </p>
            </section>

            {/* ===== 快速开始 ===== */}
            <section id="quickstart">
              <SectionHeading icon="rocket_launch">快速开始</SectionHeading>
              <div className="bg-[#080808] border border-zinc-900 rounded-xl p-6 md:p-8">
                <ol className="space-y-5">
                  {[
                    ['在首页输入技术领域关键词', '例如 "React 性能优化"、"Go 微服务架构"，越具体越好。'],
                    ['选择生成模式', '自动搜索（联网策展）、AI 直出（纯 LLM 生成）、深度搜索（更多来源）等多种模式可选。'],
                    ['（可选）上传参考文档', '支持拖拽上传 .md、.txt、.pdf 文件作为补充上下文，AI 会结合文档内容生成更精准的 Skill。'],
                    ['点击生成，等待策展完成', '系统会并行搜索、AI 策展、格式化输出，通常 10-30 秒完成。'],
                    ['预览、编辑、下载', '生成后在工作区查看 SKILL.md 内容，附属文件（代码示例、脚本等）会自动打包，支持 ZIP 下载。'],
                  ].map(([step, detail], i) => (
                    <li key={i} className="flex gap-4">
                      <span className="w-7 h-7 rounded-full bg-[#FF5C00]/10 border border-[#FF5C00]/20 text-[#FF5C00] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <div>
                        <h4 className="text-white text-sm font-bold mb-0.5">{step}</h4>
                        <p className="text-zinc-500 text-xs leading-relaxed">{detail}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <TipBox>
                  注册后可管理所有 Skill 历史记录、使用收藏夹和高级筛选，还能将作品发布到社区交流。
                </TipBox>
              </div>
            </section>

            {/* ===== 工作流程 ===== */}
            <section id="workflow">
              <SectionHeading icon="account_tree">工作流程</SectionHeading>
              <div className="bg-[#080808] border border-zinc-900 rounded-xl p-6 md:p-8 space-y-6">
                <p className="text-zinc-300 text-sm leading-relaxed">
                  SkillForge 的核心管线由三个步骤组成，从原始输入到标准化的 Skill 文件，全程自动化。
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-zinc-900/30 border border-zinc-900 rounded-lg p-5">
                    <div className="w-9 h-9 rounded-full bg-[#FF5C00]/10 flex items-center justify-center mb-3">
                      <span className="material-symbols-outlined text-[#FF5C00] text-sm">travel_explore</span>
                    </div>
                    <h4 className="text-white text-sm font-bold mb-1">1. 搜索</h4>
                    <p className="text-zinc-500 text-xs leading-relaxed mb-3">
                      同时调用多个搜索引擎并行检索，获取互联网最新技术资料。
                    </p>
                    <div className="text-[10px] text-zinc-600 font-mono bg-zinc-950 rounded px-2 py-1">
                      Promise.all([tavily, dashscope])
                    </div>
                  </div>
                  <div className="bg-zinc-900/30 border border-zinc-900 rounded-lg p-5">
                    <div className="w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center mb-3">
                      <span className="material-symbols-outlined text-amber-400 text-sm">psychology</span>
                    </div>
                    <h4 className="text-white text-sm font-bold mb-1">2. 策展</h4>
                    <p className="text-zinc-500 text-xs leading-relaxed mb-3">
                      DeepSeek 三层策展：丰富结果归并 → 稀疏时 AI 补充 → 无结果时种子库回退。
                    </p>
                    <div className="text-[10px] text-zinc-600 font-mono bg-zinc-950 rounded px-2 py-1">
                      rich → sparse → seed
                    </div>
                  </div>
                  <div className="bg-zinc-900/30 border border-zinc-900 rounded-lg p-5">
                    <div className="w-9 h-9 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
                      <span className="material-symbols-outlined text-green-400 text-sm">auto_awesome</span>
                    </div>
                    <h4 className="text-white text-sm font-bold mb-1">3. 生成</h4>
                    <p className="text-zinc-500 text-xs leading-relaxed mb-3">
                      格式化输出标准 Skill 文件（YAML frontmatter + Markdown），持久化到 Turso 数据库。
                    </p>
                    <div className="text-[10px] text-zinc-600 font-mono bg-zinc-950 rounded px-2 py-1">
                      format + insert + source
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-600 bg-zinc-900/20 rounded-lg px-4 py-3 border border-zinc-900">
                  <span className="material-symbols-outlined text-sm text-zinc-500">info</span>
                  搜索来源充足时进行完整策展，来源较少时由 AI 补充，无结果时回退到内置种子 skill 库。
                </div>
              </div>
            </section>

            {/* ===== 生成模式 ===== */}
            <section id="modes">
              <SectionHeading icon="tune">生成模式</SectionHeading>
              <div className="space-y-4">
                {[
                  {
                    icon: 'search',
                    title: '自动模式',
                    desc: '默认选项。先通过 Tavily + DashScope 双引擎搜索网络获取最新资料，再经 AI 策展合成。结果质量最高，适合大多数场景。',
                    tag: '推荐',
                    tagColor: '#FF5C00',
                  },
                  {
                    icon: 'auto_awesome',
                    title: 'AI 直出',
                    desc: '完全依赖 DeepSeek 内部知识直接生成，跳过搜索环节。速度快但可能不包含最新信息，适合成熟稳定的技术领域。',
                    tag: '快速',
                    tagColor: '#3b82f6',
                  },
                  {
                    icon: 'travel_explore',
                    title: '深度搜索',
                    desc: '深入搜索获取更多来源（50-90+ 条），策展结果更全面。适合需要最新 API 文档、前沿技术等场景。',
                    tag: '全面',
                    tagColor: '#8b5cf6',
                  },
                  {
                    icon: 'compare_arrows',
                    title: '多模型对比',
                    desc: '并行选择 2-3 个模型分别生成，在工作区以 tab 切换查看对比结果。完成后可选择保留最满意的版本。',
                    tag: '高级',
                    tagColor: '#f59e0b',
                  },
                  {
                    icon: 'edit_note',
                    title: '文档上传',
                    desc: '上传 .md、.txt、.pdf 文件作为补充上下文，AI 会结合文档内容生成更精准的 Skill 文件。',
                    tag: '新增',
                    tagColor: '#22c55e',
                  },
                ].map((mode) => (
                  <div
                    key={mode.title}
                    className="bg-[#080808] border border-zinc-900 rounded-xl p-5 flex items-start gap-4"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${mode.tagColor}15`,
                        border: `1px solid ${mode.tagColor}25`,
                      }}
                    >
                      <span
                        className="material-symbols-outlined text-sm"
                        style={{ color: mode.tagColor }}
                      >
                        {mode.icon}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white text-sm font-bold">{mode.title}</h3>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{
                            color: mode.tagColor,
                            backgroundColor: `${mode.tagColor}15`,
                            border: `1px solid ${mode.tagColor}25`,
                          }}
                        >
                          {mode.tag}
                        </span>
                      </div>
                      <p className="text-zinc-400 text-xs leading-relaxed">{mode.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ===== 输出格式 ===== */}
            <section id="formats">
              <SectionHeading icon="file_copy">输出格式</SectionHeading>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormatCard icon="description" title="Skill 格式（默认）">
                  带 YAML frontmatter 的标准 skill 文件，遵循 Anthropic 官方规范。可放入{' '}
                  <code className="text-zinc-500 bg-zinc-900 px-1 rounded text-[10px]">.claude/skills/</code> 目录被 Claude Code 自动识别加载。
                </FormatCard>
                <FormatCard icon="markdown" title="Markdown" accent="#3b82f6">
                  纯 Markdown 格式，通用性强。不包含 frontmatter，可导入任何支持 Markdown 的工具、平台或文档系统。
                </FormatCard>
                <FormatCard icon="inventory_2" title="OpenCLAW 格式" accent="#8b5cf6">
                    与 Markdown 格式相同，但文件命名和元数据按 OpenCLAW 规范组织，兼容 OpenCLAW 工具链。输出为单文件 Markdown。
                 </FormatCard>
              </div>
              <div className="mt-4 bg-[#080808] border border-zinc-900 rounded-xl p-5">
                <h3 className="text-white text-sm font-bold mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#FF5C00] text-sm">folder</span>
                  技能目录结构
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed mb-3">
                  SKILL.md 是核心文件，限制 150 行以内，专注触发条件和核心规则。代码示例、工具对比等详细内容会自动分包到附属文件中。生成后可下载 ZIP 包，目录结构如下：
                </p>
                <div className="bg-zinc-950 rounded-lg border border-zinc-900 p-4">
                  <pre className="text-[11px] font-mono text-zinc-400 whitespace-pre-wrap">
{`skill-name/
├── SKILL.md            ← 核心文件（必须）
├── references/         ← 参考文档、代码示例（可选）
│   ├── examples.md
│   └── tools.md
├── scripts/            ← 可执行脚本（可选）
└── assets/             ← 配置文件模板（可选）`}
                  </pre>
                </div>
              </div>
            </section>

            {/* ===== 用户系统 ===== */}
            <section id="users">
              <SectionHeading icon="account_circle">用户系统</SectionHeading>
              <div className="bg-[#080808] border border-zinc-900 rounded-xl p-6 md:p-8 space-y-4">
                <p className="text-zinc-300 text-sm leading-relaxed">
                  注册后，所有 Skill 自动关联到你的账户，跨设备登录即可无缝访问。
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-zinc-900/30 border border-zinc-900 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-[#FF5C00] text-sm">person_add</span>
                      <h4 className="text-white text-sm font-bold">注册与登录</h4>
                    </div>
                    <p className="text-zinc-500 text-xs">邮箱注册，PBKDF2 加密，JWT 认证，HTTP-only Cookie 存储，7 天有效期自动续签。</p>
                  </div>
                  <div className="bg-zinc-900/30 border border-zinc-900 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-[#FF5C00] text-sm">folder_special</span>
                      <h4 className="text-white text-sm font-bold">个人历史</h4>
                    </div>
                    <p className="text-zinc-500 text-xs">在控制台查看所有生成的 Skill，支持搜索、排序。每个用户独立隔离，数据安全。</p>
                  </div>
                  <div className="bg-zinc-900/30 border border-zinc-900 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-[#FF5C00] text-sm">bookmark</span>
                      <h4 className="text-white text-sm font-bold">收藏夹</h4>
                    </div>
                    <p className="text-zinc-500 text-xs">收藏重要的 Skill，按收藏状态快速筛选。方便长期积累技术知识库。</p>
                  </div>
                  <div className="bg-zinc-900/30 border border-zinc-900 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-[#FF5C00] text-sm">filter_list</span>
                      <h4 className="text-white text-sm font-bold">高级筛选</h4>
                    </div>
                    <p className="text-zinc-500 text-xs">按生成模式（自动/直出/深度）、格式、来源级别、时间范围等多维度过滤。</p>
                  </div>
                </div>
              </div>
            </section>

            {/* ===== 社区 ===== */}
            <section id="community">
              <SectionHeading icon="forum">社区</SectionHeading>
              <div className="bg-[#080808] border border-zinc-900 rounded-xl p-6 md:p-8 space-y-4">
                <p className="text-zinc-300 text-sm leading-relaxed">
                  社区是用户交流 Skill 使用心得和技巧的地方。登录后即可参与互动。
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-zinc-900/30 border border-zinc-900 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-[#FF5C00] text-sm">forum</span>
                      <h4 className="text-white text-sm font-bold">浏览帖子</h4>
                    </div>
                    <p className="text-zinc-500 text-xs">公开浏览所有社区帖子，查看他人的 Skill 使用经验和技巧分享。</p>
                  </div>
                  <div className="bg-zinc-900/30 border border-zinc-900 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-[#FF5C00] text-sm">rate_review</span>
                      <h4 className="text-white text-sm font-bold">发布与评论</h4>
                    </div>
                    <p className="text-zinc-500 text-xs">登录后可创建新帖、回复他人帖子，参与技术讨论和社区建设。</p>
                  </div>
                  <div className="bg-zinc-900/30 border border-zinc-900 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-[#FF5C00] text-sm">share</span>
                      <h4 className="text-white text-sm font-bold">分享 Skill</h4>
                    </div>
                    <p className="text-zinc-500 text-xs">在 Skill 详情页可一键发布到社区，让更多人看到你的作品并参与讨论。</p>
                  </div>
                </div>
              </div>
            </section>

            {/* ===== 常见问题 ===== */}
            <section id="faq">
              <SectionHeading icon="help">常见问题</SectionHeading>
              <div className="space-y-4">
                <FaqItem
                  question="生成的 Skill 文件放哪里？"
                  answer={
                    <>
                      下载的 <code className="text-zinc-300 bg-zinc-900 px-1 rounded text-[10px]">.md</code> 文件放入项目的{' '}
                      <code className="text-zinc-300 bg-zinc-900 px-1 rounded text-[10px]">.claude/skills/</code> 目录。
                      Claude Code 启动时会自动扫描该目录，按 <code className="text-zinc-300 bg-zinc-900 px-1 rounded text-[10px]">name</code> 字段匹配加载。
                    </>
                  }
                />
                <FaqItem
                  question="Skill 和普通 Markdown 有什么区别？"
                  answer={
                    <>
                      Skill 文件包含 YAML frontmatter（名称、描述、触发关键词），结构化的核心规则、工具生态和代码示例。
                      普通 Markdown 仅为自由格式文本，缺少 Claude Code 可识别的元数据。
                    </>
                  }
                />
                <FaqItem
                  question="为什么有时搜索不到结果？"
                  answer={
                    <>
                      可能的原因：① 领域过于冷门或生僻；② Tavily 或 DashScope API 额度耗尽；③ 网络问题。
                      此时会自动进入稀疏策展模式（AI 补充）或回退到种子库。建议尝试 AI 直出模式或换用更常见的描述。
                    </>
                  }
                />
                <FaqItem
                  question="多模型对比有什么好处？"
                  answer={
                    <>
                      不同模型各有擅长领域（如 DeepSeek V4 Flash 推理强、Qwen 中文好）。并行生成后可在 tab 间对比，选择最满意的结果保存。
                      特别适合架构决策类内容，获取多角度建议。
                    </>
                  }
                />
                <FaqItem
                  question="如何保护我的 API Key 隐私？"
                  answer={
                    <>
                      API 调用在服务端完成，前端不接触任何 API Key。自行部署时，API Key 配置在服务端环境变量中。
                      使用托管服务（skillforge.app）时，你的 Key 不会离开服务器。
                    </>
                  }
                />
              </div>
            </section>

          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      {showTopBtn && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 z-40 w-11 h-11 rounded-full bg-[#FF5C00] text-white flex items-center justify-center shadow-lg hover:opacity-90 active:scale-90 transition-all"
          aria-label="返回顶部"
        >
          <span className="material-symbols-outlined text-lg">arrow_upward</span>
        </button>
      )}

      {/* Mobile: Floating Section Selector */}
      <div className="md:hidden fixed bottom-20 right-4 z-40">
        <button
          onClick={() => setShowMobileNav(!showMobileNav)}
          className="w-11 h-11 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-300 flex items-center justify-center shadow-lg active:scale-90 transition-all"
          aria-label="跳转到章节"
        >
          <span className="material-symbols-outlined text-lg">list</span>
        </button>
        {showMobileNav && (
          <div className="absolute bottom-14 right-0 w-44 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
            {SECTIONS.map((s) => (
              <Link
                key={s.id}
                href={`#${s.id}`}
                onClick={() => setShowMobileNav(false)}
                className={`block px-4 py-2.5 text-xs transition-colors ${
                  activeSection === s.id
                    ? 'text-[#FF5C00] bg-[#FF5C00]/5'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                scroll={false}
              >
                {s.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
