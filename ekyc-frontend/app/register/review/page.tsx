"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { reviewApplicationService, ReviewApplicationData } from "@/app/services/review.service";

export default function Review() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [userData, setUserData] = useState<ReviewApplicationData | null>(null);

  useEffect(() => {
    const fetchReviewData = async () => {
      try {
        setLoading(true);
        setErrorMessage(null);
        const data = await reviewApplicationService.getSummary();
        setUserData(data);
      } catch (error: any) {
        console.error("Failed to compile review wizard profile details:", error);
        setErrorMessage(error.message || "Failed to parse records from operational tables.");
      } finally {
        setLoading(false);
      }
    };
    fetchReviewData();
  }, []);

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-500 font-medium">Assembling dynamic validation records layout...</p>
        </div>
      </div>
    );
  }

  if (errorMessage || !userData) {
    return (
      <div className="max-w-4xl mx-auto my-12 p-8 bg-white border border-red-100 rounded-xl text-center shadow-xs">
        <p className="text-red-600 font-semibold mb-2">Review Summary Compilation Failure</p>
        <p className="text-sm text-gray-500 mb-6">{errorMessage || "The backend pipeline data mapping is currently unreadable."}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-md transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[calc(100vh-160px)] bg-slate-50 py-12 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-6 pb-24">
        
        {/* Header Summary Section */}
        <div className="w-full mb-2">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Review Your Application
          </h1>
          <p className="text-sm text-gray-500 mt-1">Please confirm all registered configuration mappings are accurate.</p>
        </div>

        {/* ─── 1. BASIC IDENTITY DATA (Mapped to public.personal_info & public.address_info) ─── */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 md:p-8 space-y-6">
          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
            <h2 className="text-xs font-bold tracking-wider text-cyan-700 uppercase">
              1. Basic Identity Records
            </h2>
            <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full">
              Primary Profile
            </span>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <span className="text-sm font-medium text-gray-500">Name (English)</span>
              <div className="w-full sm:col-span-2 px-3 py-2 bg-slate-50/80 border border-gray-100 rounded-md text-sm text-gray-800 font-medium">
                {userData.personal.fullNameEnglish}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <span className="text-sm font-medium text-gray-500">Name (Bangla)</span>
              <div className="w-full sm:col-span-2 px-3 py-2 bg-slate-50/80 border border-gray-100 rounded-md text-sm text-gray-800">
                {userData.personal.fullNameBangla}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <span className="text-sm font-medium text-gray-500">DOB & Gender</span>
              <div className="w-full sm:col-span-2 grid grid-cols-2 gap-2">
                <div className="px-3 py-2 bg-slate-50/80 border border-gray-100 rounded-md text-sm text-gray-800">
                  {userData.personal.dob}
                </div>
                <div className="px-3 py-2 bg-slate-50/80 border border-gray-100 rounded-md text-sm text-gray-800 uppercase">
                  {userData.personal.gender}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <span className="text-sm font-medium text-gray-500">NID Number</span>
              <div className="w-full sm:col-span-2 px-3 py-2 bg-slate-50/80 border border-gray-100 rounded-md text-sm font-mono text-gray-800 tracking-wide">
                {userData.personal.nidNumber}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <span className="text-sm font-medium text-gray-500">Mobile Number</span>
              <div className="w-full sm:col-span-2 px-3 py-2 bg-slate-50/80 border border-gray-100 rounded-md text-sm text-gray-800 font-mono">
                {userData.personal.mobile}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <span className="text-sm font-medium text-gray-500">Email Address</span>
              <div className="w-full sm:col-span-2 px-3 py-2 bg-slate-50/80 border border-gray-100 rounded-md text-sm text-gray-800 break-all">
                {userData.personal.email}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <span className="text-sm font-medium text-gray-500">Present Address</span>
              <div className="w-full sm:col-span-2 px-3 py-2 bg-slate-50/80 border border-gray-100 rounded-md text-sm text-gray-800 leading-relaxed">
                {userData.personal.presentAddress}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <span className="text-sm font-medium text-gray-500">Employment Status</span>
              <div className="w-full sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="px-3 py-2 bg-slate-50/80 border border-gray-100 rounded-md text-sm text-gray-800 truncate">
                  <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-wider">Occupation</span>
                  {userData.personal.occupation}
                </div>
                <div className="px-3 py-2 bg-slate-50/80 border border-gray-100 rounded-md text-sm text-gray-800 truncate">
                  <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-wider">Employer</span>
                  {userData.personal.employer}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <span className="text-sm font-medium text-gray-500">Monthly Income</span>
              <div className="w-full sm:col-span-2 px-3 py-2 bg-slate-50/80 border border-gray-100 rounded-md text-sm text-gray-800">
                {userData.personal.monthlyIncome}
              </div>
            </div>
          </div>
        </div>

        {/* ─── 2. NOMINEE BLOCK (Mapped dynamically directly from public.nominees) ─── */}
        {userData.nominees.length === 0 ? (
          <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 text-center text-sm text-gray-400 font-medium">
            No dynamic nominee distribution records assigned to this registration profile setup yet.
          </div>
        ) : (
          userData.nominees.map((nominee, index) => (
            <div key={index} className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 md:p-8 space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <h2 className="text-xs font-bold tracking-wider text-cyan-700 uppercase">
                  2. Nominee Details {index > 0 ? `#${index + 1}` : "(Primary Setup)"}
                </h2>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                  <span className="text-sm font-medium text-gray-500">Nominee Full Name</span>
                  <div className="w-full sm:col-span-2 px-3 py-2 bg-slate-50/80 border border-gray-100 rounded-md text-sm text-gray-800 font-medium">
                    {nominee.name}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                  <span className="text-sm font-medium text-gray-500">Relationship</span>
                  <div className="w-full sm:col-span-2 px-3 py-2 bg-slate-50/80 border border-gray-100 rounded-md text-sm text-gray-800">
                    {nominee.relationship}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                  <span className="text-sm font-medium text-gray-500">NID / Passport Number</span>
                  <div className="w-full sm:col-span-2 px-3 py-2 bg-slate-50/80 border border-gray-100 rounded-md text-sm font-mono text-gray-800">
                    {nominee.nid}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                  <span className="text-sm font-medium text-gray-500">Share Allocation</span>
                  <div className="w-full sm:col-span-2 px-3 py-2 bg-slate-50/80 border border-gray-100 rounded-md text-sm text-gray-800 font-semibold text-cyan-700">
                    {nominee.share}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                  <span className="text-sm font-medium text-gray-500">Contact Number</span>
                  <div className="w-full sm:col-span-2 px-3 py-2 bg-slate-50/80 border border-gray-100 rounded-md text-sm font-mono text-gray-800">
                    {nominee.contact}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {/* ─── 3. BO TRADING & SETTLEMENT PREFERENCES (Mapped to public.bo_accounts) ─── */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 md:p-8 space-y-6">
          <h2 className="text-xs font-bold tracking-wider text-cyan-700 uppercase border-b border-gray-100 pb-2">
            3. BO Account & Trading Profiles
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <span className="text-sm font-medium text-gray-500">Account Type</span>
              <div className="w-full sm:col-span-2 px-3 py-2 bg-slate-50/80 border border-gray-100 rounded-md text-sm text-gray-800">
                {userData.boPrefs.accountType}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <span className="text-sm font-medium text-gray-500">Depository Participant (DP)</span>
              <div className="w-full sm:col-span-2 px-3 py-2 bg-slate-50/80 border border-gray-100 rounded-md text-sm text-gray-800">
                {userData.boPrefs.dp}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <span className="text-sm font-medium text-gray-500">Settlement Bank</span>
              <div className="w-full sm:col-span-2 px-3 py-2 bg-slate-50/80 border border-gray-100 rounded-md text-sm text-gray-800">
                {userData.boPrefs.bank}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <span className="text-sm font-medium text-gray-500">Bank Account Number</span>
              <div className="w-full sm:col-span-2 px-3 py-2 bg-slate-50/80 border border-gray-100 rounded-md text-sm font-mono text-gray-800">
                {userData.boPrefs.settlementAccount}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <span className="text-sm font-medium text-gray-500">TIN Number Reference</span>
              <div className="w-full sm:col-span-2 px-3 py-2 bg-slate-50/80 border border-gray-100 rounded-md text-sm font-mono text-gray-800">
                {userData.boPrefs.tin}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-2 pt-2">
              <span className="text-sm font-medium text-gray-500 pt-1">Market Segment Rights</span>
              <div className="w-full sm:col-span-2 flex flex-wrap gap-2">
                <span className={`px-3 py-1.5 rounded-md text-xs font-semibold ${userData.permissions.cash ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-400"}`}>
                  Cash Market {userData.permissions.cash ? "✓" : "✗"}
                </span>
                <span className={`px-3 py-1.5 rounded-md text-xs font-semibold ${userData.permissions.margin ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-400"}`}>
                  Margin Trading {userData.permissions.margin ? "✓" : "✗"}
                </span>
                <span className={`px-3 py-1.5 rounded-md text-xs font-semibold ${userData.permissions.foreign ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-400"}`}>
                  Foreign Remittance {userData.permissions.foreign ? "✓" : "✗"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── 4. LEGAL DECLARATION ─── */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 md:p-8">
          <label className="flex items-start cursor-pointer select-none group">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-5 h-5 mt-0.5 border-gray-300 rounded text-blue-600 focus:ring-blue-500/20 accent-blue-600 cursor-pointer"
            />
            <span className="ml-3 text-sm text-gray-600 leading-relaxed group-hover:text-gray-900 transition-colors">
              I hereby declare that all information provided in this electronic profile registry is accurate, updated, and matches my verified government identifiers completely.
            </span>
          </label>
        </div>

        {/* ─── WORKFLOW INTERACTION ACTIONS ─── */}
        <div className="w-full flex flex-col sm:flex-row justify-between gap-4 border-t border-slate-200/60 pt-6">
          <button
            onClick={() => router.back()}
            className="bg-gray-500 text-white px-8 py-3 rounded cursor-pointer transition-colors hover:bg-gray-600"
          >
            Back
          </button>

          <button
            disabled={!agreed}
            onClick={() => router.push("/register/submitted")}
            className={`px-10 py-3 rounded text-white font-semibold transition-all ${agreed ? "bg-blue-600 hover:bg-blue-700 cursor-pointer" : "bg-blue-300 cursor-not-allowed"}`}
          >
            Submit Application
          </button>
        </div>
      </div>
    </div>
  );
}