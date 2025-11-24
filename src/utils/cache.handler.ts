// // backend/src/utils/cache.handler.ts
// import { Request, Response } from 'express';
// import RedisCache from '../redis/cache.service';

// const TTL = 86400; // 24 hours

// export const asyncHandlerWithCache = (key: string, handler: () => Promise<any>) => {
//     return async (_req: Request, res: Response) => {
//         try {
//             const cachedData = await RedisCache.getJSON(key);
//             if (cachedData) {
//                 console.log(`🔥 Redis Cache Hit for: ${key}`);
//                 return res.json(cachedData);
//             }

//             console.log(`❌ Redis Cache Miss for: ${key} → Fetching from DB`);
//             const data = await handler();

//             await RedisCache.setJSON(key, data, TTL);
//             return res.json(data);
//         } catch (error) {
//             console.error(`Error in cached handler for ${key}:`, error);
//             res.status(500).json({ error: 'Internal Server Error' });
//         }
//     };
// };
