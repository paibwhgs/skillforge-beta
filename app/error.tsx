'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="glass-panel rounded-xl p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">⚠</div>
        <h1 className="text-xl font-display text-white font-bold mb-2">Something went wrong</h1>
        <p className="text-zinc-400 font-body text-sm mb-6">
          {error.message || 'An unexpected error occurred'}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2 bg-forge-500 text-white font-bold rounded-lg hover:bg-forge-600 transition-colors text-sm"
          >
            Try Again
          </button>
          <a
            href="/"
            className="px-6 py-2 bg-zinc-900 text-zinc-300 font-bold rounded-lg hover:bg-zinc-800 transition-colors text-sm"
          >
            Back Home
          </a>
        </div>
      </div>
    </div>
  );
}
