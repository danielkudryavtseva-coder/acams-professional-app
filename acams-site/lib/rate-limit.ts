import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const WINDOW_LABEL = "10 m";
const WINDOW_MS = 10 * 60 * 1000;
const MAX = 10;

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const upstashLimiter = redis ? new Ratelimit({ redis, limiter: Ratelimit.fixedWindow(MAX, WINDOW_LABEL) }) : null;

const memoryBuckets = new Map<string, number[]>();

function consumeMemory(key: string): boolean {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const prev = memoryBuckets.get(key) ?? [];
  const next = prev.filter((t) => t >= windowStart);
  if (next.length >= MAX) {
    memoryBuckets.set(key, next);
    return false;
  }
  next.push(now);
  memoryBuckets.set(key, next);
  return true;
}

/**
 * Uses Upstash when UPSTASH_REDIS_REST_* is configured; otherwise in-memory buckets (dev/local).
 * TODO: replace in-memory tier with REDIS-backed shared limiter when scaling beyond single host.
 */
export async function consumeAuthRate(ip: string, bucket: "signup" | "signin" | "invite_accept"): Promise<boolean> {
  const key = `${bucket}:${ip}`;
  if (upstashLimiter) {
    const res = await upstashLimiter.limit(key);
    return res.success;
  }
  return consumeMemory(`mem:${key}`);
}
