'use client';

import { useState } from 'react';
import { StarRating } from './StarRating';

interface Props {
  skillId: string;
}

export function FeedbackBar({ skillId }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [rating, setRating] = useState(0);

  const sendFeedback = async (r: number) => {
    setRating(r);
    try {
      await fetch('/api/v1/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill_id: skillId, rating: r }),
      });
    } catch {
      // silently fail
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center text-sm text-zinc-500 py-2 flex items-center justify-center gap-2">
        <span className="material-symbols-outlined text-sm">check_circle</span>
        感谢反馈！
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3 py-3 border-t border-zinc-900">
      <span className="text-sm text-zinc-500">这条 skill 有用吗？</span>
      <StarRating rating={rating} onChange={sendFeedback} size="md" />
    </div>
  );
}
