import { describe, expect, it, vi } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SCREEN_LABELS, type CommentStatus } from '../../src/comments/constants';
import { createCommentsApi, COMMENT_WRITE_LIMIT, COMMENT_WRITE_WINDOW_MS } from '../../api/comments';
import {
  createNeonCommentsStore,
  validateCommentCreate,
  validateCommentFilters,
  validateCommentStatus,
  type CommentRecord
} from '../../server/comments';
import { MemoryRateLimitStore, type RateLimitStore } from '../../server/rate-limit';
import { SESSION_COOKIE, signSession } from '../../server/session';
import type { NeonSqlClient } from '../../server/neon-rate-limit';

const SESSION_SECRET = 'comments-test-session-secret-with-enough-entropy';
const DATABASE_URL = 'postgres://comments-test.invalid/lab';
const NOW = Date.UTC(2026, 9, 27, 12);
const BASE_URL = 'https://bevalk.test/api/comments';
const VALID_INPUT = {
  author: ' Ana ',
  body: ' Revisar este punto ',
  screen: 'Inicio',
  tpl: '421',
  x: 0.5,
  y: 0.25,
  flow: 'nuevo',
  plan: 'premium',
  ignored: 'se descarta'
};

function generatedScreenLabels(directory: string): string[] {
  const labels = new Set<string>();
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      for (const label of generatedScreenLabels(path)) labels.add(label);
    } else if (entry.isFile() && entry.name.endsWith('.tsx')) {
      const source = readFileSync(path, 'utf8');
      for (const match of source.matchAll(/data-screen-label"\s*:\s*__templateValue\(v0,\s*"([^"]+)"\)/g)) {
        labels.add(match[1]);
      }
    }
  }
  return [...labels].sort();
}

interface SqlCall {
  query: string;
  values: unknown[];
}

function testCommentRow(overrides: Partial<CommentRecord> = {}): CommentRecord {
  return {
    id: '2c6849e1-7a08-4b81-8b6c-4f50f8b2a729',
    created_at: new Date(NOW),
    updated_at: new Date(NOW),
    author: 'Ana',
    body: 'Revisar este punto',
    screen: 'Inicio',
    tpl: '421',
    x: 0.5,
    y: 0.25,
    flow: 'nuevo',
    plan: 'premium',
    status: 'todo',
    ...overrides
  };
}

function sqlHarness() {
  const calls: SqlCall[] = [];
  const sql: NeonSqlClient = async (strings, ...values) => {
    const query = strings.join('?');
    calls.push({ query, values });
    if (query.includes('INSERT INTO comments')) return [testCommentRow()];
    if (query.includes('UPDATE comments')) {
      if (values[1] === '00000000-0000-4000-8000-000000000000') return [];
      return [testCommentRow({ status: values[0] as CommentStatus, updated_at: new Date(NOW + 1000) })];
    }
    if (query.includes('SELECT id, created_at')) return [testCommentRow()];
    return [];
  };
  return { calls, sql };
}

async function sessionCookie(role: 'team' | 'owner' = 'team'): Promise<string> {
  return `${SESSION_COOKIE}=${await signSession(role, SESSION_SECRET, NOW)}`;
}

function createHarnessApi(options: {
  role?: 'team' | 'owner';
  sql?: NeonSqlClient;
  rateLimitStore?: RateLimitStore;
} = {}) {
  const { sql, calls } = sqlHarness();
  const commentsSql = options.sql ?? sql;
  const rateLimitStore = options.rateLimitStore ?? new MemoryRateLimitStore();
  const api = createCommentsApi({
    environment: () => ({ DATABASE_URL, SESSION_SECRET }),
    createCommentsStore: url => createNeonCommentsStore(url, commentsSql),
    rateLimitStore,
    now: () => NOW
  });
  return { api, calls, cookie: sessionCookie(options.role), rateLimitStore };
}

