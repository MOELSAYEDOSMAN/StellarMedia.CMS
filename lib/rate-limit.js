/**
 * In-memory rate limiting.
 *
 * Good enough for a single-instance deployment (which is what this site is).
 * If it ever runs on multiple instances, move the buckets to Redis.
 */
const buckets = () => (globalThis.__stellarBuckets ??= new Map());

/**
 * @param {string} key
 * @param {{ limit: number, windowMs: number }} options
 * @returns {{ ok: boolean, remaining: number, retryAfter: number }}
 */
export function rateLimit(key, { limit, windowMs }) {
  const store = buckets();
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  // Opportunistic cleanup so the map cannot grow forever.
  if (store.size > 5000) {
    for (const [bucketKey, value] of store) {
      if (value.resetAt <= now) store.delete(bucketKey);
    }
  }

  return { ok: true, remaining: limit - bucket.count, retryAfter: 0 };
}

export function resetRateLimit(key) {
  buckets().delete(key);
}
