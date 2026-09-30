import 'server-only';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

type Bucket = 'order' | 'event' | 'quote' | 'health' | 'export' | 'webhook';

const LIMITS: Record<Bucket, { tokens: number; window: `${number} ${'s' | 'm' | 'h'}`; windowMs: number }> = {
  order: { tokens: 5, window: '10 m', windowMs: 10 * 60_000 },
  event: { tokens: 3, window: '1 h', windowMs: 60 * 60_000 },
  quote: { tokens: 60, window: '1 m', windowMs: 60_000 },
  // Uptime monitors ping every few minutes; this only stops floods.
  health: { tokens: 30, window: '1 m', windowMs: 60_000 },
  // Google Sheets sync (every 10 minutes per sheet) plus manual refreshes.
  export: { tokens: 60, window: '1 h', windowMs: 60 * 60_000 },
  // Signed/secret webhooks from Sanity and Morning; generous, but bounded.
  webhook: { tokens: 120, window: '1 m', windowMs: 60_000 },
};

const redisConfigured = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const redis = redisConfigured ? Redis.fromEnv() : null;

const limiters = new Map<Bucket, Ratelimit>();

function getLimiter(bucket: Bucket): Ratelimit | null {
  if (!redis) return null;
  let limiter = limiters.get(bucket);
  if (!limiter) {
    const { tokens, window } = LIMITS[bucket];
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(tokens, window),
      prefix: `tene:rl:${bucket}`,
      analytics: false,
    });
    limiters.set(bucket, limiter);
  }
  return limiter;
}

// Per-instance fallback so the site stays protected (best effort) before Upstash is configured.
const memory = new Map<string, number[]>();

function memoryLimit(bucket: Bucket, key: string): boolean {
  const { tokens, windowMs } = LIMITS[bucket];
  const now = Date.now();
  const id = `${bucket}:${key}`;
  const hits = (memory.get(id) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= tokens) {
    memory.set(id, hits);
    return false;
  }
  hits.push(now);
  memory.set(id, hits);
  if (memory.size > 5000) {
    for (const [k, v] of memory) if (v.every((t) => now - t >= windowMs)) memory.delete(k);
  }
  return true;
}

let warned = false;

export async function checkRateLimit(bucket: Bucket, key: string): Promise<boolean> {
  const limiter = getLimiter(bucket);
  if (!limiter) {
    if (!warned && process.env.NODE_ENV === 'production') {
      console.warn('[rate-limit] Upstash is not configured; using in-memory fallback');
      warned = true;
    }
    return memoryLimit(bucket, key);
  }
  try {
    const { success } = await limiter.limit(key);
    return success;
  } catch (error) {
    console.error('[rate-limit] Upstash error, falling back to memory', error);
    return memoryLimit(bucket, key);
  }
}
