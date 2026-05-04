'use client';

import { Suspense, useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { WorkspaceLog } from '@/components/WorkspaceLog';
import { DEFAULT_MODEL } from '@/types';
import type { SkillFile } from '@/types';

interface LogEntry {
  type: 'search' | 'check' | 'curating' | 'format' | 'error' | 'info';
  text: string;
  ts: string;
}

interface SourceItem {
  title: string;
  url: string;
}

function WorkspaceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const abortRef = useRef<AbortController | null>(null);
  const contentRef = useRef<HTMLPreElement>(null);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [content, setContent] = useState('');
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [streaming, setStreaming] = useState(true);
  const [error, setError] = useState('');
  const [skillId, setSkillId] = useState<string | null>(null);
  const [files, setFiles] = useState<SkillFile[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string>('');
  const [progress, setProgress] = useState(0);

  const domain = searchParams.get('domain') || '';
  const format = searchParams.get('format') || 'claude';
  const depth = searchParams.get('depth') || 'quick';
  const mode = searchParams.get('mode') || 'auto';
  const engine = searchParams.get('engine') || DEFAULT_MODEL.engine;
  const model = searchParams.get('model') || DEFAULT_MODEL.model;

  const addLog = useCallback((type: LogEntry['type'], text: string) => {
    setLogs((prev) => [
      ...prev,
      { type, text, ts: new Date().toLocaleTimeString('zh-CN', { hour12: false }) },
    ]);
  }, []);

  useEffect(() => {
    if (!domain) return;

    const abortController = new AbortController();
    abortRef.current = abortController;

    let accumulatedContent = '';

    const connect = async () => {
      try {
        const res = await fetch('/api/v1/generate/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain, format, depth, mode, engine, model }),
          signal: abortController.signal,
        });

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          let i = 0;
          while (i < lines.length) {
            const line = lines[i];

            if (line.startsWith('event: ')) {
              const event = line.slice(7).trim();
              const dataLine = lines[i + 1];
              if (dataLine && dataLine.startsWith('data: ')) {
                const data = JSON.parse(dataLine.slice(6));

                switch (event) {
                  case 'log':
                    addLog(data.type, data.text);
                    // Update progress based on log type
                    if (data.type === 'check') setProgress(20);
                    else if (data.type === 'curating') setProgress(35);
                    else if (data.type === 'format') setProgress(75);
                    break;

                  case 'token':
                    accumulatedContent += data.text;
                    setContent(accumulatedContent);
                    console.log('[workspace] token', { len: data.text?.length, total: accumulatedContent.length });
                    break;

                  case 'source':
                    setSources((prev) => [...prev, { title: data.title, url: data.url }]);
                    break;

                  case 'file':
                    setFiles((prev) => {
                      const next = [...prev, { path: data.path, content: data.content }];
                      if (next.length === 1) setActiveFilePath(data.path);
                      return next;
                    });
                    break;

                  case 'done':
                    console.log('[workspace] done event', { contentLen: data.skill.content?.length, title: data.skill.title });
                    setProgress(100);
                    setStreaming(false);
                    setContent(data.skill.content);
                    setSkillId(data.skill.id);
                    if (data.skill.files) {
                      setFiles(data.skill.files);
                      if (data.skill.files.length > 0) setActiveFilePath(data.skill.files[0].path);
                    }
                    addLog('check', 'Skill 生成完成！');
                    break;

                  case 'error':
                    console.error('[workspace] error event', data.error);
                    setError(data.error);
                    setStreaming(false);
                    addLog('error', data.error);
                    break;
                }
              }
              i += 2;
            } else {
              i += 1;
            }
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          addLog('info', '已停止生成');
        } else {
          setError(err.message || '连接错误');
          addLog('error', err.message || '连接错误');
        }
      } finally {
        setStreaming(false);
      }
    };

    connect();

    return () => {
      abortController.abort();
    };
  }, [domain, format, depth, mode, addLog]);

  const handleStop = () => {
    abortRef.current?.abort();
    setStreaming(false);
  };

  // Auto-scroll content
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [content]);

  if (!domain) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center pt-14">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-zinc-800 mb-4">terminal</span>
          <p className="text-zinc-500 mb-4">没有指定领域参数</p>
          <button
            onClick={() => router.push('/')}
            className="bg-[#FF5C00] text-white px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const fileName = `${domain.replace(/\s+/g, '-').toLowerCase()}.md`;

  return (
    <div className="min-h-screen bg-black pt-14 flex flex-col md:flex-row">
      {/* Left Sidebar: Generation Log */}
      <aside className="w-full md:w-80 border-r border-zinc-900 bg-zinc-950 flex flex-col shrink-0">
        <div className="p-4 border-b border-zinc-900">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-sm text-white">生成日志</h2>
            {streaming && (
              <span className="px-2 py-0.5 rounded text-[10px] bg-[#FF5C00]/20 text-[#FF5C00] border border-[#FF5C00]/30 animate-pulse">
                实时
              </span>
            )}
          </div>
          {streaming && (
            <button
              onClick={handleStop}
              className="w-full py-2 px-4 rounded bg-red-900/50 text-red-400 text-xs flex items-center justify-center gap-2 hover:bg-red-800/50 transition-all active:scale-95 font-bold"
            >
              <span className="material-symbols-outlined text-sm">stop_circle</span>
              停止生成
            </button>
          )}
          {!streaming && skillId && (
            <button
              onClick={() => router.push(`/skills/${skillId}`)}
              className="w-full py-2 px-4 rounded bg-[#FF5C00] text-white text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 font-bold"
            >
              <span className="material-symbols-outlined text-sm">open_in_new</span>
              查看 Skill
            </button>
          )}
          {!streaming && error && (
            <button
              onClick={() => router.push('/')}
              className="w-full py-2 px-4 rounded bg-zinc-800 text-zinc-400 text-xs flex items-center justify-center gap-2 hover:bg-zinc-700 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">home</span>
              返回首页
            </button>
          )}
        </div>

        {/* Log Entries */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
          {logs.length === 0 && (
            <div className="text-center text-zinc-600 text-xs mt-8">
              <span className="material-symbols-outlined text-3xl mb-2">hourglass_empty</span>
              <p>正在连接...</p>
            </div>
          )}
          {logs.map((log, i) => (
            <WorkspaceLog
              key={i}
              type={log.type}
              text={log.text}
              ts={log.ts}
              active={log.type === 'curating' && streaming}
            />
          ))}
        </div>

        {/* Progress Bar */}
        <div className="p-4 bg-black/40 border-t border-zinc-900">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="material-symbols-outlined text-[#FF5C00] text-sm"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              bolt
            </span>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              AI 智能体状态
            </span>
          </div>
          <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#FF5C00] h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </aside>

      {/* Right Main Panel */}
      <section className="flex-1 flex flex-col bg-surface overflow-hidden">
        {/* Code Editor */}
        <div className="flex-1 flex flex-col min-h-0 border-b border-zinc-900">
          <div className="flex items-center justify-between px-4 py-2 bg-zinc-950/50 border-b border-zinc-900">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-blue-400 text-sm">markdown</span>
              <span className="text-xs font-mono text-zinc-400">{fileName}</span>
            </div>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            </div>
          </div>
          {/* File Tabs (for OpenCLAW multi-file packages) */}
          {files.length > 0 && (
            <div className="flex items-center gap-1 px-4 py-1.5 bg-zinc-950 border-b border-zinc-900 overflow-x-auto">
              <button
                onClick={() => setActiveFilePath('')}
                className={`shrink-0 px-2.5 py-1 rounded text-[10px] font-mono transition-colors ${
                  activeFilePath === ''
                    ? 'bg-[#FF5C00]/20 text-[#FF5C00] border border-[#FF5C00]/30'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                SKILL.md
              </button>
              {files.map((f) => (
                <button
                  key={f.path}
                  onClick={() => setActiveFilePath(f.path)}
                  className={`shrink-0 px-2.5 py-1 rounded text-[10px] font-mono transition-colors ${
                    activeFilePath === f.path
                      ? 'bg-[#FF5C00]/20 text-[#FF5C00] border border-[#FF5C00]/30'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {f.path}
                </button>
              ))}
            </div>
          )}
          <div className="flex-1 p-6 font-mono text-sm overflow-y-auto custom-scrollbar bg-[#080808]">
            {(() => {
              const displayContent = activeFilePath
                ? files.find((f) => f.path === activeFilePath)?.content || ''
                : content;
              return displayContent ? (
                <pre ref={contentRef} className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {displayContent}
                  {streaming && !activeFilePath && (
                    <span className="inline-block w-2 h-4 bg-[#FF5C00] ml-0.5 animate-pulse" />
                  )}
                </pre>
              ) : (
                <div className="text-zinc-600 h-full flex items-center justify-center">
                  <div className="text-center">
                    <span className="material-symbols-outlined text-3xl mb-2 block">auto_awesome</span>
                    <p className="text-xs">等待 AI 生成内容...</p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Sources Panel */}
        <div className="h-48 md:h-56 bg-zinc-950 flex flex-col shrink-0">
          <div className="px-4 py-2 border-b border-zinc-900 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-zinc-500 text-sm">travel_explore</span>
              <h3 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">来源与参考</h3>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">
              找到 {sources.length} 个结果
            </span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {sources.length === 0 ? (
              <div className="md:col-span-2 flex items-center justify-center text-zinc-600 text-xs">
                {streaming ? '等待搜索结果...' : '无来源数据'}
              </div>
            ) : (
              sources.map((s, i) => (
                <a
                  key={i}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 border border-zinc-900 bg-black/40 rounded-lg hover:border-zinc-700 transition-colors group"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs text-zinc-200 font-medium group-hover:text-[#FF5C00] transition-colors truncate max-w-[80%]">
                      {s.title || s.url.replace(/https?:\/\//, '').slice(0, 30)}
                    </span>
                    <span className="material-symbols-outlined text-zinc-600 group-hover:text-zinc-400 text-sm shrink-0">
                      open_in_new
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 truncate">{s.url}</p>
                </a>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center pt-14">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-zinc-800 mb-4">hourglass_empty</span>
          <p className="text-zinc-500">加载中...</p>
        </div>
      </div>
    }>
      <WorkspaceContent />
    </Suspense>
  );
}
