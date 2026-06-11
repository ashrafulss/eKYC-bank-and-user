"use client";

import React from "react";
import { usePathname } from "next/navigation";
import UserDropdown from "./UserDropdown";

interface NavbarProps {
  user: {
    name: string;
    role: string;
    email: string;
    avatar: string;
  };
}

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();

  // Check if the user is currently on the login page or root path
  const isLoginPage = pathname === "/login" || pathname === "/";

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Left — Brand stays visible everywhere! */}
        <h1 className="text-2xl font-bold text-blue-900">eKYC</h1>

        {/* Right — Dropdown only mounts if the user is NOT on the login page */}
        {!isLoginPage && (
          <UserDropdown
            name={user.name}
            email={user.email}
            role={user.role}
            avatar={user.avatar}
          />
        )}
      </div>
    </header>
  );
}
