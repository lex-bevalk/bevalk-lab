import { neon } from '@neondatabase/serverless';
import { COMMENT_STATUSES, SCREEN_LABELS, type CommentScreen, type CommentStatus } from '../src/comments/constants.js';
import type { NeonSqlClient } from './neon-rate-limit.js';

export { COMMENT_STATUSES, SCREEN_LABELS };
export type { CommentScreen, CommentStatus };

export interface CommentRecord {
  id: string;
  created_at: Date | string;
  updated_at: Date | string;
  author: string;
  body: string;
  screen: CommentScreen;
  tpl: string | null;
  x: number;
  y: number;
  flow: string | null;
  plan: string | null;
  status: CommentStatus;
  delete_token_hash?: string | null;
}

export interface CommentItem {
  id: string;
  created_at: string;
  updated_at: string;
  author: string;
  body: string;
  screen: CommentScreen;
  tpl: string | null;
  x: number;
  y: number;
  flow: string | null;
  plan: string | null;
  status: CommentStatus;
  replies: ReplyItem[];
}

export interface ReplyRecord {
  id: string;
  comment_id: string;
  created_at: Date | string;
  author: string;
  body: string;
}

export interface ReplyItem {
  id: string;
  comment_id: string;
  created_at: string;
  author: string;
  body: string;
}

export interface CommentFilters {
  screen?: CommentScreen;
  status?: CommentStatus;
  author?: string;
}

export interface CommentCreateInput {
  author: string;
  body: string;
  screen: CommentScreen;
  tpl: string | null;
  x: number;
  y: number;
  flow: string | null;
  plan: string | null;
}

export interface ReplyCreateInput {
  comment_id: string;
  author: string;
  body: string;
}

export interface CommentsStore {
  list(filters: CommentFilters): Promise<CommentItem[]>;
  create(input: CommentCreateInput, deleteTokenHash: string): Promise<CommentItem>;
  createReply(input: ReplyCreateInput): Promise<ReplyItem | null>;
  updateStatus(id: string, status: CommentStatus): Promise<CommentItem | null>;
  deleteTokenHash(id: string): Promise<string | null | undefined>;
  remove(id: string): Promise<boolean>;
}

export type Validation<T> = { ok: true; value: T } | { ok: false; field: string };

const screenSet = new Set<string>(SCREEN_LABELS);
const statusSet = new Set<string>(COMMENT_STATUSES);
const anyControlCharacters = /[\u0000-\u001F\u007F]/;
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DELETE_TOKEN_PATTERN = /^[0-9a-f]{64}$/i;

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function optionalShortString(
  record: Record<string, unknown>,
  field: 'tpl' | 'flow' | 'plan',
  maxLength: number
): Validation<string | null> {
  const candidate = record[field];
  if (candidate === undefined || candidate === null || candidate === '') return { ok: true, value: null };
  if (typeof candidate !== 'string') return { ok: false, field };
  const value = candidate.trim();
  if (value.length > maxLength || anyControlCharacters.test(value)) return { ok: false, field };
  if (field === 'plan' && value && value !== 'free' && value !== 'premium') return { ok: false, field };
  return { ok: true, value: value || null };
}

export function validateCommentCreate(value: unknown): Validation<CommentCreateInput> {
  if (!isPlainRecord(value)) return { ok: false, field: 'body' };

  const author = validateAuthor(value.author);
  if (!author.ok) return author;
  const body = validateBody(value.body);
  if (!body.ok) return body;

  if (typeof value.screen !== 'string' || !screenSet.has(value.screen)) return { ok: false, field: 'screen' };
  if (typeof value.x !== 'number' || !Number.isFinite(value.x) || value.x < 0 || value.x > 1) return { ok: false, field: 'x' };
  if (typeof value.y !== 'number' || !Number.isFinite(value.y) || value.y < 0 || value.y > 1) return { ok: false, field: 'y' };

  const tpl = optionalShortString(value, 'tpl', 80);
  if (!tpl.ok) return tpl;
  const flow = optionalShortString(value, 'flow', 120);
  if (!flow.ok) return flow;
  const plan = optionalShortString(value, 'plan', 40);
  if (!plan.ok) return plan;

  if (value.status !== undefined && value.status !== null && !statusSet.has(String(value.status))) {
    return { ok: false, field: 'status' };
  }

  return {
    ok: true,
    value: {
      author: author.value,
      body: body.value,
      screen: value.screen as CommentScreen,
      tpl: tpl.value,
      x: value.x,
      y: value.y,
      flow: flow.value,
      plan: plan.value
    }
  };
}

