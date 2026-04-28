"use client";

import { useState } from "react";

interface Props {
  skillId: string;
}

export function FeedbackBar({ skillId }: Props) {
  const [submitted, setSubmitted] = useState(false);

  const sendFeedback = async (rating: 1 | -1) => {
    try {
      await fetch("/api/v1/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill_id: skillId, rating }),
      });
    } catch {
      // silently fail
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center text-sm text-gray-400 py-2">
        感谢反馈 ✨
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3 py-2">
      <span className="text-sm text-gray-500">这条 skill 有用吗？</span>
      <button
        onClick={() => sendFeedback(1)}
        className="px-3 py-1 rounded-lg text-xs border border-gray-200 hover:bg-green-50 hover:border-green-300 transition"
      >
        👍 有用
      </button>
      <button
        onClick={() => sendFeedback(-1)}
        className="px-3 py-1 rounded-lg text-xs border border-gray-200 hover:bg-red-50 hover:border-red-300 transition"
      >
        👎 没用
      </button>
    </div>
  );
}
