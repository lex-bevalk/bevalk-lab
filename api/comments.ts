import { clientAddressKey } from '../server/passwall.js';
import { createNeonRateLimitStore } from '../server/neon-rate-limit.js';
import { RATE_LIMIT_WINDOW_MS, type RateLimitStore } from '../server/rate-limit.js';
import { verifySession, SESSION_COOKIE } from '../server/session.js';
import {
  createNeonCommentsStore,
  validateCommentCreate,
  validateCommentDelete,
  validateCommentFilters,
  validateCommentStatus,
  UUID_PATTERN,
  equalHex,
  type CommentsStore
} from '../server/comments.js';

export const COMMENT_WRITE_LIMIT = 30;
export const COMMENT_WRITE_WINDOW_MS = RATE_LIMIT_WINDOW_MS;

interface CommentsEnvironment {
  DATABASE_URL?: string;
  SESSION_SECRET?: string;
}

export interface CommentsApiDependencies {
  environment?: () => CommentsEnvironment;
  commentsStore?: CommentsStore;
  createCommentsStore?: (databaseUrl: string) => CommentsStore;
  rateLimitStore?: RateLimitStore;
  now?: () => number;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

function cookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const separator = part.indexOf('=');
    if (separator >= 0 && part.slice(0, separator).trim() === name) return part.slice(separator + 1).trim();
  }
  return null;
}

function hasJsonContentType(request: Request): boolean {
  return /^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')?.trim() ?? '');
}

function hasSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  const hex = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  return hex;
}

async function writeRateLimitKey(request: Request): Promise<string> {
  const address = clientAddressKey(request.headers);
  const hex = await sha256Hex(address);
  return `comments-write:ip:${hex}`;
}

function genericError(): Response {
  return json({ error: 'internal' }, 500);
}

