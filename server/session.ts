export type SessionRole = 'team' | 'owner';

export interface Session {
  role: SessionRole;
  exp: number;
}

export const SESSION_COOKIE = 'bvl_session';
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

const encoder = new TextEncoder();

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64Url(value: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null;
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(normalized + '='.repeat((4 - (normalized.length % 4)) % 4));
    return Uint8Array.from(binary, character => character.charCodeAt(0));
  } catch {
    return null;
  }
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return copy;
}

async function hmacKey(secret: string, usage: KeyUsage[]): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    usage
  );
}

export async function signSession(
  role: SessionRole,
  secret: string,
  now = Date.now()
): Promise<string> {
  if (!secret) throw new Error('A session secret is required.');
  const payload = encodeBase64Url(encoder.encode(JSON.stringify({
    role,
    exp: Math.floor(now / 1000) + SESSION_MAX_AGE_SECONDS
  } satisfies Session)));
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(secret, ['sign']), encoder.encode(payload));
  return `${payload}.${encodeBase64Url(new Uint8Array(signature))}`;
}

export async function verifySession(
  token: string | null | undefined,
  secret: string,
  now = Date.now()
): Promise<Session | null> {
  if (!token || !secret) return null;
  const separator = token.indexOf('.');
  if (separator <= 0 || separator !== token.lastIndexOf('.')) return null;
  const payloadPart = token.slice(0, separator);
  const signature = decodeBase64Url(token.slice(separator + 1));
  if (!signature) return null;
  const payloadBytes = decodeBase64Url(payloadPart);
  if (!payloadBytes) return null;

  try {
    const valid = await crypto.subtle.verify(
      'HMAC',
      await hmacKey(secret, ['verify']),
      toArrayBuffer(signature),
      encoder.encode(payloadPart)
    );
    if (!valid) return null;
    const parsed: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(payloadBytes));
    if (!parsed || typeof parsed !== 'object') return null;
    const candidate = parsed as Partial<Session>;
    if (candidate.role !== 'team' && candidate.role !== 'owner') return null;
    if (!Number.isSafeInteger(candidate.exp) || (candidate.exp as number) <= Math.floor(now / 1000)) return null;
    return { role: candidate.role, exp: candidate.exp as number };
  } catch {
    return null;
  }
}

export function sessionCookie(token: string): string {
  return `${SESSION_COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}`;
}

export async function constantTimeTextEqual(left: string, right: string): Promise<boolean> {
  const [leftDigest, rightDigest] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(left)),
    crypto.subtle.digest('SHA-256', encoder.encode(right))
  ]);
  const leftBytes = new Uint8Array(leftDigest);
  const rightBytes = new Uint8Array(rightDigest);
  let difference = 0;
  for (let index = 0; index < leftBytes.length; index += 1) {
    difference |= leftBytes[index] ^ rightBytes[index];
  }
  return difference === 0;
}
