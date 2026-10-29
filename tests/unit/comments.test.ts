import { describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ALL_SCREEN_LABELS, SCREEN_LABELS, SCREEN_LABELS_BY_PROTO, type CommentStatus } from '../../src/comments/constants';
import { createCommentsApi, COMMENT_WRITE_LIMIT, COMMENT_WRITE_WINDOW_MS } from '../../api/comments';
import {
  createNeonCommentsStore,
  validateCommentCreate,
  validateCommentDelete,
  validateCommentFilters,
  validateCommentStatus,
  validateReplyCreate,
  equalHex,
  type CommentRecord,
  type ReplyRecord
} from '../../server/comments';
import { MemoryRateLimitStore, type RateLimitStore } from '../../server/rate-limit';
import { SESSION_COOKIE, signSession } from '../../server/session';
import type { NeonSqlClient } from '../../server/neon-rate-limit';

const SESSION_SECRET = 'comments-test-session-secret-with-enough-entropy';
const DATABASE_URL = 'postgres://comments-test.invalid/lab';
const NOW = Date.UTC(2026, 9, 27, 12);
const BASE_URL = 'https://bevalk.test/api/comments';
const MISSING_ID = '00000000-0000-4000-8000-000000000000';
const DELETE_TOKEN = 'a'.repeat(64);
const DELETE_TOKEN_HASH = createHash('sha256').update(DELETE_TOKEN).digest('hex');
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
    proto: 'concept',
    screen: 'Inicio',
    tpl: '421',
    x: 0.5,
    y: 0.25,
    flow: 'nuevo',
    plan: 'premium',
    status: 'todo',
    delete_token_hash: DELETE_TOKEN_HASH,
    ...overrides
  };
}

function testReplyRow(overrides: Partial<ReplyRecord> = {}): ReplyRecord {
  return {
    id: 'af9f8ad0-15ec-4ed3-a748-c50c9a1d7854',
    comment_id: testCommentRow().id,
    created_at: new Date(NOW + 2000),
    author: 'Luis',
    body: 'De acuerdo',
    ...overrides
  };
}

