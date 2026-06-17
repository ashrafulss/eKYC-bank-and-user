"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/auth-context";
import { cookieUtil } from "../utils/cookies";
import { authService } from "../services/auth.service";

interface HeaderProps {
  completionPct?: number;
}

export default function Header({ completionPct }: HeaderProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const refreshToken = cookieUtil.getCookie("refresh_token");
      await authService.logout(refreshToken || "");
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      cookieUtil.clearAll();
      router.push("/");
      setLoggingOut(false);
    }
  };

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

  const mobile = user?.mobile || "";
  const initials = mobile.replace(/\D/g, "").slice(-2) || "??";

  const showCompletion = typeof completionPct === "number";

  return (
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
        {showCompletion && (
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
        )}

        {/* Right — profile dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all"
          >
            {/* Avatar */}
            {user?.avatar ? (
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

            {/* User display */}
            <span className="text-xs font-medium text-gray-700 hidden sm:block">
              {user?.name || user?.mobile || "—"}
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
                      {user?.name || "Completing profile…"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user?.mobile || "—"}
                    </p>
                  </div>
                </div>

                {/* Mini completion bar */}
                {showCompletion && (
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
                )}
              </div>

              {/* Logout */}
              <div className="border-t border-gray-100 px-2 pt-2 mt-1">
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
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
                  {loggingOut ? "Signing out..." : "Sign out"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
