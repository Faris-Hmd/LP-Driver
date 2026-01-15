import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export default async function middleware(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  // 1. Allow internal Next.js requests, static files, and public assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes("favicon.ico") ||
    pathname === "/login"
  ) {
    return NextResponse.next();
  }

  // 2. System Firewall: If no session exists, redirect to Login
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    // Optional: Store the intended destination to redirect back after login
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Authorized Session: Proceed to terminal
  return NextResponse.next();
}

// Manifest-style matcher (explicit path listing)
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (web manifest)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|manifest.webmanifest|icon-|apple-icon|login|/).*)",
  ],
};