function request(
  method: string,
  options: { cookie?: string; json?: unknown; contentType?: string; origin?: string; url?: string; ip?: string } = {}
): Request {
  const headers = new Headers();
  if (options.cookie) headers.set('cookie', options.cookie);
  if (options.contentType) headers.set('content-type', options.contentType);
  if (options.origin) headers.set('origin', options.origin);
  if (options.ip) headers.set('x-forwarded-for', options.ip);
  const body = options.json === undefined ? undefined : JSON.stringify(options.json);
  return new Request(options.url ?? BASE_URL, { method, headers, body });
}

describe('comment validation', () => {
  it('accepts trimmed boundary values, allows newlines in text, and ignores unknown fields', () => {
    const result = validateCommentCreate({
      ...VALID_INPUT,
      author: ` ${'A'.repeat(60)} `,
      body: ` ${'a'.repeat(1000)}\n${'a'.repeat(999)} `,
      x: 0,
      y: 1,
      unknownField: { ignored: true }
    });
    expect(result).toEqual({
      ok: true,
      value: {
        author: 'A'.repeat(60),
        body: `${'a'.repeat(1000)}\n${'a'.repeat(999)}`,
        screen: 'Inicio',
        tpl: '421',
        x: 0,
        y: 1,
        flow: 'nuevo',
        plan: 'premium'
      }
    });
    expect(validateCommentCreate({ ...VALID_INPUT, author: ' Ana ', body: ' x ' })).toMatchObject({
      ok: true,
      value: { author: 'Ana', body: 'x' }
    });
  });

  it.each([
    [{ ...VALID_INPUT, author: ' ' }, 'author'],
    [{ ...VALID_INPUT, author: 'a'.repeat(61) }, 'author'],
    [{ ...VALID_INPUT, author: 'A\tna' }, 'author'],
    [{ ...VALID_INPUT, body: '' }, 'body'],
    [{ ...VALID_INPUT, body: 'a'.repeat(2001) }, 'body'],
    [{ ...VALID_INPUT, body: 'mal\u0001 texto' }, 'body'],
    [{ ...VALID_INPUT, x: -0.01 }, 'x'],
    [{ ...VALID_INPUT, x: 1.01 }, 'x'],
    [{ ...VALID_INPUT, x: Number.NaN }, 'x'],
    [{ ...VALID_INPUT, y: Number.POSITIVE_INFINITY }, 'y'],
    [{ ...VALID_INPUT, y: -0.1 }, 'y'],
    [{ ...VALID_INPUT, screen: 'Otra pantalla' }, 'screen'],
    [{ ...VALID_INPUT, status: 'closed' }, 'status'],
    [{ ...VALID_INPUT, plan: 'enterprise' }, 'plan']
  ])('rejects invalid field %s', (input, field) => {
    expect(validateCommentCreate(input)).toEqual({ ok: false, field });
  });

  it('keeps its screen whitelist aligned with generated data-screen-label values', () => {
    const generated = generatedScreenLabels(join(process.cwd(), 'src/ui/generated'));
    expect(generated).toHaveLength(28);
    expect([...SCREEN_LABELS].sort()).toEqual(generated);
  });

  it('validates status and optional list filters', () => {
    expect(validateCommentStatus('done')).toEqual({ ok: true, value: 'done' });
    expect(validateCommentStatus('waiting')).toEqual({ ok: false, field: 'status' });
    expect(validateCommentFilters(new URLSearchParams('screen=Inicio&status=todo&author=Ana'))).toEqual({
      ok: true,
      value: { screen: 'Inicio', status: 'todo', author: 'Ana' }
    });
    expect(validateCommentFilters(new URLSearchParams('screen=unknown'))).toEqual({ ok: false, field: 'screen' });
  });
});