function validateAuthor(value: unknown): Validation<string> {
  if (typeof value !== 'string') return { ok: false, field: 'author' };
  const author = value.trim();
  return author.length < 1 || author.length > 60 || anyControlCharacters.test(author)
    ? { ok: false, field: 'author' }
    : { ok: true, value: author };
}

function validateBody(value: unknown): Validation<string> {
  if (typeof value !== 'string') return { ok: false, field: 'body' };
  const body = value.trim();
  return body.length < 1 || body.length > 2000 || /[\u0000-\u0009\u000B-\u001F\u007F]/.test(body)
    ? { ok: false, field: 'body' }
    : { ok: true, value: body };
}

export function validateReplyCreate(value: unknown): Validation<ReplyCreateInput> {
  if (!isPlainRecord(value) || typeof value.comment_id !== 'string' || !UUID_PATTERN.test(value.comment_id)) {
    return { ok: false, field: 'comment_id' };
  }
  const author = validateAuthor(value.author);
  if (!author.ok) return author;
  const body = validateBody(value.body);
  if (!body.ok) return body;
  return { ok: true, value: { comment_id: value.comment_id, author: author.value, body: body.value } };
}

export function validateCommentFilters(params: URLSearchParams): Validation<CommentFilters> {
  const filters: CommentFilters = {};
  const screen = params.get('screen');
  if (screen !== null && screen !== '') {
    if (!screenSet.has(screen)) return { ok: false, field: 'screen' };
    filters.screen = screen as CommentScreen;
  }
  const status = params.get('status');
  if (status !== null && status !== '') {
    if (!statusSet.has(status)) return { ok: false, field: 'status' };
    filters.status = status as CommentStatus;
  }
  const author = params.get('author');
  if (author !== null && author.trim()) {
    const trimmed = author.trim();
    if (trimmed.length > 60 || anyControlCharacters.test(trimmed)) return { ok: false, field: 'author' };
    filters.author = trimmed;
  }
  return { ok: true, value: filters };
}

export function validateCommentStatus(value: unknown): Validation<CommentStatus> {
  return typeof value === 'string' && statusSet.has(value)
    ? { ok: true, value: value as CommentStatus }
    : { ok: false, field: 'status' };
}

export function validateCommentDelete(value: unknown): Validation<{ id: string; token: string | null }> {
  if (!isPlainRecord(value) || typeof value.id !== 'string' || !UUID_PATTERN.test(value.id)) {
    return { ok: false, field: 'id' };
  }
  if (value.token === undefined) return { ok: true, value: { id: value.id, token: null } };
  if (typeof value.token !== 'string' || !DELETE_TOKEN_PATTERN.test(value.token)) return { ok: false, field: 'token' };
  return { ok: true, value: { id: value.id, token: value.token } };
}

export function equalHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return difference === 0;
}

function toCommentItem(row: CommentRecord): CommentItem {
  return {
    id: row.id,
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString(),
    author: row.author,
    body: row.body,
    screen: row.screen,
    tpl: row.tpl,
    x: Number(row.x),
    y: Number(row.y),
    flow: row.flow,
    plan: row.plan,
    status: row.status,
    replies: []
  };
}

function toReplyItem(row: ReplyRecord): ReplyItem {
  return {
    id: row.id,
    comment_id: row.comment_id,
    created_at: new Date(row.created_at).toISOString(),
    author: row.author,
    body: row.body
  };
}

