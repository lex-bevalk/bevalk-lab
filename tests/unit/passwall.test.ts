import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { classifyRequest, handleLoginPost, isPublicLoginAsset, isPublicLoginRequest, safeNextPath } from '../../server/passwall';
import {
  isRateLimited,
  MemoryRateLimitStore,
  RATE_LIMIT_MAX_FAILURES,
  RATE_LIMIT_WINDOW_MS
} from '../../server/rate-limit';
import { createNeonRateLimitStore, type NeonSqlClient } from '../../server/neon-rate-limit';
import { SESSION_MAX_AGE_SECONDS, verifySession, signSession } from '../../server/session';

const SESSION_SECRET = 'a-test-only-session-secret-with-enough-entropy';
const LOGIN_ENV = {
  OWNER_PASSWORD: 'owner-secret',
  TEAM_PASSWORD: 'team-secret',
  SESSION_SECRET,
  DATABASE_URL: 'postgres://test-only.invalid/passwall'
};

describe('JavaScript package scopes', () => {
  it('uses ESM at the root and CommonJS for e2e scripts', () => {
    // Vercel middleware.js needs the root ESM scope; e2e scripts keep a nested CommonJS scope.
    const rootPackage = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
    const e2ePackage = JSON.parse(readFileSync(new URL('../e2e/package.json', import.meta.url), 'utf8'));

    expect(rootPackage.type).toBe('module');
    expect(e2ePackage.type).toBe('commonjs');
  });
});

function loginRequest(password: string, next = '/workspace?tab=one', address = '192.0.2.10'): Request {
  return new Request('https://bevalk.test/login', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'x-forwarded-for': `${address}, 10.0.0.1`
    },
    body: new URLSearchParams({ password, next })
  });
}

async function rateLimitKey(address: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(address));
  return `ip:${Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')}`;
}

describe('passwall session', () => {
  it('signs and verifies a valid team or owner session', async () => {
    const now = Date.UTC(2026, 9, 26, 12);
    const token = await signSession('team', SESSION_SECRET, now);
    await expect(verifySession(token, SESSION_SECRET, now)).resolves.toEqual({
      role: 'team',
      exp: Math.floor(now / 1000) + SESSION_MAX_AGE_SECONDS
    });
  });

  it('rejects a manipulated signature, expired session, and different secret', async () => {
    const now = Date.UTC(2026, 9, 26, 12);
    const token = await signSession('owner', SESSION_SECRET, now);
    const [payload, signature] = token.split('.');
    const replacement = signature[0] === 'A' ? 'B' : 'A';

    await expect(verifySession(`${payload}.${replacement}${signature.slice(1)}`, SESSION_SECRET, now)).resolves.toBeNull();
    await expect(verifySession(token, SESSION_SECRET, now + (SESSION_MAX_AGE_SECONDS + 1) * 1000)).resolves.toBeNull();
    await expect(verifySession(token, `${SESSION_SECRET}-rotated`, now)).resolves.toBeNull();
  });
});

describe('passwall redirects and public resources', () => {
  it('accepts only safe local next paths', () => {
    expect(safeNextPath('/flows?plan=premium')).toBe('/flows?plan=premium');
    expect(safeNextPath('/concept/review?flow=x')).toBe('/concept/review?flow=x');
    expect(safeNextPath('//evil.example')).toBe('/');
    expect(safeNextPath('https://evil.example')).toBe('/');
    expect(safeNextPath('')).toBe('/');
    expect(safeNextPath('/\\\\evil.example')).toBe('/');
  });

  it('allows only the login page and its enumerated resources without a session', () => {
    expect(isPublicLoginRequest('GET', '/login')).toBe(true);
    expect(isPublicLoginRequest('HEAD', '/login')).toBe(true);
    expect(isPublicLoginRequest('POST', '/login')).toBe(false);
    expect(isPublicLoginAsset('/assets/login-Abc123.js')).toBe(true);
    expect(isPublicLoginAsset('/assets/login-Abc123.css')).toBe(true);
    expect(isPublicLoginAsset('/assets/Guton-SemiBold-Abc123.woff2')).toBe(true);
    expect(isPublicLoginAsset('/assets/77effca3e02e95da2e7019fa1e4a6fea.png')).toBe(true);

    expect(isPublicLoginRequest('GET', '/')).toBe(false);
    expect(isPublicLoginRequest('GET', '/assets/index-Abc123.js')).toBe(false);
    expect(isPublicLoginRequest('GET', '/api/x')).toBe(false);
    expect(isPublicLoginRequest('GET', '/assets/react-vendor-Abc123.js')).toBe(false);
    expect(classifyRequest('GET', '/', false)).toBe('login-redirect');
    for (const pathname of ['/concept', '/concept/review', '/concept.html', '/concept-review.html', '/review.html']) {
      expect(classifyRequest('GET', pathname, false), pathname).toBe('login-redirect');
    }
    expect(classifyRequest('GET', '/assets/index-Abc123.js', false)).toBe('login-redirect');
    expect(classifyRequest('GET', '/api/x', false)).toBe('unauthorized-api');
    expect(classifyRequest('GET', '/', true)).toBe('next');
  });
});

