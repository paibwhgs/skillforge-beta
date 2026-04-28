"use client";

import { useState } from "react";
import { SearchInput } from "@/components/SearchInput";
import { GenerationProgress } from "@/components/GenerationProgress";
import { SkillPreview } from "@/components/SkillPreview";
import type { GenerateResponse, StepStatus } from "@/types";

const initialSteps: StepStatus[] = [
  { step: "searching", label: "搜索相关知识", done: false },
  { step: "curating", label: "AI 策展提炼", done: false },
  { step: "formatting", label: "生成 Skill 文件", done: false },
];

export default function Home() {
  const [domain, setDomain] = useState("");
  const [format, setFormat] = useState<"claude" | "markdown">("claude");
  const [depth, setDepth] = useState<"quick" | "deep">("quick");
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<StepStatus[]>(initialSteps);
  const [result, setResult] = useState<GenerateResponse["skill"] | null>(null);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!domain.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setSteps(initialSteps.map((s) => ({ ...s })));

    const advance = (i: number) => {
      setSteps((prev) =>
        prev.map((s, j) => (j <= i ? { ...s, done: true } : s))
      );
    };

    try {
      advance(0);
      const res = await fetch("/api/v1/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domain.trim(), format, depth }),
      });

      advance(1);

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "生成失败");
        return;
      }

      advance(2);
      setResult(data.skill);
    } catch (e: any) {
      setError(e.message || "网络错误");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          发现你的 AI Skill
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          输入你的领域，AI 从互联网挖掘已验证的交互知识，生成标准 skill 文件
        </p>
      </div>

      <SearchInput
        domain={domain}
        onDomainChange={setDomain}
        format={format}
        onFormatChange={setFormat}
        depth={depth}
        onDepthChange={setDepth}
        loading={loading}
        onGenerate={handleGenerate}
      />

      {loading && <GenerationProgress steps={steps} />}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {result && <SkillPreview skill={result} />}

      {!result && !loading && !error && (
        <div className="text-center py-12 text-gray-400">
          <div className="text-5xl mb-4">🔍</div>
          <p>输入领域描述，开始发现 skill</p>
        </div>
      )}
    </div>
  );
}
