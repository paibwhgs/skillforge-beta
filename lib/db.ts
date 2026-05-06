import { createClient, type Row, type Client } from '@libsql/client';
import { v4 as uuid } from 'uuid';
import type { SkillRecord, SkillSource, SkillFile, UserRecord, CommunityPost, CommunityComment } from '@/types';

let db: Client | null = null;
let initialized = false;

function getDb(): Client {
  if (!db) {
    const url = process.env.TURSO_DATABASE_URL;
    if (!url) throw new Error('TURSO_DATABASE_URL is not configured');
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
    bookmarked: Number(r.bookmarked || 0),
    depth: String(r.depth),
    mode: String(r.mode || 'auto'),
    created_at: String(r.created_at),
  };
}

function rowToSource(r: Row): SkillSource {
  return {
    id: String(r.id),
    skill_id: String(r.skill_id),
    url: String(r.url),
    title: String(r.title || ''),
    relevance: String(r.relevance || 'medium'),
    created_at: String(r.created_at),
  };
}

function rowToUser(r: Row): UserRecord {
  return {
    id: String(r.id),
    email: String(r.email),
    username: String(r.username),
    created_at: String(r.created_at),
  };
}

export async function initDB() {
  if (initialized) return;
  const c = getDb();
  await c.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
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
      user_id TEXT DEFAULT '',
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
  await c.execute('CREATE INDEX IF NOT EXISTS idx_skill_sources ON skill_sources(skill_id)');
  await c.execute('CREATE INDEX IF NOT EXISTS idx_skills_domain ON skills(domain)');
  await c.execute(`
    CREATE TABLE IF NOT EXISTS skill_chat_messages (
      id TEXT PRIMARY KEY,
      skill_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  await c.execute('CREATE INDEX IF NOT EXISTS idx_chat_skill ON skill_chat_messages(skill_id)');
  await c.execute(`
    CREATE TABLE IF NOT EXISTS skill_files (
      id TEXT PRIMARY KEY,
      skill_id TEXT NOT NULL,
      path TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  await c.execute('CREATE INDEX IF NOT EXISTS idx_skill_files ON skill_files(skill_id)');
  await c.execute('CREATE INDEX IF NOT EXISTS idx_skills_user ON skills(user_id)');

  // Community tables
  await c.execute(`
    CREATE TABLE IF NOT EXISTS community_posts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      skill_id TEXT DEFAULT '',
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  await c.execute('CREATE INDEX IF NOT EXISTS idx_community_posts_user ON community_posts(user_id)');
  await c.execute(`
    CREATE TABLE IF NOT EXISTS community_comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      parent_id TEXT DEFAULT '',
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  await c.execute('CREATE INDEX IF NOT EXISTS idx_community_comments_post ON community_comments(post_id)');

  // Migrate existing tables — add columns that may not exist yet
  for (const stmt of [
    "ALTER TABLE skills ADD COLUMN user_id TEXT DEFAULT ''",
    "ALTER TABLE skills ADD COLUMN mode TEXT DEFAULT 'auto'",
    "ALTER TABLE skills ADD COLUMN bookmarked INTEGER DEFAULT 0",
  ]) {
    try { await c.execute(stmt); } catch { /* column may already exist */ }
  }
  initialized = true;
}

export async function insertSkill(
  title: string,
  domain: string,
  format: string,
  content: string,
  depth: string = 'quick',
  userId?: string,
  mode: string = 'auto',
): Promise<string> {
  const c = getDb();
  const id = uuid();
  await c.execute({
    sql: 'INSERT INTO skills (id, title, domain, format, content, depth, user_id, mode) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    args: [id, title, domain, format, content, depth, userId || '', mode],
  });
  return id;
}

export async function insertSources(skillId: string, sources: { title: string; url: string }[]) {
  const c = getDb();
  for (const s of sources) {
    await c.execute({
      sql: 'INSERT INTO skill_sources (id, skill_id, url, title) VALUES (?, ?, ?, ?)',
      args: [uuid(), skillId, s.url, s.title],
    });
  }
}

export async function getSkill(id: string): Promise<SkillRecord | null> {
  const c = getDb();
  const rows = await c.execute({
    sql: 'SELECT * FROM skills WHERE id = ?',
    args: [id],
  });
  return rows.rows[0] ? rowToSkill(rows.rows[0]) : null;
}

export async function getSkills(limit: number = 20): Promise<SkillRecord[]> {
  const c = getDb();
  const rows = await c.execute({
    sql: 'SELECT * FROM skills ORDER BY created_at DESC LIMIT ?',
    args: [limit],
  });
  return rows.rows.map(rowToSkill);
}

export async function updateSkillBookmark(
  id: string,
  bookmarked: number,
): Promise<boolean> {
  const c = getDb();
  const result = await c.execute({
    sql: 'UPDATE skills SET bookmarked = ? WHERE id = ?',
    args: [bookmarked, id],
  });
  return result.rowsAffected > 0;
}

export async function updateSkillFeedback(
  id: string,
  rating: number,
  feedback?: string,
): Promise<boolean> {
  const c = getDb();
  const result = await c.execute({
    sql: feedback !== undefined
      ? 'UPDATE skills SET rating = ?, feedback = ? WHERE id = ?'
      : 'UPDATE skills SET rating = ? WHERE id = ?',
    args: feedback !== undefined ? [rating, feedback, id] : [rating, id],
  });
  return result.rowsAffected > 0;
}

export async function getSkillSources(skillId: string): Promise<SkillSource[]> {
  const c = getDb();
  const rows = await c.execute({
    sql: 'SELECT * FROM skill_sources WHERE skill_id = ?',
    args: [skillId],
  });
  return rows.rows.map(rowToSource);
}

export async function createUser(
  email: string,
  username: string,
  passwordHash: string,
  passwordSalt: string,
): Promise<string> {
  const c = getDb();
  const id = uuid();
  await c.execute({
    sql: 'INSERT INTO users (id, email, username, password_hash, password_salt) VALUES (?, ?, ?, ?, ?)',
    args: [id, email, username, passwordHash, passwordSalt],
  });
  return id;
}

export async function getUserByEmail(email: string): Promise<(UserRecord & { password_hash: string; password_salt: string }) | null> {
  const c = getDb();
  const rows = await c.execute({
    sql: 'SELECT * FROM users WHERE email = ?',
    args: [email],
  });
  if (!rows.rows[0]) return null;
  const r = rows.rows[0];
  return { ...rowToUser(r), password_hash: String(r.password_hash), password_salt: String(r.password_salt) };
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  const c = getDb();
  const rows = await c.execute({
    sql: 'SELECT * FROM users WHERE id = ?',
    args: [id],
  });
  return rows.rows[0] ? rowToUser(rows.rows[0]) : null;
}

export async function getSkillsByUser(userId: string, limit: number = 20): Promise<SkillRecord[]> {
  const c = getDb();
  const rows = await c.execute({
    sql: 'SELECT * FROM skills WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
    args: [userId, limit],
  });
  return rows.rows.map(rowToSkill);
}

export async function deleteSkill(id: string): Promise<boolean> {
  const c = getDb();
  await c.execute({ sql: 'DELETE FROM skill_sources WHERE skill_id = ?', args: [id] });
  await c.execute({ sql: 'DELETE FROM skill_chat_messages WHERE skill_id = ?', args: [id] });
  await c.execute({ sql: 'DELETE FROM skill_files WHERE skill_id = ?', args: [id] });
  const result = await c.execute({ sql: 'DELETE FROM skills WHERE id = ?', args: [id] });
  return result.rowsAffected > 0;
}

export async function insertSkillFiles(skillId: string, files: SkillFile[]): Promise<void> {
  const c = getDb();
  for (const f of files) {
    await c.execute({
      sql: 'INSERT INTO skill_files (id, skill_id, path, content) VALUES (?, ?, ?, ?)',
      args: [uuid(), skillId, f.path, f.content],
    });
  }
}

export async function getSkillFiles(skillId: string): Promise<SkillFile[]> {
  const c = getDb();
  const rows = await c.execute({
    sql: 'SELECT path, content FROM skill_files WHERE skill_id = ? ORDER BY path ASC',
    args: [skillId],
  });
  return rows.rows.map((r) => ({ path: String(r.path), content: String(r.content) }));
}

export async function getChatMessages(skillId: string): Promise<{ role: string; content: string }[]> {
  const c = getDb();
  const rows = await c.execute({
    sql: 'SELECT role, content FROM skill_chat_messages WHERE skill_id = ? ORDER BY created_at ASC',
    args: [skillId],
  });
  return rows.rows.map((r) => ({ role: String(r.role), content: String(r.content) }));
}

export async function saveChatMessage(skillId: string, role: string, content: string): Promise<void> {
  const c = getDb();
  await c.execute({
    sql: 'INSERT INTO skill_chat_messages (id, skill_id, role, content) VALUES (?, ?, ?, ?)',
    args: [uuid(), skillId, role, content],
  });
}

export async function updateSkillContent(id: string, content: string): Promise<boolean> {
  const c = getDb();
  const result = await c.execute({
    sql: 'UPDATE skills SET content = ? WHERE id = ?',
    args: [content, id],
  });
  return result.rowsAffected > 0;
}

export async function deleteUser(id: string): Promise<boolean> {
  const c = getDb();
  const result = await c.execute({
    sql: 'DELETE FROM users WHERE id = ?',
    args: [id],
  });
  return result.rowsAffected > 0;
}

export async function listUsers(): Promise<UserRecord[]> {
  const c = getDb();
  const rows = await c.execute('SELECT * FROM users ORDER BY created_at DESC');
  return rows.rows.map(rowToUser);
}

// ── Community Posts ────────────────────────────────────────────

function rowToCommunityPost(r: Row, username: string, commentCount: number): CommunityPost {
  return {
    id: String(r.id),
    user_id: String(r.user_id),
    username,
    title: String(r.title),
    content: String(r.content),
    skill_id: String(r.skill_id || ''),
    comment_count: commentCount,
    created_at: String(r.created_at),
  };
}

function rowToCommunityComment(r: Row, username: string): CommunityComment {
  return {
    id: String(r.id),
    post_id: String(r.post_id),
    user_id: String(r.user_id),
    username,
    parent_id: String(r.parent_id || ''),
    content: String(r.content),
    created_at: String(r.created_at),
  };
}

export async function createCommunityPost(
  userId: string,
  title: string,
  content: string,
  skillId?: string,
): Promise<string> {
  const c = getDb();
  const id = uuid();
  await c.execute({
    sql: 'INSERT INTO community_posts (id, user_id, title, content, skill_id) VALUES (?, ?, ?, ?, ?)',
    args: [id, userId, title, content, skillId || ''],
  });
  return id;
}

export async function getCommunityPosts(limit = 20, offset = 0): Promise<CommunityPost[]> {
  const c = getDb();
  const rows = await c.execute({
    sql: `SELECT p.*, u.username,
      (SELECT COUNT(*) FROM community_comments WHERE post_id = p.id) AS comment_count
      FROM community_posts p
      JOIN users u ON u.id = p.user_id
      ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
    args: [limit, offset],
  });
  return rows.rows.map((r) => rowToCommunityPost(r, String(r.username), Number(r.comment_count || 0)));
}

export async function getCommunityPost(id: string): Promise<CommunityPost | null> {
  const c = getDb();
  const rows = await c.execute({
    sql: `SELECT p.*, u.username,
      (SELECT COUNT(*) FROM community_comments WHERE post_id = p.id) AS comment_count
      FROM community_posts p
      JOIN users u ON u.id = p.user_id
      WHERE p.id = ?`,
    args: [id],
  });
  if (!rows.rows[0]) return null;
  const r = rows.rows[0];
  return rowToCommunityPost(r, String(r.username), Number(r.comment_count || 0));
}

export async function deleteCommunityPost(id: string, userId: string): Promise<boolean> {
  const c = getDb();
  await c.execute({ sql: 'DELETE FROM community_comments WHERE post_id = ?', args: [id] });
  const result = await c.execute({
    sql: 'DELETE FROM community_posts WHERE id = ? AND user_id = ?',
    args: [id, userId],
  });
  return result.rowsAffected > 0;
}

export async function createCommunityComment(
  postId: string,
  userId: string,
  content: string,
  parentId?: string,
): Promise<string> {
  const c = getDb();
  const id = uuid();
  await c.execute({
    sql: 'INSERT INTO community_comments (id, post_id, user_id, content, parent_id) VALUES (?, ?, ?, ?, ?)',
    args: [id, postId, userId, content, parentId || ''],
  });
  return id;
}

export async function getCommunityComments(postId: string): Promise<CommunityComment[]> {
  const c = getDb();
  const rows = await c.execute({
    sql: `SELECT c.*, u.username
      FROM community_comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC`,
    args: [postId],
  });
  return rows.rows.map((r) => rowToCommunityComment(r, String(r.username)));
}

export async function deleteCommunityComment(id: string, userId: string): Promise<boolean> {
  const c = getDb();
  const result = await c.execute({
    sql: 'DELETE FROM community_comments WHERE id = ? AND user_id = ?',
    args: [id, userId],
  });
  return result.rowsAffected > 0;
}

export async function getCommunityPostBySkillId(skillId: string): Promise<CommunityPost | null> {
  const c = getDb();
  const rows = await c.execute({
    sql: `SELECT p.*, u.username,
      (SELECT COUNT(*) FROM community_comments WHERE post_id = p.id) AS comment_count
      FROM community_posts p
      JOIN users u ON u.id = p.user_id
      WHERE p.skill_id = ?
      LIMIT 1`,
    args: [skillId],
  });
  if (!rows.rows[0]) return null;
  const r = rows.rows[0];
  return rowToCommunityPost(r, String(r.username), Number(r.comment_count || 0));
}
