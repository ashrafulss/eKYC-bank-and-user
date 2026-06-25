"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LivenessSelfie from "./LivenessSelfie";
import type { AnalysisResult } from "./LivenessSelfie";
import { selfieApiService } from "@/app/services/selfie.service";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() ?? null;
  return null;
}

export default function Selfie() {
  const router = useRouter();
  const [isVerifiedCheck, setIsVerifiedCheck] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const currentStep = getCookie("reg_step");
    if (currentStep === "selfie_verified") {
      router.replace("/register/basic-informations");
    } else {
      setIsVerifiedCheck(false);
    }
  }, [router]);

  async function handleContinue() {
    try {
      setIsSubmitting(true);
      await selfieApiService.confirmSelfieStep();
      router.push("/register/basic-informations");
    } catch (err) {
      alert("Error confirming your step. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isVerifiedCheck === null || isSubmitting) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <LivenessSelfie
      onComplete={(res) => console.log("Result:", res)}
      onContinue={handleContinue}
    />
  );
}