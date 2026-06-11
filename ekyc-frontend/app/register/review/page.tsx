"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Review() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);

  // Complete multi-step data context matching the inputs from your flow steps
  const [userData] = useState({
    personal: {
      fullNameEnglish: "John Doe",
      fullNameBangla: "জন ডো",
      dob: "1994-08-12",
      gender: "Male",
      nidNumber: "5543210987",
      mobile: "1712345678",
      presentAddress: "House 45, Road 12, Gulshan-2, Dhaka",
      email: "john.doe@example.com",
      occupation: "Software Engineer",
      employer: "Spectrum Tech Solutions",
      monthlyIncome: "BDT 100,000 - 500,000",
    },
    nominees: [
      {
        name: "Farhana Chowdhury",
        relationship: "Spouse",
        nid: "9876 5432 1098",
        dob: "1990-07-05",
        share: "100%",
        contact: "+880 1712 345678",
      },
    ],
    boPrefs: {
      accountType: "Individual (Resident)",
      dp: "NLI Securities Limited",
      bank: "BRAC Bank Ltd., Gulshan Branch",
      settlementAccount: "1501 2020 3040 5060",
      tin: "123456789012",
    },
    permissions: {
      cash: true,
      margin: true,
      foreign: false,
    },
  });

  return (
    <div className="w-full h-full min-h-[calc(100vh-160px)] bg-slate-50 py-12 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-6 pb-24">
        {/* Header Section */}
        <div className="w-full mb-2">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Review Your Application
          </h1>
        </div>

        {/* ─── 1. BASIC INFORMATION (KYCForm step data matches) ─── */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 md:p-8 space-y-6">
          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
            <h2 className="text-xs font-bold tracking-wider text-cyan-700 uppercase">
              1. Basic Information
            </h2>
            <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full">
              Primary Profile
            </span>
          </div>

          <div className="space-y-4">
            {/* Name English */}
            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <span className="text-sm font-medium text-gray-500">
                Name (English)
              </span>
              <div className="w-full sm:col-span-2 px-3 py-2 bg-slate-50/80 border border-gray-100 rounded-md text-sm text-gray-800 font-medium">
                {userData.personal.fullNameEnglish}
              </div>
            </div>

            {/* Name Bangla */}
            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <span className="text-sm font-medium text-gray-500">
                Name (Bangla)
              </span>
              <div className="w-full sm:col-span-2 px-3 py-2 bg-slate-50/80 border border-gray-100 rounded-md text-sm text-gray-800">
                {userData.personal.fullNameBangla || "—"}
              </div>
            </div>

            {/* DOB & Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <span className="text-sm font-medium text-gray-500">
                DOB & Gender
              </span>
              <div className="w-full sm:col-span-2 grid grid-cols-2 gap-2">
                <div className="px-3 py-2 bg-slate-50/80 border border-gray-100 rounded-md text-sm text-gray-800">
                  {userData.personal.dob}
                </div>
                <div className="px-3 py-2 bg-slate-50/80 border border-gray-100 rounded-md text-sm text-gray-800">
                  {userData.personal.gender}
                </div>
              </div>
            </div>

            {/* NID Number */}
            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <span className="text-sm font-medium text-gray-500">
                NID Number
              </span>
              <div className="w-full sm:col-span-2 px-3 py-2 bg-slate-50/80 border border-gray-100 rounded-md text-sm font-mono text-gray-800 tracking-wide">
                {userData.personal.nidNumber}
              </div>
            </div>

            {/* Mobile Number */}
            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <span className="text-sm font-medium text-gray-500">
                Mobile Number
              </span>
              <div className="w-full sm:col-span-2 px-3 py-2 bg-slate-50/80 border border-gray-100 rounded-md text-sm text-gray-800 font-mono">
                +880 {userData.personal.mobile}
              </div>
            </div>

            {/* Email Address */}
            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <span className="text-sm font-medium text-gray-500">
                Email Address
              </span>
              <div className="w-full sm:col-span-2 px-3 py-2 bg-slate-50/80 border border-gray-100 rounded-md text-sm text-gray-800 break-all">
                {userData.personal.email}
              </div>
            </div>

            {/* Present Address */}
            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <span className="text-sm font-medium text-gray-500">
                Present Address
              </span>
              <div className="w-full sm:col-span-2 px-3 py-2 bg-slate-50/80 border border-gray-100 rounded-md text-sm text-gray-800 leading-relaxed">
                {userData.personal.presentAddress}
              </div>
            </div>

            {/* Employment Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <span className="text-sm font-medium text-gray-500">
                Employment
              </span>
              <div className="w-full sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="px-3 py-2 bg-slate-50/80 border border-gray-100 rounded-md text-sm text-gray-800 truncate">
                  <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-wider">
                    Occ.
                  </span>
                  {userData.personal.occupation}
                </div>
                <div className="px-3 py-2 bg-slate-50/80 border border-gray-100 rounded-md text-sm text-gray-800 truncate">
                  <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-wider">
                    Emp.
                  </span>
                  {userData.personal.employer}
                </div>
              </div>
            </div>

            {/* Monthly Income Range */}
            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <span className="text-sm font-medium text-gray-500">
                Monthly Income
              </span>
              <div className="w-full sm:col-span-2 px-3 py-2 bg-slate-50/80 border border-gray-100 rounded-md text-sm text-gray-800">
                {userData.personal.monthlyIncome}
              </div>
            </div>
          </div>
        </div>

        {/* ─── 2. NOMINEE INFORMATION ─── */}
        {userData.nominees.map((nominee, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 md:p-8 space-y-6"
          >
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h2 className="text-xs font-bold tracking-wider text-cyan-700 uppercase">
                2. Nominee Details {index > 0 ? `#${index + 1}` : "(Primary)"}
              </h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                <span className="text-sm font-medium text-gray-500">
                  Nominee Name
                </span>
                <div className="w-full sm:col-span-2 px-3 py-2 bg-slate-50/80 border border-gray-100 rounded-md text-sm text-gray-800 font-medium">
                  {nominee.name || "—"}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                <span className="text-sm font-medium text-gray-500">
                  Relationship
                </span>
                <div className="w-full sm:col-span-2 px-3 py-2 bg-slate-50/80 border border-gray-100 rounded-md text-sm text-gray-800">
                  {nominee.relationship || "—"}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                <span className="text-sm font-medium text-gray-500">NID</span>
                <div className="w-full sm:col-span-2 px-3 py-2 bg-slate-50/80 border border-gray-100 rounded-md text-sm font-mono text-gray-800">
                  {nominee.nid || "—"}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                <span className="text-sm font-medium text-gray-500">
                  Share Percentage
                </span>
                <div className="w-full sm:col-span-2 px-3 py-2 bg-slate-50/80 border border-gray-100 rounded-md text-sm text-gray-800">
                  {nominee.share || "—"}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* ─── 3. BO ACCOUNT PREFERENCES ─── */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 md:p-8 space-y-6">
          <h2 className="text-xs font-bold tracking-wider text-cyan-700 uppercase border-b border-gray-100 pb-2">
            3. BO Account Preferences
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <span className="text-sm font-medium text-gray-500">
                Account Type
              </span>
              <div className="w-full sm:col-span-2 px-3 py-2 bg-slate-50/80 border border-gray-100 rounded-md text-sm text-gray-800">
                {userData.boPrefs.accountType}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <span className="text-sm font-medium text-gray-500">
                Participant (DP)
              </span>
              <div className="w-full sm:col-span-2 px-3 py-2 bg-slate-50/80 border border-gray-100 rounded-md text-sm text-gray-800">
                {userData.boPrefs.dp}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <span className="text-sm font-medium text-gray-500">
                Settlement Bank
              </span>
              <div className="w-full sm:col-span-2 px-3 py-2 bg-slate-50/80 border border-gray-100 rounded-md text-sm text-gray-800">
                {userData.boPrefs.bank}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <span className="text-sm font-medium text-gray-500">
                Bank Account
              </span>
              <div className="w-full sm:col-span-2 px-3 py-2 bg-slate-50/80 border border-gray-100 rounded-md text-sm font-mono text-gray-800">
                {userData.boPrefs.settlementAccount}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <span className="text-sm font-medium text-gray-500">
                TIN Number
              </span>
              <div className="w-full sm:col-span-2 px-3 py-2 bg-slate-50/80 border border-gray-100 rounded-md text-sm font-mono text-gray-800">
                {userData.boPrefs.tin}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-2 pt-2">
              <span className="text-sm font-medium text-gray-500 pt-1">
                Trading Permissions
              </span>
              <div className="w-full sm:col-span-2 flex flex-wrap gap-2">
                <span
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold ${userData.permissions.cash ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-400"}`}
                >
                  Cash {userData.permissions.cash ? "✓" : "✗"}
                </span>
                <span
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold ${userData.permissions.margin ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-400"}`}
                >
                  Margin {userData.permissions.margin ? "✓" : "✗"}
                </span>
                <span
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold ${userData.permissions.foreign ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-400"}`}
                >
                  Foreign {userData.permissions.foreign ? "✓" : "✗"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── 4. DECLARATION & TERMS AGREEMENT ─── */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 md:p-8">
          <label className="flex items-start cursor-pointer select-none group">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-5 h-5 mt-0.5 border-gray-300 rounded text-blue-600 focus:ring-blue-500/20 accent-blue-600 cursor-pointer"
            />
            <span className="ml-3 text-sm text-gray-600 leading-relaxed group-hover:text-gray-900 transition-colors">
              I hereby confirm all information supplied above is accurate,
              updated, and I explicitly declare my agreement to the terms of
              service.
            </span>
          </label>
        </div>

        {/* ─── WORKFLOW CONTROL FORMS ACTIONS ─── */}
        <div className="w-full flex flex-col sm:flex-row justify-between gap-4 border-t border-slate-200/60 pt-6">
          <button
            onClick={() => router.back()}
            className="bg-gray-500 text-white px-8 py-3 rounded cursor-pointer"
          >
            Back
          </button>

          <button
            disabled={!agreed}
            onClick={() => router.push("/register/submitted")}
            className={`px-10 py-3 rounded text-white font-semibold transition-all  ${agreed ? "bg-blue-600 hover:bg-blue-700 cursor-pointer" : "bg-blue-300 cursor-not-allowed"}  `}
          >
            Submit Application
          </button>
        </div>
      </div>
    </div>
  );
}
