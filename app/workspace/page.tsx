'use client';

import { Suspense, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { WorkspaceLog } from '@/components/WorkspaceLog';
import { DEFAULT_MODEL, MODEL_OPTIONS } from '@/types';
import type { SkillFile } from '@/types';

// --- Types ---

interface LogEntry {
  type: 'search' | 'check' | 'curating' | 'format' | 'error' | 'info';
  text: string;
  ts: string;
}

interface SourceItem {
  title: string;
  url: string;
}

interface ModelOutput {
  label: string;
  engine: string;
  model: string;
  logs: LogEntry[];
  content: string;
  sources: SourceItem[];
  progress: number;
  streaming: boolean;
  error: string;
  skillId: string | null;
  files: SkillFile[];
  activeFilePath: string;
}

// --- Helpers ---

function parseModelLabel(engine: string, model: string): string {
  const opt = MODEL_OPTIONS.find((o) => o.engine === engine && o.model === model);
  return opt?.label || `${engine}/${model}`;
}

// --- Main Content ---

function WorkspaceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const abortRef = useRef<AbortController | null>(null);
  const abortControllersRef = useRef<AbortController[]>([]);
  const contentRef = useRef<HTMLPreElement>(null);

  const domain = searchParams.get('domain') || '';
  const format = searchParams.get('format') || 'claude';
  const depth = searchParams.get('depth') || 'quick';
  const mode = searchParams.get('mode') || 'auto';
  const engine = searchParams.get('engine') || DEFAULT_MODEL.engine;
  const model = searchParams.get('model') || DEFAULT_MODEL.model;
  const modelsParam = searchParams.get('models');

  const isMultiModel = !!modelsParam;

  // Parse multi-model spec
  const parsedModels = useMemo(() => {
    if (!modelsParam) return [];
    return modelsParam.split(',').map((pair) => {
      const [eng, mod] = pair.split(':').map(decodeURIComponent);
      return { engine: eng, model: mod, label: parseModelLabel(eng, mod) };
    });
  }, [modelsParam]);

  // --- Single-model state ---
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [content, setContent] = useState('');
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [streaming, setStreaming] = useState(true);
  const [error, setError] = useState('');
  const [skillId, setSkillId] = useState<string | null>(null);
  const [files, setFiles] = useState<SkillFile[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  // --- Multi-model state ---
  const [modelOutputs, setModelOutputs] = useState<ModelOutput[]>([]);
  const [activeModelIdx, setActiveModelIdx] = useState(0);

  const updateModelOutput = useCallback(
    (idx: number, updater: (prev: ModelOutput) => ModelOutput) => {
      setModelOutputs((prev) => prev.map((m, i) => (i === idx ? updater(m) : m)));
    },
    [],
  );

  // --- Log helpers ---

  const addLog = useCallback((type: LogEntry['type'], text: string) => {
    setLogs((prev) => [
      ...prev,
      { type, text, ts: new Date().toLocaleTimeString('zh-CN', { hour12: false }) },
    ]);
  }, []);

  const addModelLog = useCallback(
    (idx: number, type: LogEntry['type'], text: string) => {
      const ts = new Date().toLocaleTimeString('zh-CN', { hour12: false });
      updateModelOutput(idx, (prev) => ({ ...prev, logs: [...prev.logs, { type, text, ts }] }));
    },
    [updateModelOutput],
  );

  // ========== SSE for single model ==========
  useEffect(() => {
    if (isMultiModel || !domain) return;

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
                    if (data.type === 'check') setProgress(20);
                    else if (data.type === 'curating') setProgress(35);
                    else if (data.type === 'format') setProgress(75);
                    break;

                  case 'token':
                    accumulatedContent += data.text;
                    setContent(accumulatedContent);
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
                    setProgress(100);
                    setStreaming(false);
                    setContent(data.skill.content);
                    setSkillId(data.skill.id);
                    if (data.skill.files) {
                      setFiles(data.skill.files);
                      if (data.skill.files.length > 0)
                        setActiveFilePath(data.skill.files[0].path);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain, format, depth, mode, engine, model, addLog, isMultiModel, retryCount]);

  // ========== SSE for multi-model ==========
  useEffect(() => {
    if (!isMultiModel || !domain || parsedModels.length < 2) return;

    const controllers = parsedModels.map(() => new AbortController());
    abortControllersRef.current = controllers;

    // Initialize/reset per-model state
    setModelOutputs(
      parsedModels.map((m) => ({
        label: m.label,
        engine: m.engine,
        model: m.model,
        logs: [],
        content: '',
        sources: [],
        progress: 0,
        streaming: true,
        error: '',
        skillId: null,
        files: [],
        activeFilePath: '',
      })),
    );
    setActiveModelIdx(0);

    const connectModel = async (
      spec: { engine: string; model: string; label: string },
      idx: number,
      controller: AbortController,
    ) => {
      let accumulatedContent = '';

      try {
        const res = await fetch('/api/v1/generate/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain,
            format,
            depth,
            mode,
            engine: spec.engine,
            model: spec.model,
          }),
          signal: controller.signal,
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
                    addModelLog(idx, data.type, data.text);
                    if (data.type === 'check')
                      updateModelOutput(idx, (p) => ({ ...p, progress: 20 }));
                    else if (data.type === 'curating')
                      updateModelOutput(idx, (p) => ({ ...p, progress: 35 }));
                    else if (data.type === 'format')
                      updateModelOutput(idx, (p) => ({ ...p, progress: 75 }));
                    break;

                  case 'token':
                    accumulatedContent += data.text;
                    updateModelOutput(idx, (p) => ({ ...p, content: accumulatedContent }));
                    break;

                  case 'source':
                    updateModelOutput(idx, (p) => ({
                      ...p,
                      sources: [...p.sources, { title: data.title, url: data.url }],
                    }));
                    break;

                  case 'file':
                    updateModelOutput(idx, (p) => {
                      const next = [...p.files, { path: data.path, content: data.content }];
                      return {
                        ...p,
                        files: next,
                        activeFilePath: next.length === 1 ? data.path : p.activeFilePath,
                      };
                    });
                    break;

                  case 'done':
                    updateModelOutput(idx, (p) => ({
                      ...p,
                      progress: 100,
                      streaming: false,
                      content: data.skill.content,
                      skillId: data.skill.id,
                      files: data.skill.files || p.files,
                      activeFilePath:
                        data.skill.files?.length > 0
                          ? data.skill.files[0].path
                          : p.activeFilePath,
                    }));
                    addModelLog(idx, 'check', `${spec.label} 生成完成！`);
                    break;

                  case 'error':
                    console.error(`[workspace] error event [${spec.label}]`, data.error);
                    updateModelOutput(idx, (p) => ({
                      ...p,
                      error: data.error,
                      streaming: false,
                    }));
                    addModelLog(idx, 'error', data.error);
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
        if (err.name !== 'AbortError') {
          updateModelOutput(idx, (p) => ({ ...p, error: err.message, streaming: false }));
          addModelLog(idx, 'error', err.message || '连接错误');
        }
      } finally {
        updateModelOutput(idx, (p) => {
          if (p.streaming) return { ...p, streaming: false };
          return p;
        });
      }
    };

    parsedModels.forEach((spec, idx) => {
      connectModel(spec, idx, controllers[idx]);
    });

    return () => {
      controllers.forEach((c) => c.abort());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMultiModel, domain, format, depth, mode, parsedModels, addModelLog, updateModelOutput, retryCount]);

  // Auto-scroll content
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [
    isMultiModel
      ? modelOutputs[activeModelIdx]?.content
      : content,
  ]);

  // --- Derive current display data ---

  const currentOutput = isMultiModel ? modelOutputs[activeModelIdx] : null;
  const currentLogs: LogEntry[] = currentOutput?.logs ?? logs;
  const currentContent: string = currentOutput?.content ?? content;
  const currentSources: SourceItem[] = currentOutput?.sources ?? sources;
  const currentStreaming: boolean =
    isMultiModel
      ? modelOutputs.length === 0 || modelOutputs.some((m) => m.streaming)
      : streaming;
  const currentError: string = currentOutput?.error ?? error;
  const currentSkillId: string | null = currentOutput?.skillId ?? skillId;
  const currentFiles: SkillFile[] = currentOutput?.files ?? files;
  const currentActiveFilePath: string = currentOutput?.activeFilePath ?? activeFilePath;
  const currentProgress: number = currentOutput?.progress ?? progress;

  // All multi-model streams done (for selection UI)
  const allModelsDone =
    isMultiModel && modelOutputs.length > 0 && modelOutputs.every((m) => !m.streaming);

  // ========== Handlers ==========

  const handleStop = () => {
    if (isMultiModel) {
      abortControllersRef.current.forEach((c) => c.abort());
      setModelOutputs((prev) => prev.map((m) => ({ ...m, streaming: false })));
    } else {
      abortRef.current?.abort();
      setStreaming(false);
    }
  };

  const handleRegenerate = () => {
    if (isMultiModel) {
      abortControllersRef.current.forEach((c) => c.abort());
    } else {
      abortRef.current?.abort();
      setLogs([]);
      setContent('');
      setSources([]);
      setError('');
      setProgress(0);
      setStreaming(true);
      setSkillId(null);
      setFiles([]);
      setActiveFilePath('');
    }
    setRetryCount((c) => c + 1);
  };

  const handleChooseModel = async (chosenIdx: number) => {
    const chosen = modelOutputs[chosenIdx];
    if (!chosen?.skillId) return;

    // Delete all other models' skills
    await Promise.all(
      modelOutputs
        .filter((m, i) => i !== chosenIdx && m.skillId)
        .map((m) => fetch(`/api/v1/skills/${m.skillId}`, { method: 'DELETE' })),
    );

    router.push(`/skills/${chosen.skillId}`);
  };

  // ========== Render ==========

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
      {/* Left Sidebar: Model Tabs (multi-model) + Generation Log */}
      <aside className="w-full md:w-96 border-r border-zinc-900 bg-zinc-950 flex flex-col shrink-0">
        {/* Model Tabs (multi-model) */}
        {isMultiModel && modelOutputs.length > 0 && (
          <div className="flex items-stretch border-b border-zinc-900 overflow-x-auto">
            {modelOutputs.map((mo, idx) => (
              <button
                key={`${mo.engine}:${mo.model}`}
                onClick={() => setActiveModelIdx(idx)}
                className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold transition-colors shrink-0 ${
                  idx === activeModelIdx
                    ? 'bg-black text-white border-b-2 border-[#FF5C00]'
                    : 'text-zinc-500 hover:text-zinc-300 bg-zinc-950'
                }`}
              >
                {/* Status dot */}
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${
                    mo.streaming
                      ? 'bg-[#FF5C00] animate-pulse'
                      : mo.error
                        ? 'bg-red-500'
                        : mo.skillId
                          ? 'bg-green-500'
                          : 'bg-zinc-700'
                  }`}
                />
                {mo.label}
              </button>
            ))}
          </div>
        )}

        <div className="px-4 py-3 md:p-4 border-b border-zinc-900">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-sm text-white">生成日志</h2>
            {currentStreaming && (
              <span className="px-2 py-0.5 rounded text-[10px] bg-[#FF5C00]/20 text-[#FF5C00] border border-[#FF5C00]/30 animate-pulse">
                实时
              </span>
            )}
          </div>

          {/* Action buttons */}
          {isMultiModel && allModelsDone && modelOutputs.some((m) => m.skillId) ? (
            /* Model selection — choose which version to keep */
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                选择保留的版本
              </p>
              {modelOutputs.map(
                (mo, idx) =>
                  mo.skillId && (
                    <button
                      key={idx}
                      onClick={() => handleChooseModel(idx)}
                      className="w-full py-2 md:py-2.5 px-2 md:px-3 rounded bg-zinc-900 hover:bg-[#FF5C00]/10 border border-zinc-800 hover:border-[#FF5C00]/30 text-left flex items-center justify-between transition-all active:scale-[0.97] group"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block w-1.5 h-1.5 rounded-full ${
                            idx === activeModelIdx ? 'bg-[#FF5C00]' : 'bg-zinc-600'
                          }`}
                        />
                        <span className="text-xs text-zinc-300 group-hover:text-[#FF5C00] font-bold transition-colors">
                          {mo.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#FF5C00] opacity-0 group-hover:opacity-100 transition-opacity">
                        选择 ✓
                      </span>
                    </button>
                  ),
              )}
            </div>
          ) : currentStreaming ? (
            <button
              onClick={handleStop}
              className="w-full py-2 px-4 rounded bg-red-900/50 text-red-400 text-xs flex items-center justify-center gap-2 hover:bg-red-800/50 transition-all active:scale-95 font-bold min-h-11 md:min-h-0"
            >
              <span className="material-symbols-outlined text-sm">stop_circle</span>
              停止生成
            </button>
          ) : currentSkillId ? (
            <button
              onClick={() => router.push(`/skills/${currentSkillId}`)}
              className="w-full py-2 px-4 rounded bg-[#FF5C00] text-white text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 font-bold min-h-11 md:min-h-0"
            >
              <span className="material-symbols-outlined text-sm">open_in_new</span>
              查看 Skill
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                onClick={handleRegenerate}
                className="w-full py-2 px-4 rounded bg-[#FF5C00] text-white text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 font-bold min-h-11 md:min-h-0"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                重新生成
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full py-2 px-4 rounded bg-zinc-800 text-zinc-400 text-xs flex items-center justify-center gap-2 hover:bg-zinc-700 transition-all active:scale-95 min-h-11 md:min-h-0"
              >
                <span className="material-symbols-outlined text-sm">home</span>
                返回首页
              </button>
            </div>
          )}
        </div>

        {/* Log Entries */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-4 space-y-2 md:space-y-3">
          {currentLogs.length === 0 && (
            <div className="text-center text-zinc-600 text-xs mt-8">
              <span className="material-symbols-outlined text-3xl mb-2">hourglass_empty</span>
              <p>正在连接...</p>
            </div>
          )}
          {currentLogs.map((log, i) => (
            <div key={i} className="animate-fadeIn">
              <WorkspaceLog
                type={log.type}
                text={log.text}
                ts={log.ts}
                active={log.type === 'curating' && currentStreaming}
              />
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="px-4 py-3 md:p-4 bg-black/40 border-t border-zinc-900">
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
          <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden relative">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out bg-[#FF5C00]"
              style={{ width: `${currentProgress}%` }}
            />
            {currentStreaming && (
              <div
                className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"
                style={{ width: `${Math.max(currentProgress, 10)}%` }}
              />
            )}
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
              {/* Show active model label in multi-model mode */}
              {isMultiModel && currentOutput && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#FF5C00]/10 text-[#FF5C00] border border-[#FF5C00]/20">
                  {currentOutput.label}
                </span>
              )}
            </div>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            </div>
          </div>
          {/* File Tabs (for OpenCLAW multi-file packages) */}
          {currentFiles.length > 0 && (
            <div className="flex items-center gap-1 px-4 py-1.5 bg-zinc-950 border-b border-zinc-900 overflow-x-auto">
              <button
                onClick={() => {
                  if (isMultiModel) {
                    updateModelOutput(activeModelIdx, (p) => ({
                      ...p,
                      activeFilePath: '',
                    }));
                  } else {
                    setActiveFilePath('');
                  }
                }}
                className={`shrink-0 px-2.5 py-1 rounded text-[10px] font-mono transition-colors ${
                  currentActiveFilePath === ''
                    ? 'bg-[#FF5C00]/20 text-[#FF5C00] border border-[#FF5C00]/30'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                SKILL.md
              </button>
              {currentFiles.map((f) => (
                <button
                  key={f.path}
                  onClick={() => {
                    if (isMultiModel) {
                      updateModelOutput(activeModelIdx, (p) => ({
                        ...p,
                        activeFilePath: f.path,
                      }));
                    } else {
                      setActiveFilePath(f.path);
                    }
                  }}
                  className={`shrink-0 px-2.5 py-1 rounded text-[10px] font-mono transition-colors ${
                    currentActiveFilePath === f.path
                      ? 'bg-[#FF5C00]/20 text-[#FF5C00] border border-[#FF5C00]/30'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {f.path}
                </button>
              ))}
            </div>
          )}
          <div
            className={`flex-1 p-4 font-mono text-sm overflow-y-auto custom-scrollbar bg-[#080808] ${
              currentStreaming ? 'forge-streaming-glow' : ''
            }`}
          >
            {(() => {
              const displayContent = currentActiveFilePath
                ? currentFiles.find((f) => f.path === currentActiveFilePath)?.content || ''
                : currentContent;
              return displayContent ? (
                <pre ref={contentRef} className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {displayContent}
                  {currentStreaming && !currentActiveFilePath && (
                    <span className="inline-block w-2 h-4 bg-[#FF5C00] ml-0.5 animate-pulse" />
                  )}
                </pre>
              ) : (
                <div className="text-zinc-600 h-full flex items-center justify-center">
                  <div className="text-center">
                    <span className="material-symbols-outlined text-3xl mb-2 block text-zinc-700">
                      auto_awesome
                    </span>
                    <p className="text-xs">等待 AI 生成内容...</p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Sources Panel */}
        <div className="h-auto md:h-56 bg-zinc-950 flex flex-col shrink-0">
          <div className="px-4 py-2 border-b border-zinc-900 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-zinc-500 text-sm">
                travel_explore
              </span>
              <h3 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
                来源与参考
              </h3>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">
              找到 {currentSources.length} 个结果
            </span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            {currentSources.length === 0 ? (
              <div className="md:col-span-2 flex items-center justify-center text-zinc-600 text-xs">
                {currentStreaming ? '等待搜索结果...' : '无来源数据'}
              </div>
            ) : (
              currentSources.map((s, i) => (
                <a
                  key={i}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 border border-zinc-900 bg-black/40 rounded-lg hover:border-zinc-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#FF5C00]/5 transition-all duration-200 group"
                  style={{ animationDelay: `${i * 50}ms` }}
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
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center pt-14">
          <div className="text-center">
            <span className="material-symbols-outlined text-5xl text-zinc-800 mb-4">
              hourglass_empty
            </span>
            <p className="text-zinc-500">加载中...</p>
          </div>
        </div>
      }
    >
      <WorkspaceContent />
    </Suspense>
  );
}