describe('passwall rate limit', () => {
  it('blocks after 10 failures, resets on success, and expires after the window', async () => {
    const store = new MemoryRateLimitStore();
    const now = 10_000;

    for (let attempt = 0; attempt < RATE_LIMIT_MAX_FAILURES; attempt += 1) {
      await store.increment('ip:one', now);
    }
    await expect(isRateLimited(store, 'ip:one', now)).resolves.toBe(true);
    await store.clear('ip:one');
    await expect(isRateLimited(store, 'ip:one', now)).resolves.toBe(false);

    await store.increment('ip:one', now);
    await expect(isRateLimited(store, 'ip:one', now + RATE_LIMIT_WINDOW_MS)).resolves.toBe(false);
    await expect(isRateLimited(store, 'ip:two', now)).resolves.toBe(false);
  });

  it('clears the matching IP counter after a successful login', async () => {
    const store = new MemoryRateLimitStore();
    const now = 1_000_000;
    const key = await rateLimitKey('192.0.2.10');
    for (let attempt = 0; attempt < RATE_LIMIT_MAX_FAILURES - 1; attempt += 1) await store.increment(key, now);

    const response = await handleLoginPost(loginRequest(LOGIN_ENV.TEAM_PASSWORD), LOGIN_ENV, {
      store,
      now: () => now,
      delay: vi.fn(async () => undefined)
    });

    expect(response.status).toBe(303);
    await expect(isRateLimited(store, key, now)).resolves.toBe(false);
    await expect(store.get(key, now)).resolves.toBeNull();
  });
});

describe('Neon rate limit store table setup', () => {
  it('retries CREATE TABLE after the first attempt fails', async () => {
    let createAttempts = 0;
    const sql: NeonSqlClient = async strings => {
      if (strings.join('').includes('CREATE TABLE')) {
        createAttempts += 1;
        if (createAttempts === 1) throw new Error('temporary database error');
      }
      return [];
    };
    const store = createNeonRateLimitStore('postgres://simulated', sql);

    await expect(store.get('ip:test', 1_000)).rejects.toThrow('temporary database error');
    await expect(store.get('ip:test', 1_000)).resolves.toBeNull();
    expect(createAttempts).toBe(2);
  });
});

describe('passwall login POST', () => {
  it.each([
    { role: 'team' as const, password: LOGIN_ENV.TEAM_PASSWORD },
    { role: 'owner' as const, password: LOGIN_ENV.OWNER_PASSWORD }
  ])('accepts the $role password, sets a signed cookie, and redirects to next', async ({ role, password }) => {
    const store = new MemoryRateLimitStore();
    const response = await handleLoginPost(loginRequest(password), LOGIN_ENV, {
      store,
      now: () => 1_000_000,
      delay: vi.fn(async () => undefined)
    });

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/workspace?tab=one');
    const cookie = response.headers.get('set-cookie');
    expect(cookie).toContain('bvl_session=');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('Max-Age=2592000');
    const token = cookie?.match(/bvl_session=([^;]+)/)?.[1];
    await expect(verifySession(token, SESSION_SECRET, 1_000_000)).resolves.toMatchObject({ role });
  });

  it.each([
    { role: 'team' as const },
    { role: 'owner' as const }
  ])('rejects an incorrect password for the $role access path and applies the injected delay', async () => {
    const store = new MemoryRateLimitStore();
    const delay = vi.fn(async (_milliseconds: number) => undefined);
    const response = await handleLoginPost(loginRequest('incorrect'), LOGIN_ENV, {
      store,
      now: () => 1_000_000,
      delay
    });

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/login?error=1&next=%2Fworkspace%3Ftab%3Done');
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(delay).toHaveBeenCalledExactlyOnceWith(1500);
  });

  it('does not check the password after the IP limit has been reached', async () => {
    const store = new MemoryRateLimitStore();
    const now = 1_000_000;
    const key = await rateLimitKey('192.0.2.10');
    for (let attempt = 0; attempt < RATE_LIMIT_MAX_FAILURES; attempt += 1) await store.increment(key, now);
    const delay = vi.fn(async () => undefined);

    const response = await handleLoginPost(loginRequest(LOGIN_ENV.OWNER_PASSWORD), LOGIN_ENV, { store, now: () => now, delay });
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/login?error=rate&next=%2Fworkspace%3Ftab%3Done');
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(delay).not.toHaveBeenCalled();
  });

  it('returns a generic error when an environment value is missing', async () => {
    const response = await handleLoginPost(loginRequest('wrong'), { ...LOGIN_ENV, TEAM_PASSWORD: undefined }, {
      store: new MemoryRateLimitStore(),
      delay: vi.fn(async () => undefined)
    });
    expect(response.status).toBe(500);
    expect(await response.text()).toBe('Internal server error');
    expect(response.headers.get('location')).toBeNull();
  });
});
