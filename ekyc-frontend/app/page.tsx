"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();

  // State to manage modal open/close status
  const [showStepsModal, setShowStepsModal] = useState(false);

  const handleStartKYC = () => {
    router.push("/register/mobile-verification");
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-900">eKYC</h1>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Open Your Account in Minutes
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Experience hassle-free and quick account opening in just a few
              clicks! Complete your eKYC (Know Your Customer) verification
              securely.
            </p>

            <div className="space-y-4 mb-12">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center">
                  ✓
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Fast & Secure</h3>
                  <p className="text-gray-600">
                    Complete verification in under 10 minutes with advanced
                    security
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center">
                  ✓
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Multiple Document Options
                  </h3>
                  <p className="text-gray-600">
                    Support for various identity documents and verification
                    methods
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center">
                  ✓
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">24/7 Access</h3>
                  <p className="text-gray-600">
                    Complete your eKYC verification anytime, anywhere online
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setShowStepsModal(true)}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors cursor-pointer shadow-md"
              >
                Start Opening an Account
              </button>
              <button
                onClick={handleStartKYC}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors cursor-pointer shadow-md"
              >
                Login / Register
              </button>
            </div>
          </div>

          {/* Right Image/Info */}
          <div className="bg-blue-900 rounded-lg p-8 text-white">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold">eKYC Process Overview</h3>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div>
                    <p className="font-semibold">OTP Verification</p>
                    <p className="text-sm text-blue-100">
                      Verify your mobile number
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div>
                    <p className="font-semibold">Document Upload</p>
                    <p className="text-sm text-blue-100">
                      Capture NID & selfie
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <div>
                    <p className="font-semibold">Submit & Verify</p>
                    <p className="text-sm text-blue-100">Review and complete</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ACCOUNT OPENING STEPS MODAL OVERLAY ── */}
      {showStepsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-8 relative animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Heading block */}
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                Account Opening Steps
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                Average completion time is 9-12 minutes.
              </p>
            </div>

            {/* Vertical Timeline Track Container */}
            <div className="relative pl-8 space-y-6 before:absolute before:top-3 before:left-[15px] before:bottom-3 before:w-0.5 before:bg-blue-500">
              {/* Step 1 */}
              <div className="relative">
                <span className="absolute -left-[27px] top-0.5 bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-xs">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                </span>
                <div className="flex items-baseline gap-2">
                  <h4 className="font-bold text-sm text-gray-900">
                    NID Verification
                  </h4>
                  <span className="text-gray-400 text-xs">
                    (Approx Time: 1 Minutes)
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  NID will be verified.
                </p>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <span className="absolute -left-[27px] top-0.5 bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-xs">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <circle cx="12" cy="13" r="4" />
                    <path d="M5 7h3l2-3h4l2 3h3a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z" />
                  </svg>
                </span>
                <div className="flex items-baseline gap-2">
                  <h4 className="font-bold text-sm text-gray-900">
                    Liveness Check
                  </h4>
                  <span className="text-gray-400 text-xs">
                    (Approx Time: 1 Minutes)
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Real time face verification.
                </p>
              </div>

              {/* Step 3 */}

              <div className="relative">
                <span className="absolute -left-[27px] top-0.5 bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-xs">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2M19 21h-5m-4 0H3m7 0V11m0 10V7" />
                  </svg>
                </span>
                <div className="flex items-baseline gap-2">
                  <h4 className="font-bold text-sm text-gray-900">
                    Basic Informations
                  </h4>
                  <span className="text-gray-400 text-xs">
                    (Approx Time: 5-7 Minutes)
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Applicants details information.
                </p>

                {/* Embedded Sub-points List nested under Details layout section */}
                <ul className="mt-1.5 ml-3 list-disc list-inside text-gray-500 text-xs space-y-1">
                  <li>Personal information</li>
                  <li>Contact information</li>
                  <li>Nominee information</li>
                  <li>FATCA information</li>
                  <li>Alternate banking information</li>
                  <li>Document upload</li>
                </ul>
              </div>

              {/* Step 4 */}
              <div className="relative">
                <span className="absolute -left-[27px] top-0.5 bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-xs">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </span>
                <div className="flex items-baseline gap-2">
                  <h4 className="font-bold text-sm text-gray-900">
                    Preview And Submit
                  </h4>
                  <span className="text-gray-400 text-xs">
                    (Approx Time: 1 Minutes)
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Application preview and submit.
                </p>
              </div>
            </div>

            {/* Modal Bottom Call Actions alignment toolbar */}
            <div className="flex justify-end items-center gap-3 border-t border-gray-100 mt-8 pt-5">
              <button
                onClick={handleStartKYC}
                className="bg-amber-400 hover:bg-amber-500 text-gray-900 px-5 py-2.5 rounded-full font-bold text-sm tracking-wide transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                Start Now: <span className="text-base font-normal">→</span>
              </button>
              <button
                onClick={() => setShowStepsModal(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full font-bold text-sm tracking-wide transition-all active:scale-95 cursor-pointer shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <p className="text-center">© 2026 eKYC. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
