import { next } from '@vercel/functions';
import { createNeonRateLimitStore } from './server/neon-rate-limit';
import {
  classifyRequest,
  handleLoginPost,
  isPublicLoginRequest,
  requestPathAndQuery
} from './server/passwall';
import { SESSION_COOKIE, verifySession } from './server/session';

export const config = { runtime: 'nodejs' };

let cachedDatabaseUrl: string | undefined;
let cachedRateLimitStore: ReturnType<typeof createNeonRateLimitStore> | undefined;

function rateLimitStore(databaseUrl: string): ReturnType<typeof createNeonRateLimitStore> {
  if (databaseUrl !== cachedDatabaseUrl || !cachedRateLimitStore) {
    cachedDatabaseUrl = databaseUrl;
    cachedRateLimitStore = createNeonRateLimitStore(databaseUrl);
  }
  return cachedRateLimitStore;
}

function cookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() === name) return part.slice(separator + 1).trim();
  }
  return null;
}

export default async function middleware(request: Request): Promise<Response> {
  const url = new URL(request.url);
  if (request.method.toUpperCase() === 'POST' && url.pathname === '/login') {
    const databaseUrl = process.env.DATABASE_URL;
    return handleLoginPost(request, {
      OWNER_PASSWORD: process.env.OWNER_PASSWORD,
      TEAM_PASSWORD: process.env.TEAM_PASSWORD,
      SESSION_SECRET: process.env.SESSION_SECRET,
      DATABASE_URL: databaseUrl
    }, {
      store: databaseUrl ? rateLimitStore(databaseUrl) : {
        get: async () => null,
        increment: async () => ({ hits: 0, resetAt: 0 }),
        clear: async () => undefined
      }
    });
  }

  if (isPublicLoginRequest(request.method, url.pathname)) return next();

  const secret = process.env.SESSION_SECRET;
  const token = cookieValue(request.headers.get('cookie'), SESSION_COOKIE);
  const session = secret ? await verifySession(token, secret) : null;
  const decision = classifyRequest(request.method, url.pathname, session !== null);

  if (decision === 'unauthorized-api') {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
    });
  }

  if (decision === 'login-redirect') {
    const query = new URLSearchParams({ next: requestPathAndQuery(request.url) });
    return new Response(null, {
      status: 302,
      headers: { Location: `/login?${query.toString()}`, 'Cache-Control': 'no-store' }
    });
  }

  const headers = new Headers(request.headers);
  if (session) headers.set('x-bvl-role', session.role);
  return next(session ? { request: { headers } } : undefined);
}
