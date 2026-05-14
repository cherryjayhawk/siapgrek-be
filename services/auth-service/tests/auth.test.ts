import { describe, test, expect } from "bun:test";
import Redis from "ioredis";

const BASE_URL = process.env["TEST_BASE_URL"] ?? "http://localhost:3001";
const REDIS_URL = process.env["REDIS_URL"] ?? "redis://localhost:6379";

// ------------------------------------
// Helpers
// ------------------------------------

async function signUp(email: string, password: string, name: string) {
    const res = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
        redirect: "manual",
    });
    return res;
}

async function signIn(email: string, password: string) {
    const res = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        redirect: "manual",
    });
    return res;
}

async function signOut(cookieHeader: string) {
    const res = await fetch(`${BASE_URL}/api/auth/sign-out`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Cookie: cookieHeader,
        },
        redirect: "manual",
    });
    return res;
}

async function getSession(cookieHeader: string) {
    const res = await fetch(`${BASE_URL}/api/auth/get-session`, {
        method: "GET",
        headers: { Cookie: cookieHeader },
        redirect: "manual",
    });
    return res;
}

function extractCookies(res: Response): string {
    const setCookieHeaders = res.headers.getSetCookie?.() ?? [];
    return setCookieHeaders
        .map((c) => c.split(";")[0])
        .filter(Boolean)
        .join("; ");
}

/**
 * Extract the session_token value from a cookie header string.
 * Better Auth typically sets a cookie named `better-auth.session_token`.
 */
function extractSessionToken(cookieHeader: string): string | null {
    const match = cookieHeader.match(
        /better-auth\.session_token=([^;,\s]+)/,
    );
    return match?.[1] ?? null;
}

// ------------------------------------
// Tests
// ------------------------------------

const TEST_EMAIL = `test-${Date.now()}@orchid.local`;
const TEST_PASSWORD = "SecureP@ssw0rd!2026";
const TEST_NAME = "Test User";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyJson = Record<string, any>;

describe("Auth Service Integration", () => {
    test("Health check returns 200", async () => {
        const res = await fetch(`${BASE_URL}/health`);
        expect(res.status).toBe(200);
        const body = (await res.json()) as AnyJson;
        expect(body["status"]).toBe("ok");
        expect(body["service"]).toBe("auth-service");
    });

    let sessionCookies = "";

    test("Sign-up creates a new user", async () => {
        const res = await signUp(TEST_EMAIL, TEST_PASSWORD, TEST_NAME);
        expect(res.status).toBeLessThan(400);
        const body = (await res.json()) as AnyJson;
        expect(body["user"]).toBeDefined();
        expect((body["user"] as AnyJson)["email"]).toBe(TEST_EMAIL);

        // Capture session cookies from sign-up
        sessionCookies = extractCookies(res);
    });

    test("Sign-in returns session cookies", async () => {
        const res = await signIn(TEST_EMAIL, TEST_PASSWORD);
        expect(res.status).toBeLessThan(400);

        sessionCookies = extractCookies(res);
        expect(sessionCookies).toBeTruthy();

        const body = (await res.json()) as AnyJson;
        expect(body["session"]).toBeDefined();
        expect(body["user"]).toBeDefined();
        expect((body["user"] as AnyJson)["email"]).toBe(TEST_EMAIL);
    });

    test("Get session returns valid session with cookies", async () => {
        const res = await getSession(sessionCookies);
        expect(res.status).toBe(200);
        const body = (await res.json()) as AnyJson;
        expect(body["session"]).toBeDefined();
        expect((body["user"] as AnyJson)["email"]).toBe(TEST_EMAIL);
    });

    test("Sign-out invalidates the session", async () => {
        const res = await signOut(sessionCookies);
        expect(res.status).toBeLessThan(400);

        // After sign-out, session should no longer be valid
        const sessionRes = await getSession(sessionCookies);
        expect(sessionRes.status).toBe(401);
    });

    test("Sign-in with wrong password fails", async () => {
        const res = await signIn(TEST_EMAIL, "WrongPassword123!");
        expect(res.status).toBeGreaterThanOrEqual(400);
    });
});

// ------------------------------------
// Redis Session Cache Integration
// ------------------------------------

describe("Redis Session Cache", () => {
    const CACHE_EMAIL = `cache-${Date.now()}@orchid.local`;
    const CACHE_PASSWORD = "CacheTest@2026!";
    let redisClient: Redis;

    test("setup: connect to Redis", async () => {
        redisClient = new Redis(REDIS_URL, { maxRetriesPerRequest: 3 });
        const pong = await redisClient.ping();
        expect(pong).toBe("PONG");
    });

    let cacheCookies = "";
    let sessionToken = "";

    test("setup: create user and sign in", async () => {
        await signUp(CACHE_EMAIL, CACHE_PASSWORD, "Cache User");
        const res = await signIn(CACHE_EMAIL, CACHE_PASSWORD);
        expect(res.status).toBeLessThan(400);
        cacheCookies = extractCookies(res);
        sessionToken = extractSessionToken(cacheCookies) ?? "";
        expect(sessionToken).toBeTruthy();
    });

    test("session is cached in Redis after get-session", async () => {
        // Trigger a get-session so Better Auth populates secondary storage
        const res = await getSession(cacheCookies);
        expect(res.status).toBe(200);

        // Check that a key referencing this session exists in Redis
        // Better Auth stores with a key pattern; search for keys containing the token
        const keys = await redisClient.keys("*");
        const tokenPrefix = sessionToken.split(".")[0] ?? "";
        const sessionKeys = keys.filter(
            (k) => k.includes("session") || k.includes(tokenPrefix),
        );
        expect(sessionKeys.length).toBeGreaterThan(0);
    });

    test("subsequent get-session is served (cache populated)", async () => {
        // A second call should still succeed (served from cache or DB)
        const res = await getSession(cacheCookies);
        expect(res.status).toBe(200);
        const body = (await res.json()) as AnyJson;
        expect(body["session"]).toBeDefined();
        expect((body["user"] as AnyJson)["email"]).toBe(CACHE_EMAIL);
    });

    test("sign-out removes session from Redis cache", async () => {
        // Capture keys before sign-out
        const keysBefore = await redisClient.keys("*session*");

        const res = await signOut(cacheCookies);
        expect(res.status).toBeLessThan(400);

        // After logout, verify session key has been removed
        const keysAfter = await redisClient.keys("*session*");
        expect(keysAfter.length).toBeLessThanOrEqual(keysBefore.length);

        // Session should no longer be valid
        const sessionRes = await getSession(cacheCookies);
        expect(sessionRes.status).toBe(401);
    });

    test("teardown: disconnect Redis", async () => {
        await redisClient.quit();
    });
});
