'use client';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="glass-panel rounded-xl p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4 font-display font-bold text-white">404</div>
        <h1 className="text-lg font-display text-white font-bold mb-2">Page Not Found</h1>
        <p className="text-zinc-400 font-body text-sm mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <a
          href="/"
          className="inline-block px-6 py-2 bg-forge-500 text-white font-bold rounded-lg hover:bg-forge-600 transition-colors text-sm"
        >
          返回首页
        </a>
      </div>
    </div>
  );
}
