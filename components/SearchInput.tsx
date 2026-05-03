'use client';

interface SearchInputProps {
  domain: string;
  onDomainChange: (v: string) => void;
  format: string;
  onFormatChange: (v: 'claude' | 'markdown') => void;
  depth: string;
  onDepthChange: (v: 'quick' | 'deep') => void;
  loading: boolean;
  onGenerate: () => void;
}

export function SearchInput({
  domain,
  onDomainChange,
  format,
  onFormatChange,
  depth,
  onDepthChange,
  loading,
  onGenerate,
}: SearchInputProps) {
  return (
    <div className="bg-white rounded-xl border p-5 space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1.5">你的领域 / 角色</label>
        <textarea
          value={domain}
          onChange={(e) => onDomainChange(e.target.value)}
          placeholder='例如："Go 后端开发，微服务架构，经常做 code review 和 SQL migration"'
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.metaKey) onGenerate();
          }}
        />
        <p className="text-xs text-gray-400 mt-1">⌘ + Enter 快速生成</p>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1.5">输出格式</label>
          <select
            value={format}
            onChange={(e) => onFormatChange(e.target.value as 'claude' | 'markdown')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="claude">Claude Code (YAML + MD)</option>
            <option value="markdown">通用 Markdown</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1.5">搜索深度</label>
          <select
            value={depth}
            onChange={(e) => onDepthChange(e.target.value as 'quick' | 'deep')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="quick">快速（3-5 来源）</option>
            <option value="deep">深度（8-12 来源）</option>
          </select>
        </div>
      </div>

      <button
        onClick={onGenerate}
        disabled={loading || !domain.trim()}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-2.5 px-4 rounded-lg transition text-sm"
      >
        {loading ? '生成中...' : '🔍 发现 Skill'}
      </button>
    </div>
  );
}
