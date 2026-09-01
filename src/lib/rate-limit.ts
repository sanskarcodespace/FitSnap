export interface RateLimitOptions {
  windowMs: number
  max: number
}

interface RateLimitRecord {
  count: number
  resetTime: number
}

// In-memory store: IP -> Record
const store = new Map<string, RateLimitRecord>()

export function checkRateLimit(ip: string, options: RateLimitOptions): { success: boolean, retryAfter?: number } {
  const now = Date.now()
  const record = store.get(ip)

  if (!record) {
    store.set(ip, {
      count: 1,
      resetTime: now + options.windowMs,
    })
    return { success: true }
  }

  if (now > record.resetTime) {
    // Window expired, reset
    store.set(ip, {
      count: 1,
      resetTime: now + options.windowMs,
    })
    return { success: true }
  }

  // Inside the window
  record.count += 1
  if (record.count > options.max) {
    return { success: false, retryAfter: Math.ceil((record.resetTime - now) / 1000) }
  }

  return { success: true }
}

// Periodic cleanup of expired records to prevent memory leak
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of store.entries()) {
    if (now > value.resetTime) {
      store.delete(key)
    }
  }
}, 60 * 1000) // Cleanup every minute
