
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/", "/register/mobile-verification"];

// Step order matches your actual stepper: Mobile → NID → Selfie → Basic Info → Nominee → Review → Submitted
const STEP_ORDER = [
  "mobile_verified",   
  "nid_verified",      
  "selfie_verified",   
  "basic_info_done",   
  "nominee_done",      
  "review_done",       
  "submitted",         
] as const;

// Each protected route requires the PREVIOUS step to be completed
const ROUTE_STEP_REQUIREMENT: Record<string, (typeof STEP_ORDER)[number]> = {
  "/register/nid-verification":     "mobile_verified",
  "/register/selfie":               "nid_verified",
  "/register/basic-informations":   "selfie_verified",
  "/register/nominee-bo":           "basic_info_done",
  "/register/review":               "nominee_done",
  "/register/submitted":            "review_done",
};

function getStepIndex(step: string | undefined): number {
  if (!step) return -1;
  return STEP_ORDER.indexOf(step as (typeof STEP_ORDER)[number]);
}

function getRouteForStep(step: string | undefined): string {
  const match = Object.entries(ROUTE_STEP_REQUIREMENT).find(
    ([, requiredStep]) => requiredStep === step,
  );
  return match?.[0] ?? "/register/mobile-verification";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionToken = request.cookies.get("next_auth_session")?.value;
  const regStep = request.cookies.get("reg_step")?.value;

  const isPublicRoute =
    PUBLIC_ROUTES.some((route) => pathname === route) ||
    pathname.startsWith("/_next");

  // ── Case A: Not logged in, trying to access a protected route ──
  if (!sessionToken && !isPublicRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // ── Case B: Logged in, trying to access root page ──
  if (sessionToken && pathname === "/") {
    return NextResponse.redirect(
      new URL(getRouteForStep(regStep), request.url),
    );
  }

  // ── Case C: Logged in, trying to access a registration step route ──
  const requiredStep = ROUTE_STEP_REQUIREMENT[pathname];
  if (sessionToken && requiredStep) {
    const requiredIndex = getStepIndex(requiredStep);
    const currentIndex = getStepIndex(regStep);

    // Block skipping ahead — must have completed the required prior step
    if (currentIndex < requiredIndex) {
      return NextResponse.redirect(
        new URL(getRouteForStep(regStep), request.url),
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|assets|favicon.ico).*)"],
};