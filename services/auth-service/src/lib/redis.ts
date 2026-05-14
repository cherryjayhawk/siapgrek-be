import Redis from "ioredis";

// ------------------------------------
// Redis Client
// ------------------------------------

const redisUrl = process.env["REDIS_URL"] ?? "redis://localhost:6379";

export const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
});

redis.on("error", (err) => {
    console.error("[redis] Connection error:", err.message);
});

redis.on("connect", () => {
    console.log("[redis] Connected successfully");
});

// Ensure connection is established on startup
redis.connect().catch((err) => {
    console.error("[redis] Initial connect failed:", err.message);
});

// ------------------------------------
// Better Auth SecondaryStorage Adapter
// ------------------------------------
// Better Auth natively supports a `secondaryStorage` option that intercepts
// session reads, writes, and deletes. By providing this Redis adapter,
// Better Auth will automatically:
//   1. Cache sessions in Redis on creation/validation
//   2. Read sessions from Redis before hitting the database
//   3. Delete the cached session on logout / revocation
//
// This eliminates the need for custom middleware or manual cache invalidation.

export const redisSecondaryStorage = {
    async get(key: string): Promise<string | null> {
        try {
            return await redis.get(key);
        } catch (err) {
            console.error("[redis] secondaryStorage.get failed:", (err as Error).message);
            return null;
        }
    },

    async set(key: string, value: string, ttl?: number): Promise<void> {
        try {
            if (ttl && ttl > 0) {
                await redis.set(key, value, "EX", ttl);
            } else {
                await redis.set(key, value);
            }
        } catch (err) {
            console.error("[redis] secondaryStorage.set failed:", (err as Error).message);
        }
    },

    async delete(key: string): Promise<void> {
        try {
            await redis.del(key);
        } catch (err) {
            console.error("[redis] secondaryStorage.delete failed:", (err as Error).message);
        }
    },
};
