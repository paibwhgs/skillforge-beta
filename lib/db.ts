import { createClient, type Row, type Client } from "@libsql/client";
import { v4 as uuid } from "uuid";
import type { SkillRecord, SkillSource } from "@/types";

let db: Client | null = null;

function getDb(): Client {
  if (!db) {
    const url = process.env.TURSO_DATABASE_URL;
    if (!url) throw new Error("TURSO_DATABASE_URL is not configured");
    db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  }
  return db;
}

function rowToSkill(r: Row): SkillRecord {
  return {
    id: String(r.id),
    title: String(r.title),
    domain: String(r.domain),
    format: String(r.format),
    content: String(r.content),
    rating: Number(r.rating),
    feedback: String(r.feedback || ""),
    depth: String(r.depth),
    created_at: String(r.created_at),
  };
}

function rowToSource(r: Row): SkillSource {
  return {
    id: String(r.id),
    skill_id: String(r.skill_id),
    url: String(r.url),
    title: String(r.title || ""),
    relevance: String(r.relevance || "medium"),
    created_at: String(r.created_at),
  };
}

export async function initDB() {
  const c = getDb();
  await c.execute(`
    CREATE TABLE IF NOT EXISTS skills (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      domain TEXT NOT NULL,
      format TEXT NOT NULL DEFAULT 'claude',
      content TEXT NOT NULL,
      rating INTEGER DEFAULT 0,
      feedback TEXT DEFAULT '',
      depth TEXT DEFAULT 'quick',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  await c.execute(`
    CREATE TABLE IF NOT EXISTS skill_sources (
      id TEXT PRIMARY KEY,
      skill_id TEXT NOT NULL,
      url TEXT NOT NULL,
      title TEXT DEFAULT '',
      relevance TEXT DEFAULT 'medium',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  await c.execute(
    "CREATE INDEX IF NOT EXISTS idx_skill_sources ON skill_sources(skill_id)"
  );
  await c.execute(
    "CREATE INDEX IF NOT EXISTS idx_skills_domain ON skills(domain)"
  );
}

export async function insertSkill(
  title: string,
  domain: string,
  format: string,
  content: string,
  depth: string = "quick"
): Promise<string> {
  const c = getDb();
  const id = uuid();
  await c.execute({
    sql: "INSERT INTO skills (id, title, domain, format, content, depth) VALUES (?, ?, ?, ?, ?, ?)",
    args: [id, title, domain, format, content, depth],
  });
  return id;
}

export async function insertSources(
  skillId: string,
  sources: { title: string; url: string }[]
) {
  const c = getDb();
  for (const s of sources) {
    await c.execute({
      sql: "INSERT INTO skill_sources (id, skill_id, url, title) VALUES (?, ?, ?, ?)",
      args: [uuid(), skillId, s.url, s.title],
    });
  }
}

export async function getSkill(id: string): Promise<SkillRecord | null> {
  const c = getDb();
  const rows = await c.execute({
    sql: "SELECT * FROM skills WHERE id = ?",
    args: [id],
  });
  return rows.rows[0] ? rowToSkill(rows.rows[0]) : null;
}

export async function getSkills(limit: number = 20): Promise<SkillRecord[]> {
  const c = getDb();
  const rows = await c.execute({
    sql: "SELECT * FROM skills ORDER BY created_at DESC LIMIT ?",
    args: [limit],
  });
  return rows.rows.map(rowToSkill);
}

export async function updateSkillRating(
  id: string,
  rating: number,
  feedback: string = ""
): Promise<boolean> {
  const c = getDb();
  const result = await c.execute({
    sql: "UPDATE skills SET rating = ?, feedback = ? WHERE id = ?",
    args: [rating, feedback, id],
  });
  return result.rowsAffected > 0;
}

export async function getSkillSources(
  skillId: string
): Promise<SkillSource[]> {
  const c = getDb();
  const rows = await c.execute({
    sql: "SELECT * FROM skill_sources WHERE skill_id = ?",
    args: [skillId],
  });
  return rows.rows.map(rowToSource);
}
