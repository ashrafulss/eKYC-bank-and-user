// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 1. Define paths that do NOT require a session token (Public Whitelist)
const PUBLIC_ROUTES = ["/", "/register/mobile-verification"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 2. Retrieve the session token from HTTP-only cookies
  // Production security standard: Always use HTTP-only cookies instead of localStorage for sessions
  const sessionToken = request.cookies.get("next_auth_session")?.value;

  // 3. Check if the current requested route is in the public whitelist
  const isPublicRoute =
    PUBLIC_ROUTES.some((route) => pathname === route) ||
    pathname.startsWith("/_next");

  // Case A: User is unauthenticated and attempting to access a secured screen
  if (!sessionToken && !isPublicRoute) {
    // Redirect them directly to the portal login view
    const loginUrl = new URL("/login", request.url);
    // Optional: Append a redirect back param so they return to their requested page after logging in
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Case B: User is already logged in, but trying to hit guest pages like login or signup again
  if (sessionToken && (pathname === "/" || pathname === "/login")) {
    // Direct them away from signup back to their active workflow context
    return NextResponse.redirect(
      new URL("/register/nid-verification", request.url),
    );
  }

  // Allow the request to transition naturally
  return NextResponse.next();
}

// 4. Matcher configuration: Tells Next.js to run middleware on all routes except static assets
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (handled by backend token verifications)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - images/assets inside public folder
     */
    "/((?!api|_next/static|_next/image|assets|favicon.ico).*)",
  ],
};
