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
  rating: number;
  feedback: string;
  depth: string;
  mode: string;
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

export interface FeedbackRequest {
  skill_id: string;
  rating: number;
  feedback?: string;
}

export interface StepStatus {
  step: 'searching' | 'curating' | 'formatting';
  label: string;
  done: boolean;
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

export interface ModelOption {
  label: string;
  engine: string;
  model: string;
}

export const MODEL_OPTIONS: ModelOption[] = [
  { label: 'DeepSeek V4 Flash', engine: 'opencode-go', model: 'deepseek-v4-flash' },
  { label: 'DeepSeek V4 官方', engine: 'deepseek', model: 'deepseek-v4-flash' },
  { label: 'Qwen3.6 Plus', engine: 'opencode-go', model: 'qwen3.6-plus' },
  { label: 'GLM-5.1', engine: 'opencode-go', model: 'glm-5.1' },
  { label: 'Kimi K2.6', engine: 'opencode-go', model: 'kimi-k2.6' },
  { label: 'GLM-5', engine: 'opencode-go', model: 'glm-5' },
  { label: 'Kimi K2.5', engine: 'opencode-go', model: 'kimi-k2.5' },
];

export const DEFAULT_MODEL = MODEL_OPTIONS[0];
