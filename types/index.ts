export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface SkillFile {
  path: string;
  content: string;
}

export interface GenerateRequest {
  domain: string;
  format?: 'claude' | 'openclaw' | 'markdown';
  depth?: 'quick' | 'deep';
  mode?: 'auto' | 'direct';
  engine?: string;
  model?: string;
}

export interface GenerateResponse {
  success: boolean;
  skill: {
    id: string;
    title: string;
    domain: string;
    format: string;
    content: string;
    score?: number;
    files?: SkillFile[];
    sources: { title: string; url: string }[];
    sources_level: 'rich' | 'sparse' | 'none';
    created_at: string;
  };
}

export interface GenerateError {
  success: false;
  error: string;
}

export interface SkillRecord {
  id: string;
  title: string;
  domain: string;
  format: string;
  content: string;
  bookmarked: number;
  depth: string;
  mode: string;
  score: number;
  engine?: string;
  model?: string;
  created_at: string;
}

export interface SkillSource {
  id: string;
  skill_id: string;
  url: string;
  title: string;
  relevance: string;
  created_at: string;
}

export interface UserRecord {
  id: string;
  email: string;
  username: string;
  created_at: string;
}

export interface AuthResponse {
  user: UserRecord;
}

export interface ChatRequest {
  skillId: string;
  message: string;
  history: { role: 'user' | 'assistant'; content: string }[];
  engine?: string;
  model?: string;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  skill_count: number;
  skill_ids: string[];
  created_at: string;
}

export interface CommunityPost {
  id: string;
  user_id: string;
  username: string;
  title: string;
  content: string;
  skill_id: string;
  comment_count: number;
  created_at: string;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  user_id: string;
  username: string;
  parent_id: string;
  content: string;
  created_at: string;
}

export interface ModelOption {
  label: string;
  engine: string;
  model: string;
}

export const MODEL_OPTIONS: ModelOption[] = [
  { label: 'DeepSeek V4 Flash', engine: 'opencode-go', model: 'deepseek-v4-flash' },
  { label: 'Qwen3.6 Plus', engine: 'opencode-go', model: 'qwen3.6-plus' },
  { label: 'MiniMax M2.7', engine: 'opencode-go', model: 'minimax-m2.7' },
  { label: 'MiniMax M2.5', engine: 'opencode-go', model: 'minimax-m2.5' },
  { label: 'Qwen3.5 Plus', engine: 'opencode-go', model: 'qwen3.5-plus' },
];

export const DEFAULT_MODEL = MODEL_OPTIONS[0];
