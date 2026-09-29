const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20; // per window, per key

// In-memory, per-server-instance store. Fine for this app's current
// single-small-deployment scale; a production deployment running multiple
// instances would need a shared store (e.g. Redis) instead.
const hits = new Map<string, number[]>();

export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (hits.get(key) ?? []).filter(t => now - t < WINDOW_MS);
  timestamps.push(now);
  hits.set(key, timestamps);
  return timestamps.length > MAX_REQUESTS;
}