describe('comments API authorization and writes', () => {
  it('uses a 30-write window of ten minutes', () => {
    expect(COMMENT_WRITE_LIMIT).toBe(30);
    expect(COMMENT_WRITE_WINDOW_MS).toBe(10 * 60 * 1000);
  });

  it('returns 401 without a session cookie', async () => {
    const { api } = createHarnessApi();
    const response = await api.GET(request('GET'));
    expect(response.status).toBe(401);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('requires JSON and a same-origin Origin header on writes', async () => {
    const { api, cookie } = createHarnessApi();
    const noJson = await api.POST(request('POST', { cookie: await cookie, origin: 'https://bevalk.test' }));
    expect(noJson.status).toBe(415);
    expect(await noJson.json()).toEqual({ error: 'unsupported_media_type' });

    const badOrigin = await api.POST(request('POST', {
      cookie: await cookie,
      json: VALID_INPUT,
      contentType: 'application/json',
      origin: 'https://other.test'
    }));
    expect(badOrigin.status).toBe(403);
  });

  it('allows team and owner to create a valid comment with status 201', async () => {
    const { api, cookie, calls } = createHarnessApi();
    const response = await api.POST(request('POST', {
      cookie: await cookie,
      json: VALID_INPUT,
      contentType: 'application/json',
      origin: 'https://bevalk.test'
    }));
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ id: testCommentRow().id, author: 'Ana', status: 'todo' });
    expect(calls.some(call => call.query.includes('INSERT INTO comments'))).toBe(true);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('allows only an owner to update status and returns 404 for an unknown id', async () => {
    const team = createHarnessApi({ role: 'team' });
    const forbidden = await team.api.PATCH(request('PATCH', {
      cookie: await team.cookie,
      json: { id: testCommentRow().id, status: 'done' },
      contentType: 'application/json',
      origin: 'https://bevalk.test'
    }));
    expect(forbidden.status).toBe(403);

    const owner = createHarnessApi({ role: 'owner' });
    const updated = await owner.api.PATCH(request('PATCH', {
      cookie: await owner.cookie,
      json: { id: testCommentRow().id, status: 'done' },
      contentType: 'application/json',
      origin: 'https://bevalk.test'
    }));
    expect(updated.status).toBe(200);
    expect(await updated.json()).toMatchObject({ id: testCommentRow().id, status: 'done' });

    const missing = await owner.api.PATCH(request('PATCH', {
      cookie: await owner.cookie,
      json: { id: '00000000-0000-4000-8000-000000000000', status: 'done' },
      contentType: 'application/json',
      origin: 'https://bevalk.test'
    }));
    expect(missing.status).toBe(404);
  });

  it('returns 429 after the write limit is exceeded', async () => {
    const exhausted: RateLimitStore = {
      get: vi.fn(async () => ({ hits: COMMENT_WRITE_LIMIT, resetAt: NOW + 60_000 })),
      increment: vi.fn(async () => ({ hits: COMMENT_WRITE_LIMIT + 1, resetAt: NOW + 60_000 })),
      clear: vi.fn(async () => undefined)
    };
    const { api, cookie, calls } = createHarnessApi({ rateLimitStore: exhausted });
    const response = await api.POST(request('POST', {
      cookie: await cookie,
      json: VALID_INPUT,
      contentType: 'application/json',
      origin: 'https://bevalk.test',
      ip: '192.0.2.20'
    }));
    expect(response.status).toBe(429);
    expect(calls.some(call => call.query.includes('INSERT INTO comments'))).toBe(false);
  });
});

describe('comments API SQL', () => {
  it('lists with parameterized optional filters and a 500-item limit', async () => {
    const { api, cookie, calls } = createHarnessApi();
    const response = await api.GET(request('GET', {
      cookie: await cookie,
      url: `${BASE_URL}?screen=Inicio&status=todo&author=Ana`
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ role: 'team', items: [{ author: 'Ana' }] });
    const select = calls.find(call => call.query.includes('SELECT id, created_at'));
    expect(select).toBeDefined();
    expect(select?.query).toContain('ORDER BY created_at DESC');
    expect(select?.query).toContain('LIMIT 500');
    expect(select?.query).toContain('screen = ?');
    expect(select?.query).toContain('status = ?');
    expect(select?.query).toContain('author = ?');
    expect(select?.query).not.toContain('Inicio');
    expect(select?.query).not.toContain('Ana');
    expect(select?.values).toContain('Inicio');
    expect(select?.values).toContain('todo');
    expect(select?.values).toContain('Ana');
  });
});
