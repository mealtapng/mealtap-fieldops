/**
 * In-memory rate limiter backed by a plain Map.
 *
 * LIMITATIONS — read before deploying:
 *  - State resets on every server restart (dev: restart `npm run dev` to clear).
 *  - Does NOT share state across multiple server instances (e.g. multiple
 *    Vercel workers or lambda cold-starts). Each instance has its own counter.
 *  - For pre-launch with a small number of agents on a single Vercel instance,
 *    this is sufficient.
 *  - For production scale (multiple instances), replace with Upstash Redis +
 *    @upstash/ratelimit.
 */

interface Entry {
  count: number
  resetAt: number  // ms since epoch
}

const store = new Map<string, Entry>()

// Prune expired entries once per minute to prevent unbounded memory growth.
setInterval(() => {
  const now = Date.now()
  store.forEach((entry, key) => {
    if (now > entry.resetAt) store.delete(key)
  })
}, 60_000)

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number  // Unix timestamp in seconds (for X-RateLimit-Reset header)
}

/**
 * Check whether `identifier` is within its rate limit budget.
 *
 * @param identifier - Typically the client IP address.
 * @param limit      - Maximum number of requests allowed per window.
 * @param windowMs   - Window duration in milliseconds.
 */
export function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now()
  const entry = store.get(identifier)

  if (!entry || now > entry.resetAt) {
    // First request in a fresh window.
    store.set(identifier, { count: 1, resetAt: now + windowMs })
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: Math.ceil((now + windowMs) / 1000),
    }
  }

  entry.count += 1
  const remaining = Math.max(0, limit - entry.count)
  return {
    allowed: entry.count <= limit,
    remaining,
    resetAt: Math.ceil(entry.resetAt / 1000),
  }
}
