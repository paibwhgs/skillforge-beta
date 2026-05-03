'use client';

interface Props {
  rating: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md';
}

export function StarRating({ rating, onChange, readonly = false, size = 'sm' }: Props) {
  const sizeClass = size === 'sm' ? 'text-xs' : 'text-base';

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= rating;
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(star)}
            className={`${sizeClass} transition-colors ${
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            } ${filled ? 'text-[#FF5C00]' : 'text-zinc-700'}`}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0" }}
            >
              star
            </span>
          </button>
        );
      })}
    </div>
  );
}
