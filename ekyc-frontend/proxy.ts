import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/", "/register/mobile-verification"];

// Every verified state maps strictly to exactly ONE route that the user is allowed to be on
const STEP_ROUTE_MAP: Record<string, string> = {
  "phone_number_verified": "/register/nid-verification",
  "nid_verified":           "/register/selfie",
  "selfie_verified":        "/register/basic-informations",
  "basic_info_done":        "/register/nominee",
  "nominee_done":           "/register/review",
  "review_done":            "/register/submitted",
  "submitted":              "/profile", 
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionToken = request.cookies.get("next_auth_session")?.value;
  
  const isPublicRoute =
    PUBLIC_ROUTES.some((route) => pathname === route) ||
    pathname.startsWith("/_next");

  if (!sessionToken && !isPublicRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  let regStep: string | undefined = undefined;

  if (sessionToken) {
    try {
      const backendResponse = await fetch("http://ekyc_backend_api:5000/api/v1/auth/me", {
        headers: {
          "Authorization": `Bearer ${sessionToken}`,
          "Cookie": `next_auth_session=${sessionToken}`
        },
        cache: 'no-store'
      });

      if (backendResponse.ok) {
        const result = await backendResponse.json();
        regStep = result.data?.user?.current_step;
      }
    } catch (error) {
      console.error("❌ Proxy verification connection failed:", error);
    }
  }

  if (!regStep) {
    regStep = request.cookies.get("reg_step")?.value;
  }

  // Determine the single allowed route for the current step state status
  const currentAllowedRoute = STEP_ROUTE_MAP[regStep || ""] || "/register/mobile-verification";

  // 🌟 CRITICAL ENFORCEMENT: Enforce strict synchronization locks on all /register paths
  if (sessionToken && pathname.startsWith("/register")) {
    if (pathname !== currentAllowedRoute) {
      console.warn(`🔒 Route block active: Redirecting from ${pathname} to authorized route: ${currentAllowedRoute}`);
      const response = NextResponse.redirect(new URL(currentAllowedRoute, request.url));
      if (regStep) {
        response.cookies.set("reg_step", regStep, { path: "/", sameSite: "strict" });
      }
      return response;
    }
  }

  // Handle root route redirection
  if (sessionToken && pathname === "/") {
    const response = NextResponse.redirect(new URL(currentAllowedRoute, request.url));
    if (regStep) {
      response.cookies.set("reg_step", regStep, { path: "/", sameSite: "strict" });
    }
    return response;
  }

  const finalResponse = NextResponse.next();
  if (sessionToken && regStep) {
    finalResponse.cookies.set("reg_step", regStep, { path: "/", sameSite: "strict" });
  }
  return finalResponse;
}

export default proxy;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|assets|favicon.ico).*)"],
};