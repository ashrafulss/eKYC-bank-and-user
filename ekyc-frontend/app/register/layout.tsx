"use client";

import { usePathname } from "next/navigation";
import Header from "../components/Header";

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();


  const routeMap: Record<string, number> = {
    "mobile-verification": 1,
    "nid-verification": 2,
    selfie: 3,
    "basic-informations": 4,
    "nominee-bo": 5,
    review: 6,
    submitted: 7,
  };

  const currentRouteName = pathname.split("/register/")[1]?.split("/")[0] || "";
  const currentStep = routeMap[currentRouteName] || 1;


  const showNavbar = currentStep > 1;

  const steps = [
    { num: 1, title: "Mobile", subtitle: "OTP verification" },
    { num: 2, title: "NID", subtitle: "Capture & OCR" },
    { num: 3, title: "Selfie", subtitle: "Liveness check" },
    { num: 4, title: "Basic Info", subtitle: "Personal details" },
    { num: 5, title: "Nominee", subtitle: "Beneficiary setup" },
    { num: 6, title: "Review", subtitle: "Confirm details" },
    { num: 7, title: "Submitted", subtitle: "Complete" },
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
                   
                    <div
                      className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                        done
                          ? "bg-green-600 text-white"
                          : active
                            ? "bg-blue-900 text-white ring-4 ring-blue-100"
                            : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {done ? (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        step.num
                      )}
                    </div>

                  
                    {step.num < 7 && (
                      <div
                        className={`flex-1 h-0.5 mx-1 mt-4 transition-colors ${
                          step.num < currentStep
                            ? "bg-green-500"
                            : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>

                  <div className="mt-2 hidden md:block">
                    <p
                      className={`text-xs font-semibold ${active ? "text-blue-900" : done ? "text-green-700" : "text-gray-400"}`}
                    >
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
