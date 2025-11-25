import { redisClient, isRedisUp } from "./redis.js";

class RedisCache {
  prefix = "app:";

  key(k: string) {
    return `${this.prefix}${k}`;
  }

  async set(key: string, value: any, ttl?: number) {
    if (!isRedisUp()) return;

    try {
      const serialized = typeof value === "string" ? value : JSON.stringify(value);
//  console.log("Redis SET:", this.key(key), serialized);
      if (ttl)
        await redisClient.set(this.key(key), serialized, { EX: ttl });
      else
        await redisClient.set(this.key(key), serialized);
    } catch (err) {
      console.error("Redis SET:", err);
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    if (!isRedisUp()) return null;

    try {
      const res = await redisClient.get(this.key(key));
      if (!res) return null;

      try {
        return JSON.parse(res);
      } catch {
        return res as T;
      }
    } catch (err) {
      console.error("Redis GET:", err);
      return null;
    }
  }

  async del(key: string) {
    if (!isRedisUp()) return;

    try {
      await redisClient.del(this.key(key));
    } catch (err) {
      console.error("Redis DEL:", err);
    }
  }
}

export const redisCacheService = new RedisCache();
