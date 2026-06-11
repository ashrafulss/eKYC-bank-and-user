"use client";

import { useAuth } from "@/app/context/auth-context";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

// ── MOCK DATA — replace with your real auth context ───────────
const mockActivity = [
  {
    id: 1,
    type: "kyc",
    label: "eKYC Verified",
    time: "Today, 9:30 AM",
    status: "success",
  },
  {
    id: 2,
    type: "account",
    label: "BO Account Created",
    time: "Today, 9:31 AM",
    status: "success",
  },
  {
    id: 3,
    type: "document",
    label: "NID Document Uploaded",
    time: "Today, 9:28 AM",
    status: "success",
  },
  {
    id: 4,
    type: "selfie",
    label: "Liveness Check Passed",
    time: "Today, 9:27 AM",
    status: "success",
  },
  {
    id: 5,
    type: "otp",
    label: "Mobile OTP Verified",
    time: "Today, 9:20 AM",
    status: "success",
  },
];

type NavItem = "overview" | "profile" | "documents" | "security";

export default function UserDashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [activeNav, setActiveNav] = useState<NavItem>("overview");
  const [dropdownOpen, setDropdown] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      )
        setDropdown(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // ── 1. LOADING GUARD ──────────────────────────────────────────
  // Prevents reading properties of null while auth context initializes
  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500 font-medium mt-3">
          Loading dashboard...
        </p>
      </div>
    );
  }

  // ── 2. UNAUTHENTICATED GUARD ──────────────────────────────────
  if (!user) {
    router.push("/login");
    return null;
  }

  // ── 3. SAFE PROPERTY DERIVATION ───────────────────────────────
  // Added optional chaining (?.) and fallback string safely
  const initials = (user?.name ?? "User")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const navItems: { key: NavItem; label: string; icon: React.ReactNode }[] = [
    {
      key: "overview",
      label: "Overview",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
    },
    {
      key: "profile",
      label: "My Profile",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      ),
    },
    {
      key: "documents",
      label: "Documents",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
        </svg>
      ),
    },
    {
      key: "security",
      label: "Security",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M12 2l7 4v6c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      ),
    },
  ];

  return (
    <div className="bg-slate-50 flex flex-col w-full min-h-screen">
      {/* ── PAGE CONTENT ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {/* ── OVERVIEW TAB ── */}
        {activeNav === "overview" && (
          <div className="space-y-6">
            {/* Welcome banner */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-blue-200 text-sm font-medium">
                  Welcome back
                </p>
                <h2 className="text-white text-2xl font-bold mt-0.5">
                  {user?.name}
                </h2>
                <p className="text-blue-300 text-xs mt-1">
                  BO Account · {user?.boAccountNo ?? "—"}
                </p>
              </div>
              <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5">
                <svg
                  className="w-5 h-5 text-green-400"
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
                <div>
                  <p className="text-white text-xs font-bold">KYC Pending</p>
                </div>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Account Type"
                value={user?.accountType ?? "—"}
                icon="🏦"
              />
              <StatCard label="KYC Status" value="Pending" icon="✅" green />
              <StatCard
                label="Trading Access"
                value={user?.tradingPermissions?.join(", ") ?? "—"}
                icon="📈"
              />
              <StatCard
                label="Division"
                value={user?.division ?? "—"}
                icon="📍"
              />
            </div>

            {/* Account Info Split Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-4">
                  Account Summary
                </h3>
                <div className="space-y-3">
                  {[
                    {
                      label: "BO Account No",
                      value: user?.boAccountNo,
                      mono: true,
                    },
                    { label: "Mobile", value: user?.mobile },
                    { label: "NID Number", value: user?.nid, mono: true },
                    { label: "TIN Number", value: user?.tin, mono: true },
                  ].map(({ label, value, mono }) => (
                    <div
                      key={label}
                      className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0"
                    >
                      <span className="text-xs text-gray-400">{label}</span>
                      <span
                        className={`text-xs font-medium text-gray-800 ${mono ? "font-mono" : ""}`}
                      >
                        {value ?? "—"}
                      </span>
                    </div>
                  ))}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {user?.tradingPermissions?.map((p) => (
                      <span
                        key={p}
                        className="bg-cyan-50 text-cyan-700 border border-cyan-200 text-xs font-semibold px-2 py-0.5 rounded"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Activity feed */}
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-4">
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {mockActivity.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-green-50 border border-green-100 flex items-center justify-center shrink-0">
                        <svg
                          className="w-3.5 h-3.5 text-green-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">
                          {item.label}
                        </p>
                        <p className="text-[11px] text-gray-400">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PROFILE TAB ── */}
        {activeNav === "profile" && (
          <div className="max-w-2xl space-y-5">
            <h2 className="text-xl font-bold text-gray-900">My Profile</h2>
            <div className="bg-white rounded-xl border border-gray-100 p-6 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-900 text-white flex items-center justify-center text-xl font-bold shrink-0">
                {initials}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">{user?.name}</p>
                <p className="text-sm text-gray-500">{user?.mobile}</p>
                <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 text-xs font-semibold px-2 py-0.5 rounded-full mt-1.5">
                  ✓ KYC Verified
                </span>
              </div>
            </div>

            <ProfileSection title="Personal Information">
              <ProfileRow label="Full Name" value={user?.name} />
              <ProfileRow label="Mobile" value={user?.mobile} />
              <ProfileRow label="Email" value={user?.email} />
              <ProfileRow label="Date of Birth" value={formatDate(user?.dob)} />
              <ProfileRow label="Division" value={user?.division} />
              <ProfileRow label="District" value={user?.district} />
            </ProfileSection>

            <ProfileSection title="Identity & Compliance">
              <ProfileRow label="NID Number" value={user?.nid} mono />
              <ProfileRow label="TIN Number" value={user?.tin} mono />
              <ProfileRow label="KYC Status" value="Verified" green />
              <ProfileRow
                label="Verified On"
                value={formatDate(user?.verifiedAt)}
              />
            </ProfileSection>
          </div>
        )}

        {/* ── DOCUMENTS TAB ── */}
        {activeNav === "documents" && (
          <div className="max-w-2xl space-y-5">
            <h2 className="text-xl font-bold text-gray-900">Documents</h2>
            <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
              {[
                { name: "NID Front", status: "Verified", date: "Jun 10, 2024" },
                { name: "NID Back", status: "Verified", date: "Jun 10, 2024" },
                {
                  name: "Selfie / Liveness",
                  status: "Verified",
                  date: "Jun 10, 2024",
                },
                {
                  name: "Nominee NID",
                  status: "Verified",
                  date: "Jun 10, 2024",
                },
              ].map((doc) => (
                <div
                  key={doc.name}
                  className="flex items-center justify-between px-5 py-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-blue-700"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <path d="M14 2v6h6" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {doc.name}
                      </p>
                      <p className="text-xs text-gray-400">{doc.date}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                    ✓ {doc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SECURITY TAB ── */}
        {activeNav === "security" && (
          <div className="max-w-2xl space-y-5">
            <h2 className="text-xl font-bold text-gray-900">Security</h2>
            <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
              {[
                {
                  label: "Mobile Verification",
                  desc: user?.mobile,
                  done: true,
                },
                {
                  label: "eKYC Verification",
                  desc: "Identity confirmed",
                  done: true,
                },
                {
                  label: "Two-Factor Auth",
                  desc: "OTP via SMS active",
                  done: true,
                },
                {
                  label: "Login History",
                  desc: "Last login: Today",
                  done: true,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between px-5 py-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${item.done ? "bg-green-100" : "bg-gray-100"}`}
                    >
                      <svg
                        className={`w-4 h-4 ${item.done ? "text-green-600" : "text-gray-400"}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {item.label}
                      </p>
                      <p className="text-xs text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${item.done ? "text-green-700 bg-green-50 border border-green-200" : "text-gray-500 bg-gray-100"}`}
                  >
                    {item.done ? "Active" : "Inactive"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ── HELPERS ──────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon,
  green,
}: {
  label: string;
  value: string;
  icon: string;
  green?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <p className="text-lg mb-1">{icon}</p>
      <p
        className={`text-sm font-bold ${green ? "text-green-700" : "text-gray-900"}`}
      >
        {value}
      </p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

function ProfileSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-50">
        <p className="text-[11px] font-bold text-cyan-700 uppercase tracking-wider">
          {title}
        </p>
      </div>
      <div className="px-5 py-3 space-y-1">{children}</div>
    </div>
  );
}

function ProfileRow({
  label,
  value,
  mono,
  green,
}: {
  label: string;
  value: string | undefined;
  mono?: boolean;
  green?: boolean;
}) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 w-36 shrink-0">{label}</span>
      <span
        className={`text-xs font-medium text-right ${mono ? "font-mono text-gray-700" : ""} ${green ? "text-green-700 font-semibold" : "text-gray-800"}`}
      >
        {value ?? "—"}
      </span>
    </div>
  );
}

function formatDate(iso: string | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-BD", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
