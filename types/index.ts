export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface GenerateRequest {
  domain: string;
  format?: "claude" | "openclaw" | "markdown";
  depth?: "quick" | "deep";
}

export interface GenerateResponse {
  success: boolean;
  skill: {
    id: string;
    title: string;
    domain: string;
    format: string;
    content: string;
    sources: { title: string; url: string }[];
    sources_level: "rich" | "sparse" | "none";
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
  rating: 1 | -1 | 0;
  feedback?: string;
}

export interface StepStatus {
  step: "searching" | "curating" | "formatting";
  label: string;
  done: boolean;
}
