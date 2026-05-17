import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis/cloudflare";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const hasRedis = Boolean(redisUrl && redisToken);

function createRedis() {
  if (!hasRedis) return null;
  return new Redis({
    url: redisUrl!,
    token: redisToken!,
  });
}

const redis = createRedis();

/** Auth routes: 5 attempts per 15 min per IP (login, signup, forgot-password) */
export const authRatelimit =
  redis &&
  new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "15 m"),
    prefix: "rl:auth",
  });

/** API routes: 100 requests per min per IP */
export const apiRatelimit =
  redis &&
  new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "1 m"),
    prefix: "rl:api",
  });

export function isRateLimitEnabled(): boolean {
  return hasRedis;
}
