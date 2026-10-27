export const RATE_LIMIT_MAX_FAILURES = 10;
export const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
// ponytail: Hobby has no WAF rules; this application limit is 10 failed attempts per 10 minutes.

export interface RateLimitRecord {
  hits: number;
  resetAt: number;
}

export interface RateLimitStore {
  get(key: string, now: number): Promise<RateLimitRecord | null>;
  increment(key: string, now: number): Promise<RateLimitRecord>;
  clear(key: string): Promise<void>;
}

export class MemoryRateLimitStore implements RateLimitStore {
  private readonly records = new Map<string, RateLimitRecord>();

  async get(key: string, now: number): Promise<RateLimitRecord | null> {
    const record = this.records.get(key);
    if (!record || record.resetAt <= now) {
      this.records.delete(key);
      return null;
    }
    return { ...record };
  }

  async increment(key: string, now: number): Promise<RateLimitRecord> {
    const record = await this.get(key, now);
    const next = record
      ? { hits: record.hits + 1, resetAt: record.resetAt }
      : { hits: 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
    this.records.set(key, next);
    return { ...next };
  }

  async clear(key: string): Promise<void> {
    this.records.delete(key);
  }
}

export async function isRateLimited(store: RateLimitStore, key: string, now: number): Promise<boolean> {
  const record = await store.get(key, now);
  return record !== null && record.hits >= RATE_LIMIT_MAX_FAILURES;
}