function sqlHarness(options: { commentRows?: CommentRecord[]; replyRows?: ReplyRecord[] } = {}) {
  const calls: SqlCall[] = [];
  const sql: NeonSqlClient = async (strings, ...values) => {
    const query = strings.join('?');
    calls.push({ query, values });
    if (query.includes('ALTER TABLE comments') || query.includes('CREATE TABLE IF NOT EXISTS comment_replies') || query.includes('CREATE INDEX IF NOT EXISTS comment_replies')) return [];
    if (query.includes('INSERT INTO comment_replies')) {
      if (values[0] === MISSING_ID) return [];
      return [testReplyRow({ comment_id: String(values[0]), author: String(values[1]), body: String(values[2]) })];
    }
    if (query.includes('FROM comment_replies')) {
      const ids = values[0] as string[];
      return (options.replyRows ?? []).filter(reply => ids.includes(reply.comment_id));
    }
    if (query.includes('INSERT INTO comments')) return [testCommentRow({
      proto: String(values[2]) as CommentRecord['proto'],
      screen: String(values[3]) as CommentRecord['screen'],
      delete_token_hash: String(values[9])
    })];
    if (query.includes('UPDATE comments')) {
      if (values[1] === MISSING_ID) return [];
      return [testCommentRow({ status: values[0] as CommentStatus, updated_at: new Date(NOW + 1000) })];
    }
    if (query.includes('SELECT delete_token_hash FROM comments')) {
      if (values[0] === MISSING_ID) return [];
      return [{ delete_token_hash: DELETE_TOKEN_HASH }];
    }
    if (query.includes('DELETE FROM comments')) return values[0] === MISSING_ID ? [] : [{ id: values[0] as string }];
    if (query.includes('SELECT id, created_at')) return options.commentRows ?? [testCommentRow()];
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
  commentRows?: CommentRecord[];
  replyRows?: ReplyRecord[];
} = {}) {
  const { sql, calls } = sqlHarness({ commentRows: options.commentRows, replyRows: options.replyRows });
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
        proto: 'concept',
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
    [{ ...VALID_INPUT, proto: 'other' }, 'proto'],
    [{ ...VALID_INPUT, proto: 'current', screen: 'Ayuda' }, 'screen'],
    [{ ...VALID_INPUT, status: 'closed' }, 'status'],
    [{ ...VALID_INPUT, plan: 'enterprise' }, 'plan']
  ])('rejects invalid field %s', (input, field) => {
    expect(validateCommentCreate(input)).toEqual({ ok: false, field });
  });

  it('validates reply ids, names, and bodies with the comment text rules', () => {
    expect(validateReplyCreate({ comment_id: testCommentRow().id, author: ' Luis ', body: ' De acuerdo ' })).toEqual({
      ok: true,
      value: { comment_id: testCommentRow().id, author: 'Luis', body: 'De acuerdo' }
    });
    expect(validateReplyCreate({ comment_id: 'bad-id', author: 'Luis', body: 'Ok' })).toEqual({ ok: false, field: 'comment_id' });
    expect(validateReplyCreate({ comment_id: testCommentRow().id, author: 'L'.repeat(61), body: 'Ok' })).toEqual({ ok: false, field: 'author' });
    expect(validateReplyCreate({ comment_id: testCommentRow().id, author: 'Luis', body: 'B'.repeat(2001) })).toEqual({ ok: false, field: 'body' });
    expect(validateReplyCreate({ comment_id: testCommentRow().id, author: 'Luis', body: 'mal\u0001 texto' })).toEqual({ ok: false, field: 'body' });
  });

  it('keeps its screen whitelist aligned with generated data-screen-label values', () => {
    const generated = generatedScreenLabels(join(process.cwd(), 'src/ui/generated'));
    expect(generated).toHaveLength(28);
    expect([...SCREEN_LABELS].sort()).toEqual(generated);
  });

  it('keeps the current screen whitelist aligned with generated data-screen-label values', () => {
    const generated = generatedScreenLabels(join(process.cwd(), 'src/current/ui/generated'));
    expect(generated).toHaveLength(30);
    expect([...SCREEN_LABELS_BY_PROTO.current].sort()).toEqual(generated);
    expect(ALL_SCREEN_LABELS).toContain('Escáner');
    expect(ALL_SCREEN_LABELS).toContain('Ayuda');
  });

  it('validates status and optional list filters', () => {
    expect(validateCommentStatus('done')).toEqual({ ok: true, value: 'done' });
    expect(validateCommentStatus('waiting')).toEqual({ ok: false, field: 'status' });
    expect(validateCommentFilters(new URLSearchParams('screen=Inicio&status=todo&author=Ana'))).toEqual({
      ok: true,
      value: { screen: 'Inicio', status: 'todo', author: 'Ana' }
    });
    expect(validateCommentFilters(new URLSearchParams('proto=current&screen=Escáner'))).toEqual({
      ok: true,
      value: { proto: 'current', screen: 'Escáner' }
    });
    expect(validateCommentFilters(new URLSearchParams('screen=Escáner'))).toEqual({
      ok: true,
      value: { screen: 'Escáner' }
    });
    expect(validateCommentFilters(new URLSearchParams('proto=unknown'))).toEqual({ ok: false, field: 'proto' });
    expect(validateCommentFilters(new URLSearchParams('proto=concept&screen=Escáner'))).toEqual({ ok: false, field: 'screen' });
    expect(validateCommentFilters(new URLSearchParams('screen=unknown'))).toEqual({ ok: false, field: 'screen' });
  });

  it('validates comment deletion ids and optional 64-character hex tokens', () => {
    expect(validateCommentDelete({ id: testCommentRow().id })).toEqual({ ok: true, value: { id: testCommentRow().id, token: null } });
    expect(validateCommentDelete({ id: testCommentRow().id, token: DELETE_TOKEN })).toEqual({
      ok: true,
      value: { id: testCommentRow().id, token: DELETE_TOKEN }
    });
    expect(validateCommentDelete({ id: 'bad-id' })).toEqual({ ok: false, field: 'id' });
    expect(validateCommentDelete({ id: testCommentRow().id, token: 'x'.repeat(64) })).toEqual({ ok: false, field: 'token' });
    expect(validateCommentDelete({ id: testCommentRow().id, token: 'a'.repeat(63) })).toEqual({ ok: false, field: 'token' });
  });

  it('compares equal-length hex strings without returning early on differing characters', () => {
    expect(equalHex('a'.repeat(64), 'a'.repeat(64))).toBe(true);
    expect(equalHex('a'.repeat(64), 'b'.repeat(64))).toBe(false);
    expect(equalHex('a'.repeat(64), 'a'.repeat(63))).toBe(false);
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

  it('returns a one-time delete token on creation without exposing the stored hash', async () => {
    const { api, cookie, calls } = createHarnessApi();
    const response = await api.POST(request('POST', {
      cookie: await cookie,
      json: VALID_INPUT,
      contentType: 'application/json',
      origin: 'https://bevalk.test'
    }));
    const body = await response.json() as Record<string, unknown>;
    expect(response.status).toBe(201);
    expect(body.delete_token).toMatch(/^[0-9a-f]{64}$/);
    expect(body.proto).toBe('concept');
    expect(body).not.toHaveProperty('delete_token_hash');
    const insert = calls.find(call => call.query.includes('INSERT INTO comments'));
    expect(insert).toBeDefined();
    expect(insert?.query).toContain('delete_token_hash');
    expect(insert?.values[2]).toBe('concept');
    expect(insert?.values[9]).toMatch(/^[0-9a-f]{64}$/);
    expect(calls.some(call => call.query.includes("ALTER TABLE comments ADD COLUMN IF NOT EXISTS proto text NOT NULL DEFAULT 'concept'"))).toBe(true);
    expect(calls.some(call => call.query.includes('ALTER TABLE comments ADD COLUMN IF NOT EXISTS delete_token_hash'))).toBe(true);
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

  it('rejects an invalid prototype with HTTP 400 and accepts Current screen labels', async () => {
    const { api, cookie } = createHarnessApi();
    const invalidProto = await api.POST(request('POST', {
      cookie: await cookie,
      json: { ...VALID_INPUT, proto: 'other' },
      contentType: 'application/json',
      origin: 'https://bevalk.test'
    }));
    expect(invalidProto.status).toBe(400);
    expect(await invalidProto.json()).toEqual({ error: 'invalid', field: 'proto' });

    const current = await api.POST(request('POST', {
      cookie: await cookie,
      json: { ...VALID_INPUT, proto: 'current', screen: 'Escáner' },
      contentType: 'application/json',
      origin: 'https://bevalk.test'
    }));
    expect(current.status).toBe(201);
    expect(await current.json()).toMatchObject({ proto: 'current', screen: 'Escáner' });
  });

  it.each(['team', 'owner'] as const)('allows %s to create a reply without returning a delete token', async role => {
    const { api, cookie, calls } = createHarnessApi({ role });
    const response = await api.POST(request('POST', {
      cookie: await cookie,
      json: { comment_id: testCommentRow().id, author: ' Luis ', body: ' De acuerdo ' },
      contentType: 'application/json',
      origin: 'https://bevalk.test'
    }));
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body).toMatchObject({
      id: testReplyRow().id,
      comment_id: testCommentRow().id,
      author: 'Luis',
      body: 'De acuerdo'
    });
    expect(body).not.toHaveProperty('delete_token');
    expect(calls.some(call => call.query.includes('INSERT INTO comment_replies'))).toBe(true);
    expect(calls.some(call => call.query.includes('INSERT INTO comments'))).toBe(false);
  });

  it('treats comment_id payloads as replies, returns 404 for a missing parent, and rate-limits before reply SQL', async () => {
    const input = { comment_id: testCommentRow().id, author: 'Ana', body: 'Respuesta', screen: 'Inicio', x: 0.2, y: 0.3 };
    const normal = createHarnessApi();
    const created = await normal.api.POST(request('POST', {
      cookie: await normal.cookie,
      json: input,
      contentType: 'application/json',
      origin: 'https://bevalk.test'
    }));
    expect(created.status).toBe(201);
    expect(await created.json()).not.toHaveProperty('delete_token');
    expect(normal.calls.some(call => call.query.includes('INSERT INTO comment_replies'))).toBe(true);
    expect(normal.calls.some(call => call.query.includes('INSERT INTO comments'))).toBe(false);

    const missing = createHarnessApi();
    const notFound = await missing.api.POST(request('POST', {
      cookie: await missing.cookie,
      json: { comment_id: MISSING_ID, author: 'Ana', body: 'Respuesta' },
      contentType: 'application/json',
      origin: 'https://bevalk.test'
    }));
    expect(notFound.status).toBe(404);
    expect(await notFound.json()).toEqual({ error: 'not_found' });

    const exhausted: RateLimitStore = {
      get: vi.fn(async () => ({ hits: COMMENT_WRITE_LIMIT, resetAt: NOW + 60_000 })),
      increment: vi.fn(async () => ({ hits: COMMENT_WRITE_LIMIT + 1, resetAt: NOW + 60_000 })),
      clear: vi.fn(async () => undefined)
    };
    const limited = createHarnessApi({ rateLimitStore: exhausted });
    const rateLimited = await limited.api.POST(request('POST', {
      cookie: await limited.cookie,
      json: { comment_id: testCommentRow().id, author: 'Ana', body: 'Respuesta' },
      contentType: 'application/json',
      origin: 'https://bevalk.test'
    }));
    expect(rateLimited.status).toBe(429);
    expect(limited.calls.some(call => call.query.includes('INSERT INTO comment_replies'))).toBe(false);
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

  it('deletes comments with the owner role or the matching team token', async () => {
    const team = createHarnessApi();
    const teamResponse = await team.api.DELETE(request('DELETE', {
      cookie: await team.cookie,
      json: { id: testCommentRow().id, token: DELETE_TOKEN },
      contentType: 'application/json',
      origin: 'https://bevalk.test'
    }));
    expect(teamResponse.status).toBe(200);
    expect(await teamResponse.json()).toEqual({ id: testCommentRow().id });
    expect(team.calls.some(call => call.query.includes('DELETE FROM comments'))).toBe(true);

    const owner = createHarnessApi({ role: 'owner' });
    const ownerResponse = await owner.api.DELETE(request('DELETE', {
      cookie: await owner.cookie,
      json: { id: testCommentRow().id },
      contentType: 'application/json',
      origin: 'https://bevalk.test'
    }));
    expect(ownerResponse.status).toBe(200);
    expect(await ownerResponse.json()).toEqual({ id: testCommentRow().id });
  });

  it('checks DELETE authentication, media type, origin, id, token and team token requirement', async () => {
    const { api, cookie, calls } = createHarnessApi();
    expect((await api.DELETE(request('DELETE'))).status).toBe(401);
    expect((await api.DELETE(request('DELETE', { cookie: await cookie, origin: 'https://bevalk.test' }))).status).toBe(415);
    expect((await api.DELETE(request('DELETE', {
      cookie: await cookie,
      json: { id: testCommentRow().id, token: DELETE_TOKEN },
      contentType: 'application/json',
      origin: 'https://other.test'
    }))).status).toBe(403);

    const deleteRequest = async (payload: unknown) => request('DELETE', {
      cookie: await cookie,
      json: payload,
      contentType: 'application/json',
      origin: 'https://bevalk.test'
    });
    expect((await api.DELETE(await deleteRequest({ id: 'invalid' }))).status).toBe(400);
    expect(await (await api.DELETE(await deleteRequest({ id: testCommentRow().id, token: 'bad' }))).json()).toEqual({ error: 'invalid', field: 'token' });
    expect((await api.DELETE(await deleteRequest({ id: testCommentRow().id }))).status).toBe(403);
    expect(calls.some(call => call.query.includes('SELECT delete_token_hash'))).toBe(false);
  });

  it('rejects a wrong team token, returns 404 for missing ids, and rate-limits before comment SQL', async () => {
    const wrongToken = createHarnessApi();
    expect((await wrongToken.api.DELETE(request('DELETE', {
      cookie: await wrongToken.cookie,
      json: { id: testCommentRow().id, token: 'b'.repeat(64) },
      contentType: 'application/json',
      origin: 'https://bevalk.test'
    }))).status).toBe(403);
    expect(wrongToken.calls.some(call => call.query.includes('DELETE FROM comments'))).toBe(false);

    const missing = createHarnessApi({ role: 'owner' });
    expect((await missing.api.DELETE(request('DELETE', {
      cookie: await missing.cookie,
      json: { id: MISSING_ID },
      contentType: 'application/json',
      origin: 'https://bevalk.test'
    }))).status).toBe(404);

    const exhausted: RateLimitStore = {
      get: vi.fn(async () => ({ hits: COMMENT_WRITE_LIMIT, resetAt: NOW + 60_000 })),
      increment: vi.fn(async () => ({ hits: COMMENT_WRITE_LIMIT + 1, resetAt: NOW + 60_000 })),
      clear: vi.fn(async () => undefined)
    };
    const limited = createHarnessApi({ rateLimitStore: exhausted });
    expect((await limited.api.DELETE(request('DELETE', {
      cookie: await limited.cookie,
      json: { id: testCommentRow().id, token: DELETE_TOKEN },
      contentType: 'application/json',
      origin: 'https://bevalk.test'
    }))).status).toBe(429);
    expect(limited.calls.some(call => call.query.includes('SELECT delete_token_hash'))).toBe(false);
    expect(limited.calls.some(call => call.query.includes('DELETE FROM comments'))).toBe(false);
  });
});

describe('comments API SQL', () => {
  it('creates the replies table after the comment alteration and adds its index', async () => {
    const { api, cookie, calls } = createHarnessApi();
    expect((await api.GET(request('GET', { cookie: await cookie }))).status).toBe(200);
    const table = calls.find(call => call.query.includes('CREATE TABLE IF NOT EXISTS comment_replies'));
    const index = calls.find(call => call.query.includes('CREATE INDEX IF NOT EXISTS comment_replies_comment_id_idx'));
    expect(table?.query).toContain('references comments(id) on delete cascade');
    expect(calls.findIndex(call => call.query.includes('ALTER TABLE comments'))).toBeLessThan(calls.findIndex(call => call.query.includes('CREATE TABLE IF NOT EXISTS comment_replies')));
    expect(index?.query).toContain('ON comment_replies (comment_id, created_at)');
  });

  it('migrates proto before indexing and returns a requested proto filter', async () => {
    const current = testCommentRow({ proto: 'current', screen: 'Escáner' });
    const { api, cookie, calls } = createHarnessApi({ commentRows: [current] });
    const response = await api.GET(request('GET', { cookie: await cookie, url: `${BASE_URL}?proto=current` }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ items: [{ proto: 'current', screen: 'Escáner' }] });
    const alter = calls.findIndex(call => call.query.includes("ALTER TABLE comments ADD COLUMN IF NOT EXISTS proto text NOT NULL DEFAULT 'concept'"));
    const index = calls.findIndex(call => call.query.includes('comments_proto_created_at_idx'));
    const select = calls.find(call => call.query.includes('SELECT id, created_at'));
    expect(alter).toBeGreaterThanOrEqual(0);
    expect(index).toBeGreaterThan(alter);
    expect(select?.query).toContain('proto = ?');
    expect(select?.values).toContain('current');
  });

  it('returns HTTP 400 for an invalid prototype query and accepts union screen filters', async () => {
    const { api, cookie } = createHarnessApi();
    const invalidProto = await api.GET(request('GET', { cookie: await cookie, url: `${BASE_URL}?proto=other` }));
    expect(invalidProto.status).toBe(400);
    expect(await invalidProto.json()).toEqual({ error: 'invalid', field: 'proto' });

    const unionScreen = await api.GET(request('GET', { cookie: await cookie, url: `${BASE_URL}?screen=Escáner` }));
    expect(unionScreen.status).toBe(200);
  });

  it('lists with parameterized optional filters and a 500-item limit', async () => {
    const reply = testReplyRow();
    const { api, cookie, calls } = createHarnessApi({ replyRows: [reply] });
    const response = await api.GET(request('GET', {
      cookie: await cookie,
      url: `${BASE_URL}?screen=Inicio&status=todo&author=Ana`
    }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ role: 'team', items: [{ author: 'Ana', replies: [{ id: reply.id, body: reply.body }] }] });
    const select = calls.find(call => call.query.includes('SELECT id, created_at'));
    expect(select).toBeDefined();
    expect(select?.query).toContain('ORDER BY created_at DESC');
    expect(select?.query).toContain('LIMIT 500');
    expect(select?.query).not.toContain('delete_token_hash');
    expect(select?.query).toContain('screen = ?');
    expect(select?.query).toContain('status = ?');
    expect(select?.query).toContain('author = ?');
    expect(select?.query).not.toContain('Inicio');
    expect(select?.query).not.toContain('Ana');
    expect(select?.values).toContain('Inicio');
    expect(select?.values).toContain('todo');
    expect(select?.values).toContain('Ana');
    expect(JSON.stringify(body)).not.toContain('delete_token_hash');
    const replyQuery = calls.filter(call => call.query.includes('FROM comment_replies'));
    expect(replyQuery).toHaveLength(1);
    expect(replyQuery[0].query).toContain('ANY(?::uuid[])');
    expect(replyQuery[0].query).not.toContain(testCommentRow().id);
    expect(replyQuery[0].values[0]).toEqual([testCommentRow().id]);
  });

  it('does not query replies for an empty comment list and attaches replies to PATCH results', async () => {
    const empty = createHarnessApi({ commentRows: [] });
    const emptyList = await empty.api.GET(request('GET', { cookie: await empty.cookie }));
    expect((await emptyList.json()).items).toEqual([]);
    expect(empty.calls.some(call => call.query.includes('FROM comment_replies'))).toBe(false);

    const reply = testReplyRow();
    const owner = createHarnessApi({ role: 'owner', replyRows: [reply] });
    const updated = await owner.api.PATCH(request('PATCH', {
      cookie: await owner.cookie,
      json: { id: testCommentRow().id, status: 'done' },
      contentType: 'application/json',
      origin: 'https://bevalk.test'
    }));
    expect(updated.status).toBe(200);
    expect(await updated.json()).toMatchObject({ status: 'done', replies: [{ id: reply.id, comment_id: testCommentRow().id }] });
  });
});
