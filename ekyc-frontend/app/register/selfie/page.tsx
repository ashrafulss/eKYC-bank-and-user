"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import LivenessSelfie from "./LivenessSelfie";

export default function Selfie() {
  const router = useRouter();

  return (
    <LivenessSelfie
      onComplete={(result) => console.log(result)}
      onContinue={() => router.push("/register/basic-informations")}
    />
  );
}
