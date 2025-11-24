import { createClient } from "redis";

export const redisClient = createClient({
  url: process.env.REDIS_URL,
});

let redisAvailable = false;

export async function initRedis() {
  redisClient.on("error", (err) => {
    console.error("🔴 Redis Error:", err);
    redisAvailable = false;
  });

  redisClient.on("connect", () => {
    console.log("🟢 Redis Connected");
    redisAvailable = true;
  });

  await redisClient.connect();
}

export function isRedisUp() {
  return redisAvailable;
}
