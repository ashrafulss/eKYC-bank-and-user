"use client";

import { usePathname } from "next/navigation";
import Header from "../components/Header";
import { useEffect, useState } from "react";

function AnimatedLine({ done, delay, isLast }: { done: boolean; delay: number; isLast: boolean }) {
  const [triggered, setTriggered] = useState(false);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTriggered(true), 100);
    return () => clearTimeout(t);
  }, []);

  if (!done) {
    return <div className="flex-1 h-0.5 mx-1 mt-4 bg-gray-200 rounded-full" />;
  }

  if (settled && !isLast) {
    return <div className="flex-1 h-0.5 mx-1 mt-4 bg-green-500 rounded-full" />;
  }

  return (
    <>
      <style>{`
        @keyframes snake-draw {
          0%   { stroke-dashoffset: 300; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes snake-wiggle {
          0%, 100% { d: path("M0,4 Q25,0 50,4 Q75,8 100,4 Q125,0 150,4 Q175,8 200,4 Q225,0 250,4 Q275,8 300,4"); }
          50%       { d: path("M0,4 Q25,8 50,4 Q75,0 100,4 Q125,8 150,4 Q175,0 200,4 Q225,8 250,4 Q275,0 300,4"); }
        }
      `}</style>

      <div className="flex-1 mx-1 mt-3 overflow-visible" style={{ height: "8px" }}>
        <svg
          width="100%"
          height="8"
          viewBox="0 0 300 8"
          preserveAspectRatio="none"
          overflow="visible"
        >
          <path
            d="M0,4 Q25,0 50,4 Q75,8 100,4 Q125,0 150,4 Q175,8 200,4 Q225,0 250,4 Q275,8 300,4"
            fill="none"
            stroke="#22c55e"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="300"
            strokeDashoffset="300"
            onAnimationEnd={() => {
              if (!isLast) setSettled(true);
            }}
            style={
              triggered
                ? isLast
                  ? {
                      // draw once, then wiggle forever
                      animation: `
                        snake-draw   800ms ease-in-out ${delay}ms 1 forwards,
                        snake-wiggle 400ms ease-in-out ${delay + 800}ms infinite
                      `,
                    }
                  : {
                      // draw once, wiggle 3 times, then settle
                      animation: `
                        snake-draw   800ms ease-in-out ${delay}ms 1 forwards,
                        snake-wiggle 300ms ease-in-out ${delay}ms 3
                      `,
                    }
                : {}
            }
          />
        </svg>
      </div>
    </>
  );
}


export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const routeMap: Record<string, number> = {
    "mobile-verification": 1,
    "nid-verification": 2,
    selfie: 3,
    "basic-informations": 4,
    "nominee-bo": 5,
    review: 6,
    // submitted: 7,
  };

  const currentRouteName = pathname.split("/register/")[1]?.split("/")[0] || "";
  const currentStep = routeMap[currentRouteName] || 1;
  const showNavbar = currentStep > 1;

  const steps = [
    { num: 1, title: "Mobile",     subtitle: "OTP verification" },
    { num: 2, title: "NID",        subtitle: "Capture & OCR" },
    { num: 3, title: "Selfie",     subtitle: "Liveness check" },
    { num: 4, title: "Basic Info", subtitle: "Personal details" },
    { num: 5, title: "Nominee",    subtitle: "Beneficiary setup" },
    { num: 6, title: "Review",     subtitle: "Confirm details" },
    // { num: 7, title: "Submitted",  subtitle: "Complete" },
  ];

  const completionPct = Math.round(((currentStep - 1) / 6) * 100);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-50">

      {showNavbar && <Header completionPct={completionPct} />}

      <div className="bg-white border-b border-gray-100 shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex justify-between gap-2 md:gap-4">
            {steps.map((step) => {
              const done = step.num < currentStep;
              const active = step.num === currentStep;

              return (
                <div key={step.num} className="flex-1">
                  <div className="flex items-start">

                    <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                      done
                        ? "bg-green-600 text-white"
                        : active
                          ? "bg-blue-900 text-white ring-4 ring-blue-100"
                          : "bg-gray-100 text-gray-400"
                    }`}>
                      {done ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : step.num}
                    </div>

                    {step.num < 6 && (
                      <AnimatedLine
                        done={done}
                        delay={(step.num - 1) * 200}
                        isLast={step.num === currentStep - 1}
                      />
                    )}

                  </div>

                  <div className="mt-2 hidden md:block">
                    <p className={`text-xs font-semibold ${
                      active ? "text-blue-900" : done ? "text-green-700" : "text-gray-400"
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-400">{step.subtitle}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full">
        <div className="max-w-6xl mx-auto w-full">{children}</div>
      </div>
    </div>
  );
}