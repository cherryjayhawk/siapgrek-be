import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // During SSR/build, a relative URL is not valid, so we provide a full base URL.
  // At runtime in the browser, the rewrite in next.config.ts proxies
  // /api/auth/* → http://localhost:3001/api/auth/*
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

export const { signIn, signUp, signOut, useSession, updateUser } = authClient;
