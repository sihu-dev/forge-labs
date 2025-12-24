/**
 * Rate Limiting
 * Simple in-memory rate limiter using sliding window
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.MCP_RATE_LIMIT_PER_MINUTE || '60', 10);

export async function checkRateLimit(type: string, identifier: string): Promise<boolean> {
  const key = `${type}:${identifier}`;
  const now = Date.now();

  const entry = rateLimitStore.get(key);

  if (!entry) {
    // First request
    rateLimitStore.set(key, {
      count: 1,
      windowStart: now,
    });
    return true;
  }

  // Check if we're in a new window
  if (now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
    // Reset window
    entry.count = 1;
    entry.windowStart = now;
    return true;
  }

  // Increment counter
  entry.count++;

  // Check if limit exceeded
  if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
    console.error(`[RateLimit] Limit exceeded for ${key}: ${entry.count}/${RATE_LIMIT_MAX_REQUESTS}`);
    return false;
  }

  return true;
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  const keysToDelete: string[] = [];

  rateLimitStore.forEach((entry, key) => {
    if (now - entry.windowStart >= RATE_LIMIT_WINDOW_MS * 2) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach((key) => rateLimitStore.delete(key));

  if (keysToDelete.length > 0) {
    console.error(`[RateLimit] Cleaned up ${keysToDelete.length} expired entries`);
  }
}, 5 * 60 * 1000);
