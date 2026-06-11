"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>; // Updated type definitions to represent a Promise
}

export default function ApplicationDetailPage({ params }: PageProps) {
  // Unwrapping the asynchronous params safely using React.use()
  const unwrappedParams = use(params);

  // Simulate auth context role: change this to 'maker' to view alternative panel state
  const [userRole] = useState<"checker" | "maker">("checker");

  // Real workflow status tracking
  const [appStatus] = useState<"pending" | "verified">("pending");

  return (
    <div className="bg-gray-50 min-h-full">
      <div className="max-w-7xl mx-auto px-4 py-10 space-y-6">
        {/* Header Navigation */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/applications"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-blue-700"
            >
              <ArrowLeft size={16} /> Back to Queues
            </Link>
            <div>
              {/* Accessing the property safely from the unwrapped object */}
              <h2 className="text-2xl font-bold text-gray-900">
                {unwrappedParams.id || "KYC-2026-001"}
              </h2>
              <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded font-mono uppercase tracking-wider">
                Current State: {appStatus}
              </span>
            </div>
          </div>

          <div className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded bg-slate-200 text-slate-700 flex items-center gap-1">
            Acting Role: <span className="text-blue-900">{userRole}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT CONTENT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs">
              <div className="flex items-center gap-2 pb-4 border-b border-gray-100 mb-4 text-blue-900">
                <User size={18} />{" "}
                <h3 className="font-bold text-sm uppercase">
                  Applicant Identity Profile
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <span className="text-gray-500">Full Name:</span>{" "}
                <span className="font-medium text-gray-900">Rafiq Hossain</span>
                <span className="text-gray-500">National ID No:</span>{" "}
                <span className="font-mono font-medium text-gray-900">
                  1234567890
                </span>
                <span className="text-gray-500">Contact Number:</span>{" "}
                <span className="text-gray-900">+880 1711 000001</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs">
              <div className="flex items-center gap-2 pb-4 border-b border-gray-100 mb-4 text-blue-900">
                <MapPin size={18} />{" "}
                <h3 className="font-bold text-sm uppercase">Address Profile</h3>
              </div>
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <span className="text-gray-500">Dhanmondi, Dhaka</span>
              </div>
            </div>
          </div>

          {/* RIGHT ACTION SIDEBAR PANEL (DYNAMIC) */}
          <div className="space-y-5">
            {/* CHECKER ACTIONS */}
            {userRole === "checker" && (
              <div className="bg-white rounded-xl p-6 border-2 border-amber-400 shadow-sm">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider mb-3">
                  <ShieldCheck size={16} /> Phase 1: Checker Review
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  Verify documentation clarity and identity match. You cannot
                  perform final system approvals.
                </p>

                <div className="mb-4">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Checker Evaluation Note
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide structural file notes..."
                    className="w-full p-2 border rounded-md text-sm bg-slate-50"
                  />
                </div>

                <div className="space-y-2">
                  <button className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-md shadow-xs">
                    <CheckCircle size={15} /> Verify & Push to Maker
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm rounded-md shadow-xs">
                    <Clock size={15} /> Request More Info
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold text-sm rounded-md shadow-xs">
                    <XCircle size={15} /> Reject Application
                  </button>
                </div>
              </div>
            )}

            {/* MAKER ACTIONS */}
            {userRole === "maker" && (
              <div className="bg-blue-950 rounded-xl p-6 text-white shadow-md ring-4 ring-blue-900/20">
                <div className="flex items-center gap-2 text-blue-300 font-bold text-xs uppercase tracking-wider mb-3">
                  <UserCheck size={16} /> Phase 2: Maker Final Decision
                </div>
                <p className="text-xs text-blue-200/80 mb-4">
                  Review the primary Checker's remarks. Your execution commits
                  entries into the live system.
                </p>

                <div className="bg-blue-900/50 p-2.5 rounded-md border border-blue-800 text-xs mb-4 space-y-1">
                  <span className="font-bold text-blue-300 block">
                    Checker Logs:
                  </span>
                  <p className="text-blue-100 italic">
                    "NID scans parsed cleanly against government baseline data
                    endpoints."
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-bold text-blue-200 mb-1">
                    Maker Binding Remark
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Add final authorization approval note..."
                    className="w-full p-2 bg-blue-900/60 border border-blue-700 rounded-md text-sm text-white placeholder-blue-400"
                  />
                </div>

                <div className="space-y-2">
                  <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold text-sm rounded-md shadow-md">
                    <CheckCircle size={15} /> Execute Final System Approval
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold text-sm rounded-md">
                    <XCircle size={15} /> Absolute Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
