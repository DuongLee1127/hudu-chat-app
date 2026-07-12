const buckets = new Map<string, number[]>();

// Simple in-memory sliding-window limiter for socket.io events (single-instance use).
export const isRateLimited = (key: string, windowMs: number, max: number) => {
  const now = Date.now();
  const timestamps = (buckets.get(key) || []).filter((t) => now - t < windowMs);

  if (timestamps.length >= max) {
    buckets.set(key, timestamps);
    return true;
  }

  timestamps.push(now);
  buckets.set(key, timestamps);
  return false;
};
