
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/", "/register/mobile-verification"];


const STEP_ORDER = [
  "phone_number_verified", 
  "nid_verified",      
  "selfie_verified",   
  "basic_info_done",   
  "nominee_done",      
  "review_done",       
  "submitted",         
] as const;


const ROUTE_STEP_REQUIREMENT: Record<string, (typeof STEP_ORDER)[number]> = {
  "/register/nid-verification":     "phone_number_verified",
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
  if (step === "phone_number_verified") return "/register/nid-verification";
  if (step === "nid_verified")           return "/register/selfie";
  if (step === "selfie_verified")        return "/register/basic-informations";
  if (step === "basic_info_done")        return "/register/nominee-bo";
  if (step === "nominee_done")           return "/register/review";
  if (step === "review_done" || step === "submitted") return "/register/submitted";
  
  return "/register/mobile-verification";
}

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
      const backendResponse = await fetch("http://localhost:5000/api/v1/auth/me", {
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
  if (sessionToken && pathname === "/") {
    const targetRoute = getRouteForStep(regStep);
    const response = NextResponse.redirect(new URL(targetRoute, request.url));
    

    if (regStep) {
      response.cookies.set("reg_step", regStep, { path: "/", sameSite: "strict" });
    }
    return response;
  }


  const requiredStep = ROUTE_STEP_REQUIREMENT[pathname];
  if (sessionToken && requiredStep) {
    const requiredIndex = getStepIndex(requiredStep);
    const currentIndex = getStepIndex(regStep);

    if (currentIndex < requiredIndex) {
      const fallbackRoute = getRouteForStep(regStep);
      const response = NextResponse.redirect(new URL(fallbackRoute, request.url));
      if (regStep) {
        response.cookies.set("reg_step", regStep, { path: "/", sameSite: "strict" });
      }
      return response;
    }
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