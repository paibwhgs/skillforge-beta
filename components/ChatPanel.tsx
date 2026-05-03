'use client';

import { useState, useRef, useEffect } from 'react';
import { MODEL_OPTIONS, DEFAULT_MODEL } from '@/types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  skillId: string;
  onContentUpdate: (content: string) => void;
}

// Strip ~~~skill-content blocks from assistant messages for cleaner display
function stripContentBlock(text: string): string {
  return text.replace(/~~~skill-content\n?[\s\S]*?\n?~~~/g, '').trim();
}

export function ChatPanel({ skillId, onContentUpdate }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    fetch(`/api/v1/chat?skillId=${skillId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.messages?.length) {
          const clean = data.messages.map((m: { role: string; content: string }) => ({
            ...m,
            content: m.role === 'assistant' ? stripContentBlock(m.content) : m.content,
          }));
          setMessages(clean);
        }
      })
      .catch(() => {});
  }, [skillId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || streaming) return;

    setInput('');
    setError('');
    setStreaming(true);

    const userMsg: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      // Send history with content blocks stripped to keep context lean
      const cleanHistory = messages.map((m) => ({
        role: m.role,
        content: stripContentBlock(m.content),
      }));
      const res = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillId,
          message: text,
          history: cleanHistory,
          engine: selectedModel.engine,
          model: selectedModel.model,
        }),
        signal: abortController.signal,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '请求失败');
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((l) => l.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                assistantContent += data.text;
                setMessages((prev) => {
                  const copy = [...prev];
                  copy[copy.length - 1] = { role: 'assistant', content: assistantContent };
                  return copy;
                });
              }
              if (data.content) {
                onContentUpdate(data.content);
              }
            } catch {
              // skip
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setError(err.message || '对话失败，请重试');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const stopGeneration = () => {
    abortRef.current?.abort();
    setStreaming(false);
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950/50 border border-zinc-900 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 bg-zinc-950/80 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">
            Forge AI 助手
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Model Selector */}
          <select
            value={`${selectedModel.engine}:${selectedModel.model}`}
            onChange={(e) => {
              const [eng, mod] = e.target.value.split(':');
              const found = MODEL_OPTIONS.find((o) => o.engine === eng && o.model === mod);
              if (found) setSelectedModel(found);
            }}
            className="bg-black border border-zinc-800 text-zinc-400 text-[10px] px-2 py-1 rounded appearance-none cursor-pointer hover:border-zinc-700 focus:outline-none focus:border-[#FF5C00]/50 transition-colors"
          >
            {MODEL_OPTIONS.map((opt) => (
              <option key={opt.label} value={`${opt.engine}:${opt.model}`}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="text-[10px] text-zinc-600">会话记录</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {messages.length === 0 && !streaming && (
          <div className="text-center text-zinc-600 text-xs mt-12">
            <span className="material-symbols-outlined text-3xl mb-3 block text-zinc-800">psychology</span>
            <p>输入你的需求，AI 会帮你修改 skill 内容</p>
            <p className="text-zinc-700 mt-1">支持修改格式、补充细节、调整语气等</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[90%] rounded-xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#FF5C00] text-white rounded-br-md'
                  : 'bg-zinc-900/80 text-zinc-300 rounded-bl-md border border-zinc-800/50'
              }`}
            >
              {msg.role === 'assistant' ? (
                stripContentBlock(msg.content) || (
                  streaming && i === messages.length - 1 ? (
                    <span className="inline-flex gap-1">
                      <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  ) : ''
                )
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        {error && (
          <div className="text-center text-red-400 text-xs bg-red-900/20 py-2 px-4 rounded-lg">{error}</div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-zinc-900 p-3 bg-zinc-950/80 shrink-0">
        <div className="flex items-center gap-3 bg-black/60 border border-zinc-800 rounded-xl px-4 py-2 focus-within:border-[#FF5C00]/50 transition-colors">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.metaKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="输入修改建议，或直接提问..."
            disabled={streaming}
            className="flex-1 bg-transparent border-none focus:outline-none text-sm text-white placeholder-zinc-600 disabled:opacity-50 py-1"
          />
          {streaming ? (
            <button
              onClick={stopGeneration}
              className="bg-red-900/50 hover:bg-red-800/50 text-red-400 w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0"
              title="停止生成"
            >
              <span className="material-symbols-outlined text-lg">stop</span>
            </button>
          ) : (
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="bg-[#FF5C00] text-white w-8 h-8 rounded-lg flex items-center justify-center hover:scale-105 transition-transform active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              title="发送 (⌘+Enter)"
            >
              <span className="material-symbols-outlined text-lg">send</span>
            </button>
          )}
        </div>
        <p className="text-[10px] text-zinc-700 mt-1.5 text-center">⌘+Enter 发送 · AI 回复可自动更新 skill 内容</p>
      </div>
    </div>
  );
}
