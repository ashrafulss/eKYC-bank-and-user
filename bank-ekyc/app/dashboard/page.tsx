import React from "react";
import Link from "next/link";
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Eye,
  AlertCircle,
} from "lucide-react";

// ── TYPES ──────────────────────────────────────────────────────
interface StatCard {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ReactNode;
  accent: string;
}

interface Application {
  id: string;
  name: string;
  nid: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected" | "under_review";
}

// ── STATUS MAPS ────────────────────────────────────────────────
const STATUS_STYLE: Record<Application["status"], string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  under_review: "bg-blue-100 text-blue-700",
};

const STATUS_LABEL: Record<Application["status"], string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  under_review: "Under Review",
};

// ── MOCK DATA ──────────────────────────────────────────────────
const stats: StatCard[] = [
  {
    label: "Total Applications",
    value: 1284,
    sub: "+12 today",
    icon: <Users size={20} />,
    accent: "bg-blue-100 text-blue-700",
  },
  {
    label: "Pending Review",
    value: 42,
    sub: "Awaiting action",
    icon: <Clock size={20} />,
    accent: "bg-amber-100 text-amber-700",
  },
  {
    label: "Approved",
    value: 1109,
    sub: "86% approval rate",
    icon: <CheckCircle size={20} />,
    accent: "bg-green-100 text-green-700",
  },
  {
    label: "Rejected",
    value: 133,
    sub: "14% rejection rate",
    icon: <XCircle size={20} />,
    accent: "bg-red-100 text-red-700",
  },
];

const recentApplications: Application[] = [
  {
    id: "KYC-2026-001",
    name: "Rafiq Hossain",
    nid: "1234567890",
    submittedAt: "2026-06-11 09:12",
    status: "pending",
  },
  {
    id: "KYC-2026-002",
    name: "Sultana Begum",
    nid: "9876543210",
    submittedAt: "2026-06-11 08:45",
    status: "approved",
  },
  {
    id: "KYC-2026-003",
    name: "Karim Uddin",
    nid: "1122334455",
    submittedAt: "2026-06-11 08:30",
    status: "under_review",
  },
  {
    id: "KYC-2026-004",
    name: "Nasrin Akter",
    nid: "5544332211",
    submittedAt: "2026-06-11 07:55",
    status: "rejected",
  },
  {
    id: "KYC-2026-005",
    name: "Jahangir Alam",
    nid: "6677889900",
    submittedAt: "2026-06-11 07:20",
    status: "pending",
  },
];

// ── STATUS BADGE ───────────────────────────────────────────────
function StatusBadge({ status }: { status: Application["status"] }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

// ── DASHBOARD PAGE ─────────────────────────────────────────────
export default function DashboardPage() {
  return (
    <div className="bg-gray-50 min-h-full">
      <div className="max-w-8xl mx-auto px-8 py-10 space-y-8">
        {/* Page title */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
            <p className="text-sm text-gray-500 mt-1">
              Welcome back — here's today's overview
            </p>
          </div>
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
            <AlertCircle size={16} className="text-amber-500" />
            <span className="text-sm text-amber-700 font-medium">
              42 applications need review
            </span>
          </div>
        </div>

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-100 shadow-xs p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-500">
                  {stat.label}
                </span>
                <div className={`p-2 rounded-lg ${stat.accent}`}>
                  {stat.icon}
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {stat.value.toLocaleString()}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <TrendingUp size={12} />
                {stat.sub}
              </div>
            </div>
          ))}
        </div>

        {/* ── RECENT APPLICATIONS TABLE ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider">
              Recent Applications
            </h3>

            <Link
              href="/dashboard/applications"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              View all →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {[
                    "Application ID",
                    "Name",
                    "NID",
                    "Submitted",
                    "Status",
                    "Action",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentApplications.map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                      {app.id}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {app.name}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                      {app.nid}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {app.submittedAt}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/applications/${app.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <Eye size={14} />
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── QUICK STATS ROW ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Today's activity */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-xs p-6">
            <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-4">
              Today's Activity
            </h4>
            <div className="space-y-3">
              {[
                { label: "New submissions", value: 12, color: "bg-blue-600" },
                { label: "Approved", value: 8, color: "bg-green-500" },
                { label: "Rejected", value: 2, color: "bg-red-500" },
                { label: "Under review", value: 5, color: "bg-amber-500" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${color}`} />
                    <span className="text-sm text-gray-600">{label}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Staff on duty */}
          {/* <div className="bg-blue-900 rounded-xl p-6 text-white">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-200 mb-4">
              Staff on Duty
            </h4>
            <div className="space-y-3">
              {[
                { name: "Arif Rahman", role: "Approver", active: true },
                { name: "Mitu Akter", role: "Reviewer", active: true },
                { name: "Sabbir Hasan", role: "Admin", active: false },
              ].map(({ name, role, active }) => (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-blue-700 flex items-center justify-center text-xs font-bold">
                      {name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{name}</p>
                      <p className="text-xs text-blue-300">{role}</p>
                    </div>
                  </div>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      active ? "bg-green-400" : "bg-gray-500"
                    }`}
                  />
                </div>
              ))}
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
}
