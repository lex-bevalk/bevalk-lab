import {
  constantTimeTextEqual,
  sessionCookie,
  signSession,
  type SessionRole
} from './session';
import {
  isRateLimited,
  type RateLimitStore
} from './rate-limit';

export const LOGIN_LOGO_PATH = '/assets/77effca3e02e95da2e7019fa1e4a6fea.png';

const LOGIN_ENTRY_ASSET = /^\/assets\/login-[A-Za-z0-9_-]+\.(?:js|css)$/;
const GUTON_FONT_ASSET = /^\/assets\/Guton-SemiBold-[A-Za-z0-9_-]+\.woff2$/;

export function isPublicLoginAsset(pathname: string): boolean {
  return pathname === LOGIN_LOGO_PATH || LOGIN_ENTRY_ASSET.test(pathname) || GUTON_FONT_ASSET.test(pathname);
}

export function isPublicLoginRequest(method: string, pathname: string): boolean {
  const normalizedMethod = method.toUpperCase();
  if ((normalizedMethod === 'GET' || normalizedMethod === 'HEAD') && pathname === '/login') return true;
  return (normalizedMethod === 'GET' || normalizedMethod === 'HEAD') && isPublicLoginAsset(pathname);
}

export function safeNextPath(candidate: string | null | undefined, origin = 'https://bevalk.invalid'): string {
  if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//') || /[\\\r\n\u0000-\u001f]/.test(candidate)) {
    return '/';
  }
  try {
    const resolved = new URL(candidate, origin);
    if (resolved.origin !== new URL(origin).origin) return '/';
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return '/';
  }
}

export function classifyRequest(method: string, pathname: string, hasSession: boolean):
  'public' | 'login-submit' | 'next' | 'unauthorized-api' | 'login-redirect' {
  const normalizedMethod = method.toUpperCase();
  if (normalizedMethod === 'POST' && pathname === '/login') return 'login-submit';
  if (isPublicLoginRequest(normalizedMethod, pathname)) return 'public';
  if (hasSession) return 'next';
  if (pathname === '/api' || pathname.startsWith('/api/')) return 'unauthorized-api';
  return 'login-redirect';
}

export function requestPathAndQuery(requestUrl: string): string {
  const url = new URL(requestUrl);
  return `${url.pathname}${url.search}`;
}

export function clientAddressKey(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const real = headers.get('x-real-ip')?.trim();
  return forwarded || real || 'unknown';
}

export interface LoginEnvironment {
  OWNER_PASSWORD?: string;
  TEAM_PASSWORD?: string;
  SESSION_SECRET?: string;
  DATABASE_URL?: string;
}

export interface LoginDependencies {
  store: RateLimitStore;
  now?: () => number;
  delay?: (milliseconds: number) => Promise<void>;
}

function redirect(location: string, headers: HeadersInit = {}): Response {
  return new Response(null, {
    status: 303,
    headers: { Location: location, 'Cache-Control': 'no-store', ...Object.fromEntries(new Headers(headers)) }
  });
}

function loginLocation(error: '1' | 'rate', next: string): string {
  const query = new URLSearchParams({ error, next });
  return `/login?${query.toString()}`;
}

function genericServerError(): Response {
  return new Response('Internal server error', {
    status: 500,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

export async function handleLoginPost(
  request: Request,
  environment: LoginEnvironment,
  dependencies: LoginDependencies
): Promise<Response> {
  const { OWNER_PASSWORD, TEAM_PASSWORD, SESSION_SECRET, DATABASE_URL } = environment;
  if (!OWNER_PASSWORD || !TEAM_PASSWORD || !SESSION_SECRET || !DATABASE_URL) return genericServerError();

  let form: URLSearchParams;
  try {
    form = new URLSearchParams(await request.text());
  } catch {
    return genericServerError();
  }

  const password = form.get('password') ?? '';
  const next = safeNextPath(form.get('next'), new URL(request.url).origin);
  const now = dependencies.now ?? Date.now;
  const delay = dependencies.delay ?? (milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)));
  const address = clientAddressKey(request.headers);
  const keyDigest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(address));
  const key = `ip:${Array.from(new Uint8Array(keyDigest), byte => byte.toString(16).padStart(2, '0')).join('')}`;

  try {
    if (await isRateLimited(dependencies.store, key, now())) return redirect(loginLocation('rate', next));

    // Owner is checked first so a shared credential collision always resolves to owner.
    let role: SessionRole | null = null;
    if (await constantTimeTextEqual(password, OWNER_PASSWORD)) role = 'owner';
    else if (await constantTimeTextEqual(password, TEAM_PASSWORD)) role = 'team';

    if (role) {
      await dependencies.store.clear(key);
      const token = await signSession(role, SESSION_SECRET, now());
      return redirect(next, { 'Set-Cookie': sessionCookie(token) });
    }

    await dependencies.store.increment(key, now());
    await delay(1500);
    return redirect(loginLocation('1', next));
  } catch {
    return genericServerError();
  }
}

