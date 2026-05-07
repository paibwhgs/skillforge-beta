'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

interface Question {
  id: number;
  question: string;
  answer: string;
}

function PlanContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const domain = searchParams.get('domain') || '';
  const format = searchParams.get('format') || 'claude';
  const depth = searchParams.get('depth') || 'quick';
  const mode = searchParams.get('mode') || 'auto';
  const engine = searchParams.get('engine') || '';
  const model = searchParams.get('model') || '';

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState('');
  const [step, setStep] = useState<'questions' | 'plan'>('questions');

  useEffect(() => {
    if (!domain) return;
    fetch('/api/v1/plan/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain }),
    }).then((r) => r.json()).then((data) => {
      if (data.questions) {
        setQuestions(data.questions.map((q: string, i: number) => ({ id: i, question: q, answer: '' })));
      }
    }).catch(() => {
      setQuestions([
        { id: 0, question: '这个 Skill 的主要受众是谁？', answer: '' },
        { id: 1, question: '你期望覆盖哪些核心技术点？', answer: '' },
        { id: 2, question: '有没有特别的要求或限制？', answer: '' },
      ]);
    }).finally(() => setLoading(false));
  }, [domain]);

  const submitAnswers = async () => {
    setGenerating(true);
    const answersText = questions.map((q) => `Q: ${q.question}\nA: ${q.answer}`).join('\n\n');
    try {
      const res = await fetch('/api/v1/plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, answers: answersText }),
      });
      const data = await res.json();
      setPlan(data.plan || '暂无方案');
    } catch { setPlan('生成失败，请重试'); }
    setGenerating(false);
    setStep('plan');
  };

  const confirmPlan = () => {
    localStorage.setItem('skillforge-plan', JSON.stringify({ domain, plan }));
    const params = new URLSearchParams({ domain, format, depth, mode, engine, model });
    if (!engine) params.delete('engine');
    if (!model) params.delete('model');
    router.push(`/workspace?${params.toString()}`);
  };

  const skipPlan = () => {
    const params = new URLSearchParams({ domain, format, depth, mode, engine, model });
    if (!engine) params.delete('engine');
    if (!model) params.delete('model');
    router.push(`/workspace?${params.toString()}`);
  };

  if (!domain) {
    return (
      <div className="min-h-screen bg-theme flex items-center justify-center pt-14">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-zinc-800 mb-4">psychology</span>
          <p className="text-zinc-500 mb-4">没有指定领域参数</p>
          <button onClick={() => router.push('/')} className="bg-[#FF5C00] text-white px-4 py-2 rounded-lg text-sm font-bold">返回首页</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme pt-14">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {step === 'questions' && (
          <div className="animate-fadeIn">
            <h1 className="font-display text-2xl text-white font-bold mb-1">需求规划</h1>
            <p className="text-zinc-400 text-sm mb-6">在生成 <span className="text-[#FF5C00]">{domain}</span> 的 Skill 前，先确认几个问题：</p>
            {loading ? (
              <div className="space-y-4">
                {[0,1,2].map((i) => (
                  <div key={i} className="bg-zinc-900/50 rounded-xl p-5 animate-pulse"><div className="h-4 bg-zinc-900 rounded w-3/4 mb-3" /><div className="h-12 bg-zinc-900 rounded w-full" /></div>
                ))}
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-8">
                  {questions.map((q) => (
                    <div key={q.id} className="bg-[#080808] border border-zinc-900 rounded-xl p-5">
                      <label className="block text-sm text-white font-bold mb-3">{q.id + 1}. {q.question}</label>
                      <textarea value={q.answer} onChange={(e) => { const n = [...questions]; n[q.id].answer = e.target.value; setQuestions(n); }}
                        placeholder="输入你的想法..." rows={2}
                        className="w-full bg-black border border-zinc-900 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#FF5C00]/50 transition resize-none" />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <button onClick={skipPlan} className="text-sm text-zinc-500 hover:text-zinc-300 transition">跳过，直接生成</button>
                  <button onClick={submitAnswers} disabled={generating || questions.some((q) => !q.answer.trim())}
                    className="bg-[#FF5C00] text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:opacity-90 disabled:opacity-30 flex items-center gap-2">
                    {generating ? <><span className="material-symbols-outlined text-sm animate-spin">sync</span> 生成中...</> : <><span className="material-symbols-outlined text-sm">auto_awesome</span> 生成方案</>}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {step === 'plan' && (
          <div className="animate-fadeIn">
            <h1 className="font-display text-2xl text-white font-bold mb-1">规划方案</h1>
            <p className="text-zinc-400 text-sm mb-4">确认方案后开始铸造，也可以直接编辑修改。</p>
            <div className="bg-[#080808] border border-zinc-900 rounded-xl mb-8">
              <div className="flex items-center justify-between px-5 py-2 border-b border-zinc-900">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">规划方案（可编辑）</span>
                <button onClick={() => setPlan(plan + '\n')} className="text-zinc-500 hover:text-zinc-300 transition text-xs">插入换行</button>
              </div>
              <textarea
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="w-full bg-transparent border-none focus:outline-none text-sm text-zinc-300 leading-relaxed placeholder-zinc-700 resize-y min-h-[200px] font-body p-5"
                rows={12}
              />
            </div>
            <div className="flex items-center justify-between">
              <button onClick={() => setStep('questions')} className="text-sm text-zinc-500 hover:text-zinc-300 transition flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">arrow_back</span> 返回
              </button>
              <div className="flex gap-3">
                <button onClick={skipPlan} className="px-5 py-2.5 rounded-lg text-sm font-bold text-zinc-400 bg-zinc-900 hover:bg-zinc-800 transition">跳过</button>
                <button onClick={confirmPlan} className="bg-[#FF5C00] text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:opacity-90 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">rocket_launch</span> 确认并铸造
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PlanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black pt-14 flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-500">
          <span className="material-symbols-outlined animate-spin text-lg">hourglass_top</span>
          <span className="text-sm">加载中...</span>
        </div>
      </div>
    }>
      <PlanContent />
    </Suspense>
  );
}
