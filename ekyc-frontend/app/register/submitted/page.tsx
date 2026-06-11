"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// ── MOCK USER DATA — replace with your real auth context ──────
// This simulates data collected across the eKYC steps
const mockUserProfile = {
  name: "Sajeeb Ahmed",
  mobile: "+880 1712-345678",
  nid: "1992 8374 5621",
  dob: "1990-06-15",
  division: "Dhaka",
  district: "Dhaka",
  email: "sajeeb@example.com",
  accountType: "Individual",
  tin: "TIN-2024-88291",
  tradingPermissions: ["Cash", "Margin"],
  kycStatus: "Pendding",
  submittedAt: new Date().toISOString(),
  avatar: null as string | null,
};

export default function Submitted() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  // Trigger entrance animation
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const user = mockUserProfile;
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const submittedDate = new Date(user.submittedAt).toLocaleDateString("en-BD", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-full bg-slate-50 py-10 px-4">
      <div
        className={`max-w-2xl mx-auto transition-all duration-500 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {/* ── SUCCESS BANNER ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-green-600 flex items-center justify-center shrink-0 shadow-md shadow-green-100">
            <svg
              className="w-7 h-7 text-white"
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
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              eKYC Submitted Successfully
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Submitted on {submittedDate} · Your account is now active
            </p>
          </div>
          <span className="ml-auto shrink-0 bg-green-50 text-green-700 border border-green-200 text-xs font-bold px-3 py-1 rounded-full">
            ✓ Pendding
          </span>
        </div>

        {/* ── PROFILE CARD ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
          {/* Profile header */}
          <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-6 py-6 flex items-center gap-4">
            {user.avatar ? (
              <img
                src={user.avatar}
                className="w-16 h-16 rounded-full border-2 border-white/30 object-cover"
                alt="avatar"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-white text-xl font-bold">
                {initials}
              </div>
            )}
            <div>
              <h2 className="text-white text-lg font-bold">{user.name}</h2>
              <p className="text-blue-200 text-sm">{user.mobile}</p>
            </div>
          </div>

          {/* ── PERSONAL DETAILS ── */}
          <Section title="Personal Information">
            <Row label="Full Name" value={user.name} />
            <Row label="Mobile" value={user.mobile} />
            <Row label="Email" value={user.email} />
            <Row label="Date of Birth" value={formatDate(user.dob)} />
            <Row label="NID Number" value={user.nid} mono />
            <Row label="Division" value={user.division} />
            <Row label="District" value={user.district} />
          </Section>

          {/* ── ACCOUNT DETAILS ── */}
          <Section title="Account Details" bordered>
            <Row label="Account Type" value={user.accountType} />
            <Row label="TIN Number" value={user.tin} mono />
            <Row
              label="Trading Permissions"
              value={
                <div className="flex flex-wrap gap-1.5">
                  {user.tradingPermissions.map((p) => (
                    <span
                      key={p}
                      className="bg-cyan-50 text-cyan-700 border border-cyan-200 text-xs font-semibold px-2 py-0.5 rounded"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              }
            />
            <Row
              label="KYC Status"
              value={
                <span className="inline-flex items-center gap-1 text-green-700 font-semibold text-sm">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  {user.kycStatus}
                </span>
              }
            />
          </Section>
        </div>

        {/* ── ACTION BUTTON ── */}
        <button
          onClick={() => router.push("/profile/dashboard")}
          className="w-full bg-blue-900 hover:bg-blue-800 active:scale-[0.99] text-white py-3.5 px-4 rounded-xl font-semibold transition-all shadow-md shadow-blue-200 text-sm tracking-wide"
        >
          Go to Dashboard →
        </button>

        <p className="text-center text-xs text-gray-400 mt-3">
          A confirmation has been sent to {user.mobile}
        </p>
      </div>
    </div>
  );
}

// ── HELPER COMPONENTS ────────────────────────────────────────────

function Section({
  title,
  children,
  bordered,
}: {
  title: string;
  children: React.ReactNode;
  bordered?: boolean;
}) {
  return (
    <div className={bordered ? "border-t border-gray-100" : ""}>
      <div className="px-6 pt-4 pb-1">
        <p className="text-[11px] font-bold text-cyan-700 uppercase tracking-wider">
          {title}
        </p>
      </div>
      <div className="px-6 pb-4 space-y-3">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 font-medium shrink-0 w-36">
        {label}
      </span>
      <span
        className={`text-xs text-gray-800 text-right ${mono ? "font-mono" : "font-medium"}`}
      >
        {value}
      </span>
    </div>
  );
}

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-BD", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
