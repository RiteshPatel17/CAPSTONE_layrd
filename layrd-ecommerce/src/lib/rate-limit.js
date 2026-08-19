// ─────────────────────────────────────────────
// LÄYRD – rate-limit.js
// Simple in-memory rate limiter, per-IP.
// NOTE: resets on server restart / doesn't share state across serverless
// instances — good enough for this scale, revisit if traffic grows.
// ─────────────────────────────────────────────
const hits = new Map();

export function isRateLimited(key, { limit = 5, windowMs = 10 * 60 * 1000 } = {}) {
  const now = Date.now();
  const record = hits.get(key);

  if (!record || now - record.start > windowMs) {
    hits.set(key, { count: 1, start: now });
    return false;
  }

  record.count += 1;
  if (record.count > limit) return true;
  return false;
}