"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Eye, Search, Filter, ShieldCheck, UserCheck } from "lucide-react";

interface Application {
  id: string;
  name: string;
  nid: string;
  phone: string;
  submittedAt: string;
  status: "pending" | "verified" | "approved" | "rejected" | "re_draft";
  docType: "NID";
}

const STATUS_STYLE: Record<Application["status"], string> = {
  pending: "bg-amber-100 text-amber-700",
  verified: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  re_draft: "bg-purple-100 text-purple-700",
};

const STATUS_LABEL: Record<Application["status"], string> = {
  pending: "Awaiting Check",
  verified: "Checker Verified",
  approved: "Final Approved",
  rejected: "Final Rejected",
  re_draft: "More Info Requested",
};

const mockApplications: Application[] = [
  {
    id: "KYC-2026-001",
    name: "Rafiq Hossain",
    nid: "1234567890",
    phone: "+880 1711 000001",
    submittedAt: "2026-06-11 09:12",
    status: "pending",
    docType: "NID",
  },
  {
    id: "KYC-2026-002",
    name: "Sultana Begum",
    nid: "9876543210",
    phone: "+880 1811 000002",
    submittedAt: "2026-06-11 08:45",
    status: "verified",
    docType: "NID",
  },
  {
    id: "KYC-2026-003",
    name: "Karim Uddin",
    nid: "1122334455",
    phone: "+880 1911 000003",
    submittedAt: "2026-06-11 08:30",
    status: "verified",
    docType: "NID",
  },
  {
    id: "KYC-2026-004",
    name: "Nasrin Akter",
    nid: "5544332211",
    phone: "+880 1711 000004",
    submittedAt: "2026-06-11 07:55",
    status: "rejected",
    docType: "NID",
  },
];

export default function ApplicationsPage() {
  // In real app, toggle this depending on logged-in user role context
  const [activeTab, setActiveTab] = useState<
    "checker_pool" | "maker_pool" | "all"
  >("checker_pool");

  const filteredApps = mockApplications.filter((app) => {
    if (activeTab === "checker_pool") return app.status === "pending";
    if (activeTab === "maker_pool") return app.status === "verified";
    return true;
  });

  return (
    <div className="bg-gray-50 min-h-full">
      <div className="max-w-7xl mx-auto px-4 py-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              KYC Workflow Management
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Four-Eye Verification Pipelines
            </p>
          </div>
        </div>

        {/* Workflow Role Switcher Tabs */}
        <div className="flex border-b border-gray-200 bg-white px-4 pt-3 rounded-t-xl border border-b-0 border-gray-100 shadow-2xs">
          <button
            onClick={() => setActiveTab("checker_pool")}
            className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "checker_pool"
                ? "border-blue-900 text-blue-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <ShieldCheck size={16} />
            Checker Queue (Pending)
          </button>
          <button
            onClick={() => setActiveTab("maker_pool")}
            className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "maker_pool"
                ? "border-blue-900 text-blue-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <UserCheck size={16} />
            Maker Queue (Verified)
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "all"
                ? "border-blue-900 text-blue-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            All Logs
          </button>
        </div>

        {/* Search Matrix */}
        <div className="bg-white rounded-b-xl border border-gray-100 shadow-xs p-4 flex gap-3">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search active work queues..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-md text-sm"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {[
                  "Application ID",
                  "Name",
                  "Document",
                  "Submitted At",
                  "Workflow Status",
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
              {filteredApps.map((app) => (
                <tr
                  key={app.id}
                  className="hover:bg-gray-50/70 transition-colors"
                >
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">
                    {app.id}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {app.name}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-600">
                    {app.docType} ({app.nid})
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {app.submittedAt}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[app.status]}`}
                    >
                      {STATUS_LABEL[app.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/dashboard/applications/${app.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800"
                    >
                      <Eye size={14} />
                      Process File
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
