import { betterAuth } from "better-auth";
import { pool } from "./db";
import { redisSecondaryStorage } from "./lib/redis";

export const auth = betterAuth({
    database: pool,
    emailAndPassword: {
        enabled: true,
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24,     // update session age every 24 hours
        storeSessionInDatabase: true, // keep DB as source of truth
    },
    secondaryStorage: redisSecondaryStorage,
    trustedOrigins: process.env["TRUSTED_ORIGINS"]
        ? process.env["TRUSTED_ORIGINS"].split(",")
        : ["http://localhost:3000"],
});
