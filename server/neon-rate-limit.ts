import { neon } from '@neondatabase/serverless';
import { RATE_LIMIT_WINDOW_MS, type RateLimitRecord, type RateLimitStore } from './rate-limit.js';

interface NeonRateLimitRow {
  hits: number;
  reset_at: Date | string;
}

export type NeonSqlClient = (
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<unknown[]>;

export function createNeonRateLimitStore(databaseUrl: string, sqlClient?: NeonSqlClient): RateLimitStore {
  const sql = sqlClient ?? neon(databaseUrl) as unknown as NeonSqlClient;
  let tableReady: Promise<void> | null = null;

  function ensureTable(): Promise<void> {
    if (tableReady) return tableReady;

    const pending = Promise.resolve()
      .then(() => sql`CREATE TABLE IF NOT EXISTS rate_limit (
        key text primary key,
        hits int not null,
        reset_at timestamptz not null
      )
      `)
      .then(() => undefined)
      .catch(error => {
        if (tableReady === pending) tableReady = null;
        throw error;
      });
    tableReady = pending;
    return pending;
  }

  return {
    async get(key: string, now: number): Promise<RateLimitRecord | null> {
      await ensureTable();
      const rows = await sql`
        SELECT hits, reset_at FROM rate_limit
        WHERE key = ${key} AND reset_at > ${new Date(now)}
        LIMIT 1
      ` as NeonRateLimitRow[];
      const row = rows[0];
      return row ? { hits: Number(row.hits), resetAt: new Date(row.reset_at).getTime() } : null;
    },

    async increment(key: string, now: number): Promise<RateLimitRecord> {
      await ensureTable();
      const resetAt = new Date(now + RATE_LIMIT_WINDOW_MS);
      const rows = await sql`
        INSERT INTO rate_limit (key, hits, reset_at)
        VALUES (${key}, 1, ${resetAt})
        ON CONFLICT (key) DO UPDATE SET
          hits = CASE WHEN rate_limit.reset_at <= ${new Date(now)} THEN 1 ELSE rate_limit.hits + 1 END,
          reset_at = CASE WHEN rate_limit.reset_at <= ${new Date(now)} THEN EXCLUDED.reset_at ELSE rate_limit.reset_at END
        RETURNING hits, reset_at
      ` as NeonRateLimitRow[];
      const row = rows[0];
      if (!row) throw new Error('Rate limit update returned no row.');
      return { hits: Number(row.hits), resetAt: new Date(row.reset_at).getTime() };
    },

    async clear(key: string): Promise<void> {
      await ensureTable();
      await sql`DELETE FROM rate_limit WHERE key = ${key}`;
    }
  };
}
