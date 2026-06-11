"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/auth-context";

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

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { user, loading } = useAuth();

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

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-slate-50">
      <div>
        {" "}
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

            {/* Right — profile dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all"
              >
                {/* name */}
                <span className="text-xs font-medium text-gray-700 hidden sm:block">
                  {user?.name ?? "—"}
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
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {user?.name ?? "Completing profile…"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {user?.mobile ?? "—"}
                        </p>
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
      </div>

      {/* ── PAGE CONTENT ── */}
      <div className="flex-1 overflow-y-auto w-full">
        <div className="max-w-6xl mx-auto w-full">{children}</div>
      </div>
    </div>
  );
}