export function createCommentsApi(dependencies: CommentsApiDependencies = {}) {
  const environment = dependencies.environment ?? (() => ({
    DATABASE_URL: process.env.DATABASE_URL,
    SESSION_SECRET: process.env.SESSION_SECRET
  }));
  const now = dependencies.now ?? Date.now;
  let cachedUrl: string | undefined;
  let cachedComments: CommentsStore | undefined;
  let cachedRateLimit: RateLimitStore | undefined;

  function stores(databaseUrl: string): { comments: CommentsStore; rateLimit: RateLimitStore } {
    if (cachedUrl !== databaseUrl || !cachedComments || !cachedRateLimit) {
      cachedUrl = databaseUrl;
      cachedComments = dependencies.commentsStore ?? dependencies.createCommentsStore?.(databaseUrl) ?? createNeonCommentsStore(databaseUrl);
      cachedRateLimit = dependencies.rateLimitStore ?? createNeonRateLimitStore(databaseUrl);
    }
    const comments = dependencies.commentsStore ?? cachedComments;
    const rateLimit = dependencies.rateLimitStore ?? cachedRateLimit;
    if (!comments || !rateLimit) throw new Error('Comment stores are not configured.');
    return { comments, rateLimit };
  }

  async function authenticate(request: Request): Promise<{ role: 'team' | 'owner' } | Response> {
    const env = environment();
    if (!env.SESSION_SECRET) return genericError();
    const session = await verifySession(cookieValue(request.headers.get('cookie'), SESSION_COOKIE), env.SESSION_SECRET, now());
    return session ? { role: session.role } : json({ error: 'unauthorized' }, 401);
  }

  async function parseJson(request: Request): Promise<{ ok: true; value: unknown } | { ok: false; response: Response }> {
    if (!hasJsonContentType(request)) return { ok: false, response: json({ error: 'unsupported_media_type' }, 415) };
    if (!hasSameOrigin(request)) return { ok: false, response: json({ error: 'forbidden' }, 403) };
    try {
      return { ok: true, value: await request.json() };
    } catch {
      return { ok: false, response: json({ error: 'invalid', field: 'body' }, 400) };
    }
  }

  async function takeWriteSlot(request: Request, rateLimit: RateLimitStore): Promise<Response | null> {
    const key = await writeRateLimitKey(request);
    const record = await rateLimit.increment(key, now());
    return record.hits > COMMENT_WRITE_LIMIT ? json({ error: 'rate_limited' }, 429) : null;
  }

  return {
    async GET(request: Request): Promise<Response> {
      const auth = await authenticate(request);
      if (auth instanceof Response) return auth;
      const env = environment();
      if (!env.DATABASE_URL) return genericError();
      const filters = validateCommentFilters(new URL(request.url).searchParams);
      if (!filters.ok) return json({ error: 'invalid', field: filters.field }, 400);
      try {
        const { comments } = stores(env.DATABASE_URL);
        return json({ role: auth.role, items: await comments.list(filters.value) });
      } catch {
        return genericError();
      }
    },

    async POST(request: Request): Promise<Response> {
      const auth = await authenticate(request);
      if (auth instanceof Response) return auth;
      const env = environment();
      if (!env.DATABASE_URL) return genericError();
      const parsed = await parseJson(request);
      if (!parsed.ok) return parsed.response;
      const input = validateCommentCreate(parsed.value);
      if (!input.ok) return json({ error: 'invalid', field: input.field }, 400);
      try {
        const { comments, rateLimit } = stores(env.DATABASE_URL);
        const limited = await takeWriteSlot(request, rateLimit);
        if (limited) return limited;
        const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('');
        const item = await comments.create(input.value, await sha256Hex(token));
        return json({ ...item, delete_token: token }, 201);
      } catch {
        return genericError();
      }
    },

    async PATCH(request: Request): Promise<Response> {
      const auth = await authenticate(request);
      if (auth instanceof Response) return auth;
      if (auth.role !== 'owner') return json({ error: 'forbidden' }, 403);
      const env = environment();
      if (!env.DATABASE_URL) return genericError();
      const parsed = await parseJson(request);
      if (!parsed.ok) return parsed.response;
      const value = parsed.value;
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return json({ error: 'invalid', field: 'id' }, 400);
      }
      const record = value as Record<string, unknown>;
      const id = typeof record.id === 'string' ? record.id : '';
      if (!UUID_PATTERN.test(id)) {
        return json({ error: 'invalid', field: 'id' }, 400);
      }
      const status = validateCommentStatus(record.status);
      if (!status.ok) return json({ error: 'invalid', field: status.field }, 400);
      try {
        const { comments, rateLimit } = stores(env.DATABASE_URL);
        const limited = await takeWriteSlot(request, rateLimit);
        if (limited) return limited;
        const item = await comments.updateStatus(id, status.value);
        return item ? json(item) : json({ error: 'not_found' }, 404);
      } catch {
        return genericError();
      }
    },

    async DELETE(request: Request): Promise<Response> {
      const auth = await authenticate(request);
      if (auth instanceof Response) return auth;
      const parsed = await parseJson(request);
      if (!parsed.ok) return parsed.response;
      const input = validateCommentDelete(parsed.value);
      if (!input.ok) return json({ error: 'invalid', field: input.field }, 400);
      if (auth.role === 'team' && !input.value.token) return json({ error: 'forbidden' }, 403);
      const env = environment();
      if (!env.DATABASE_URL) return genericError();
      try {
        const { comments, rateLimit } = stores(env.DATABASE_URL);
        const limited = await takeWriteSlot(request, rateLimit);
        if (limited) return limited;
        const storedHash = await comments.deleteTokenHash(input.value.id);
        if (storedHash === undefined) return json({ error: 'not_found' }, 404);
        if (auth.role === 'team' && (storedHash === null || !equalHex(storedHash, await sha256Hex(input.value.token!)))) {
          return json({ error: 'forbidden' }, 403);
        }
        if (!await comments.remove(input.value.id)) return json({ error: 'not_found' }, 404);
        return json({ id: input.value.id });
      } catch {
        return genericError();
      }
    }
  };
}

const handlers = createCommentsApi();

export async function GET(request: Request): Promise<Response> {
  return handlers.GET(request);
}

export async function POST(request: Request): Promise<Response> {
  return handlers.POST(request);
}

export async function PATCH(request: Request): Promise<Response> {
  return handlers.PATCH(request);
}

export async function DELETE(request: Request): Promise<Response> {
  return handlers.DELETE(request);
}
