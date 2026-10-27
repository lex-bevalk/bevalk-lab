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

export interface CommentsStore {
  list(filters: CommentFilters): Promise<CommentItem[]>;
  create(input: CommentCreateInput): Promise<CommentItem>;
  updateStatus(id: string, status: CommentStatus): Promise<CommentItem | null>;
}

export type Validation<T> = { ok: true; value: T } | { ok: false; field: string };

const screenSet = new Set<string>(SCREEN_LABELS);
const statusSet = new Set<string>(COMMENT_STATUSES);
const anyControlCharacters = /[\u0000-\u001F\u007F]/;

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

  if (typeof value.author !== 'string') return { ok: false, field: 'author' };
  const author = value.author.trim();
  if (author.length < 1 || author.length > 60 || anyControlCharacters.test(author)) return { ok: false, field: 'author' };

  if (typeof value.body !== 'string') return { ok: false, field: 'body' };
  const body = value.body.trim();
  if (body.length < 1 || body.length > 2000 || /[\u0000-\u0009\u000B-\u001F\u007F]/.test(body)) return { ok: false, field: 'body' };

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
      author,
      body,
      screen: value.screen as CommentScreen,
      tpl: tpl.value,
      x: value.x,
      y: value.y,
      flow: flow.value,
      plan: plan.value
    }
  };
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

function toCommentItem(row: CommentRecord): CommentItem {
  return {
    ...row,
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString(),
    x: Number(row.x),
    y: Number(row.y)
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
      .then(() => undefined)
      .catch(error => {
        if (tableReady === pending) tableReady = null;
        throw error;
      });
    tableReady = pending;
    return pending;
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
      return rows.map(toCommentItem);
    },

    async create(input): Promise<CommentItem> {
      await ensureTable();
      const rows = await sql`
        INSERT INTO comments (author, body, screen, tpl, x, y, flow, plan)
        VALUES (${input.author}, ${input.body}, ${input.screen}, ${input.tpl}, ${input.x}, ${input.y}, ${input.flow}, ${input.plan})
        RETURNING id, created_at, updated_at, author, body, screen, tpl, x, y, flow, plan, status
      ` as CommentRecord[];
      if (!rows[0]) throw new Error('Comment insert returned no row.');
      return toCommentItem(rows[0]);
    },

    async updateStatus(id, status): Promise<CommentItem | null> {
      await ensureTable();
      const rows = await sql`
        UPDATE comments SET status = ${status}, updated_at = now()
        WHERE id = ${id}::uuid
        RETURNING id, created_at, updated_at, author, body, screen, tpl, x, y, flow, plan, status
      ` as CommentRecord[];
      return rows[0] ? toCommentItem(rows[0]) : null;
    }
  };
}
