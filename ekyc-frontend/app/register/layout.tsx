"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

// ── MOCK USER — replace with your real auth context/hook ──────
const useMockUser = () => ({
  mobile: "+880 1712-345678",
  name: "Sajeeb Ahmed", // will be empty until Basic Info step
  avatar: null as string | null,
  completedSteps: 1, // how many steps done so far
});

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useMockUser();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── STEP CONFIG ──────────────────────────────────────────────
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

  // Navbar only visible after mobile verification is done
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

  // ── PROFILE COMPLETION % ─────────────────────────────────────
  const completionPct = Math.round(((currentStep - 1) / 6) * 100);

  // ── AVATAR INITIALS ──────────────────────────────────────────
  const initials = user.mobile.replace(/\D/g, "").slice(-2); // last 2 digits of mobile

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-50">
      {/* ── TOP NAVBAR — only after mobile verification ── */}
      {showNavbar && (
        <header className="bg-white border-b border-gray-200 shrink-0 z-20">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
            {/* Logo / Brand */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-900 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <span className="font-bold text-blue-900 text-sm tracking-tight hidden sm:block">
                eKYC Portal
              </span>
            </div>

            {/* Profile completion bar — desktop only */}
            <div className="hidden md:flex items-center gap-3 flex-1 max-w-xs mx-8">
              <span className="text-xs text-gray-500 whitespace-nowrap">
                Profile completion
              </span>
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-blue-700 tabular-nums w-8 text-right">
                {completionPct}%
              </span>
            </div>

            {/* Right — profile dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all"
              >
                {/* Avatar */}
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    className="w-7 h-7 rounded-full object-cover"
                    alt="avatar"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-blue-900 text-white flex items-center justify-center text-[11px] font-bold">
                    {initials}
                  </div>
                )}

                {/* Mobile number */}
                <span className="text-xs font-medium text-gray-700 hidden sm:block">
                  {user.mobile}
                </span>

                {/* Chevron */}
                <svg
                  className={`w-3.5 h-3.5 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-900 text-white flex items-center justify-center text-sm font-bold shrink-0">
                        {initials}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {user.name || "Completing profile…"}
                        </p>
                        <p className="text-xs text-gray-500">{user.mobile}</p>
                      </div>
                    </div>

                    {/* Mini completion bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                        <span>Profile completion</span>
                        <span className="font-semibold text-blue-700">
                          {completionPct}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-500"
                          style={{ width: `${completionPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-gray-100 px-2 pt-2 mt-1">
                    <button
                      onClick={() => router.push("/")}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      {/* ── STEP PROGRESS BAR ── */}
      <div className="bg-white border-b border-gray-100 shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex justify-between gap-2 md:gap-4">
            {steps.map((step) => {
              const done = step.num < currentStep;
              const active = step.num === currentStep;
              return (
                <div key={step.num} className="flex-1">
                  <div className="flex items-start">
                    {/* Circle */}
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

                    {/* Connector line */}
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

                  {/* Labels — hidden on mobile */}
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

      {/* ── PAGE CONTENT ── */}
      <div className="flex-1 overflow-y-auto w-full">
        <div className="max-w-6xl mx-auto w-full">{children}</div>
      </div>
    </div>
  );
}
