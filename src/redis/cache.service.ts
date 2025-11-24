// import redisClient from "./redis";
// class RedisCache {
//   async setJSON(key: string, value: any, ttlSeconds?: number) {
//     try {
//       await redisClient.json.set(key, "$", value);
//       if (ttlSeconds) await redisClient.expire(key, ttlSeconds);
//     } catch (err) {
//       console.error("Redis setJSON error:", err);
//     }
//   }

//   async setJSONWithExpireAt(key: string, value: any, timestamp: number) {
//     try {
//       await redisClient.json.set(key, "$", value);
//       await redisClient.expireAt(key, timestamp);
//     } catch (err) {
//       console.error("Redis setJSONWithExpireAt error:", err);
//     }
//   }

//   async getJSON(key: string) {
//     try {
//       return await redisClient.json.get(key);
//     } catch (err) {
//       console.error("Redis getJSON error:", err);
//       return null;
//     }
//   }

//   async del(key: string) {
//     try {
//       return await redisClient.del(key);
//     } catch (err) {
//       console.error("Redis del error:", err);
//       return null;
//     }
//   }
// }

// export default new RedisCache();
