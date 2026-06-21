"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

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
  "/register/nid-verification": "phone_number_verified",
  "/register/selfie": "nid_verified",
  "/register/basic-informations": "selfie_verified",
  "/register/nominee-bo": "basic_info_done",
  "/register/review": "nominee_done",
  "/register/submitted": "review_done",
};

function getStepIndex(step: string | null): number {
  if (!step) return -1;
  return STEP_ORDER.indexOf(step as any);
}

function getRouteForStep(step: string | null): string {
  if (step === "phone_number_verified") return "/register/nid-verification";
  if (step === "nid_verified") return "/register/selfie";
  if (step === "selfie_verified") return "/register/basic-informations";
  if (step === "basic_info_done") return "/register/nominee-bo";
  if (step === "nominee_done") return "/register/review";
  if (step === "review_done" || step === "submitted") return "/register/submitted";

  return "/register/mobile-verification";
}

export function WithAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {

    const sessionToken = localStorage.getItem("next_auth_session");
    const regStep = localStorage.getItem("reg_step");

    const isPublicRoute = ["/", "/register/mobile-verification"].includes(pathname);

    // Case 1: No token, trying to access a protected onboarding form
    if (!sessionToken && !isPublicRoute) {
      router.replace("/");
      return;
    }

    // Case 2: Logged in user visiting the landing page -> push them to their current step
    if (sessionToken && pathname === "/") {
      const targetRoute = getRouteForStep(regStep);
      router.replace(targetRoute);
      return;
    }

    // Case 3: Step dependency configuration tracking check
    const requiredStep = ROUTE_STEP_REQUIREMENT[pathname];
    if (sessionToken && requiredStep) {
      const requiredIndex = getStepIndex(requiredStep);
      const currentIndex = getStepIndex(regStep);

      // If they try manually changing URL paths ahead of completion status, drop them back
      if (currentIndex < requiredIndex) {
        const fallbackRoute = getRouteForStep(regStep);
        router.replace(fallbackRoute);
        return;
      }
    }

    // All checks passed safely
    setIsVerified(true);
  }, [pathname, router]);

  // Render a clean empty shell or spinner while localStorage values are being analyzed
  if (!isVerified && !["/", "/register/mobile-verification"].includes(pathname)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white">
        <p className="text-gray-500 font-medium">Verifying registration stage...</p>
      </div>
    );
  }

  return <>{children}</>;
}