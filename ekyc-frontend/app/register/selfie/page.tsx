"use client";

import { useRouter } from "next/navigation";
import LivenessSelfie from "./LivenessSelfie";
import type { AnalysisResult } from "./LivenessSelfie";

export default function Selfie() {
  const router = useRouter();

  function handleComplete(result: AnalysisResult) {
    console.log("Selfie result:", result);
    // overallPass check is inside LivenessSelfie — Continue button only shows on pass
  }

  return (
    <LivenessSelfie
      onComplete={handleComplete}
      onContinue={() => router.push("/register/basic-informations")}
    />
  );
}