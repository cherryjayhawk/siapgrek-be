import { NextRequest, NextResponse } from "next/server";

// Routes that don't require authentication
const publicPaths = ["/login", "/register", "/forgot-password", "/terms"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes, static assets, API routes, and Next.js internals
  if (
    publicPaths.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/uploads/") ||
    pathname === "/favicon.ico" ||
    pathname === "/circleLogo.png"
  ) {
    return NextResponse.next();
  }

  // Check for Better Auth session cookie
  // const sessionToken =
  //   request.cookies.get("better-auth.session_token")?.value ||
  //   request.cookies.get("__Secure-better-auth.session_token")?.value;

  // if (!sessionToken) {
  //   // Redirect unauthenticated users to login
  //   const loginUrl = new URL("/login", request.url);
  //   loginUrl.searchParams.set("callbackUrl", pathname);
  //   return NextResponse.redirect(loginUrl);
  // }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, etc.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