export function createNeonCommentsStore(databaseUrl: string, sqlClient?: NeonSqlClient): CommentsStore {
  const sql = sqlClient ?? neon(databaseUrl) as unknown as NeonSqlClient;
  let tableReady: Promise<void> | null = null;

  function ensureTable(): Promise<void> {
    if (tableReady) return tableReady;
    const pending = Promise.resolve()
      .then(() => sql`CREATE TABLE IF NOT EXISTS comments (
        id uuid primary key default gen_random_uuid(),
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        author text not null,
        body text not null,
        screen text not null,
        tpl text,
        x real not null,
        y real not null,
        flow text,
        plan text,
        status text not null default 'todo' check (status in ('todo','in_progress','done','wont_do'))
      )`)
      .then(() => sql`ALTER TABLE comments ADD COLUMN IF NOT EXISTS delete_token_hash text`)
      .then(() => sql`CREATE TABLE IF NOT EXISTS comment_replies (
        id uuid primary key default gen_random_uuid(),
        comment_id uuid not null references comments(id) on delete cascade,
        created_at timestamptz not null default now(),
        author text not null,
        body text not null
      )`)
      .then(() => sql`CREATE INDEX IF NOT EXISTS comment_replies_comment_id_idx ON comment_replies (comment_id, created_at)`)
      .then(() => undefined)
      .catch(error => {
        if (tableReady === pending) tableReady = null;
        throw error;
      });
    tableReady = pending;
    return pending;
  }

  async function attachReplies(items: CommentItem[]): Promise<CommentItem[]> {
    if (items.length === 0) return items;
    const ids = items.map(item => item.id);
    const rows = await sql`
      SELECT id, comment_id, created_at, author, body
      FROM comment_replies
      WHERE comment_id = ANY(${ids}::uuid[])
      ORDER BY created_at ASC
    ` as ReplyRecord[];
    const grouped = new Map<string, ReplyItem[]>();
    for (const row of rows) {
      const reply = toReplyItem(row);
      const replies = grouped.get(reply.comment_id) ?? [];
      replies.push(reply);
      grouped.set(reply.comment_id, replies);
    }
    return items.map(item => ({ ...item, replies: grouped.get(item.id) ?? [] }));
  }

  return {
    async list(filters): Promise<CommentItem[]> {
      await ensureTable();
      const screen = filters.screen ?? null;
      const status = filters.status ?? null;
      const author = filters.author ?? null;
      const rows = await sql`
        SELECT id, created_at, updated_at, author, body, screen, tpl, x, y, flow, plan, status
        FROM comments
        WHERE (${screen}::text IS NULL OR screen = ${screen})
          AND (${status}::text IS NULL OR status = ${status})
          AND (${author}::text IS NULL OR author = ${author})
        ORDER BY created_at DESC
        LIMIT 500
      ` as CommentRecord[];
      return attachReplies(rows.map(toCommentItem));
    },

    async create(input, deleteTokenHash): Promise<CommentItem> {
      await ensureTable();
      const rows = await sql`
        INSERT INTO comments (author, body, screen, tpl, x, y, flow, plan, delete_token_hash)
        VALUES (${input.author}, ${input.body}, ${input.screen}, ${input.tpl}, ${input.x}, ${input.y}, ${input.flow}, ${input.plan}, ${deleteTokenHash})
        RETURNING id, created_at, updated_at, author, body, screen, tpl, x, y, flow, plan, status, delete_token_hash
      ` as CommentRecord[];
      if (!rows[0]) throw new Error('Comment insert returned no row.');
      return toCommentItem(rows[0]);
    },

    async createReply(input): Promise<ReplyItem | null> {
      await ensureTable();
      const rows = await sql`
        INSERT INTO comment_replies (comment_id, author, body)
        SELECT ${input.comment_id}::uuid, ${input.author}, ${input.body}
        WHERE EXISTS (SELECT 1 FROM comments WHERE id = ${input.comment_id}::uuid)
        RETURNING id, comment_id, created_at, author, body
      ` as ReplyRecord[];
      return rows[0] ? toReplyItem(rows[0]) : null;
    },

    async updateStatus(id, status): Promise<CommentItem | null> {
      await ensureTable();
      const rows = await sql`
        UPDATE comments SET status = ${status}, updated_at = now()
        WHERE id = ${id}::uuid
        RETURNING id, created_at, updated_at, author, body, screen, tpl, x, y, flow, plan, status
      ` as CommentRecord[];
      return rows[0] ? (await attachReplies([toCommentItem(rows[0])]))[0] : null;
    },

    async deleteTokenHash(id): Promise<string | null | undefined> {
      await ensureTable();
      const rows = await sql`SELECT delete_token_hash FROM comments WHERE id = ${id}::uuid` as Array<{ delete_token_hash: string | null }>;
      return rows[0]?.delete_token_hash;
    },

    async remove(id): Promise<boolean> {
      await ensureTable();
      const rows = await sql`DELETE FROM comments WHERE id = ${id}::uuid RETURNING id` as Array<{ id: string }>;
      return rows.length > 0;
    }
  };
}
