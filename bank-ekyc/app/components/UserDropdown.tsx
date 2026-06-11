"use client";

import { useState, useRef, useEffect } from "react";
import { LogOut, User, Shield, ChevronDown, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

interface UserDropdownProps {
  name: string;
  email: string;
  role: string;
  avatar: string;
}

export default function UserDropdown({
  name,
  email,
  role,
  avatar,
}: UserDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    // TODO: clear session/token here
    router.push("/");
  };

  return (
    <div className="relative" ref={ref}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2.5 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors"
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
          {avatar}
        </div>

        {/* Name + role */}
        <div className="hidden sm:block text-left">
          <p className="text-sm font-semibold text-gray-900 leading-none">
            {name}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{email}</p>
        </div>

        <ChevronDown
          size={14}
          className={`hidden sm:block text-gray-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-gray-100 shadow-lg overflow-hidden z-50">
          {/* User info header */}
          <div className="px-4 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-900 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                {avatar}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{name}</p>
                <p className="text-xs text-gray-400">{email}</p>
              </div>
            </div>

            {/* Role badge */}
            <div className="mt-3">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  role === "Maker"
                    ? "bg-green-100 text-green-700"
                    : role === "Checker"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-purple-100 text-purple-700"
                }`}
              >
                <Shield size={11} />
                {role}
              </span>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1.5">
            <button
              onClick={() => {
                setOpen(false);
                router.push("/dashboard/profile");
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <User size={15} className="text-gray-400" />
              My Profile
            </button>

            <button
              onClick={() => {
                setOpen(false);
                router.push("/dashboard/settings");
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Settings size={15} className="text-gray-400" />
              Settings
            </button>
          </div>

          {/* Logout */}
          <div className="border-t border-gray-100 py-1.5">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
            >
              <LogOut size={15} />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
