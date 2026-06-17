"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useEffect, useCallback } from "react";
import apiClient from "@/lib/api-client";

const OTP_TIMER = 60;

export default function MobileVerification() {
  const router = useRouter();

  const [mobile, setMobile] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(OTP_TIMER);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(OTP_TIMER);
    setCanResend(false);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);


  useEffect(() => {
    if (showModal) {
      setTimeout(() => inputsRef.current[0]?.focus(), 100);
    }
  }, [showModal]);


  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };


  const validateBD = (value: string) => /^1[3-9]\d{8}$/.test(value);

  const handleSendOTP = async () => {
    if (!validateBD(mobile)) {
      setError("Enter a valid Bangladeshi mobile number");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await apiClient.post("/auth/send-otp", {
        mobile: `+880${mobile}`,
        email: "ssajeebs@gmail.com",
        deliveryMethod: "both",
      });

      setOtp(["", "", "", "", "", ""]);
      setShowModal(true);
      startTimer();
    } catch (err: any) {
      setError(err.message || "Failed to deliver OTP request. Please retry.");
    } finally {
      setLoading(false);
    }
  };


  const handleResend = async () => {
    if (!canResend) return;
    setLoading(true);

    try {
      await apiClient.post("/auth/send-otp", {
        mobile: `+880${mobile}`,
        email: "ssajeebs@gmail.com",
        deliveryMethod: "both",
      });
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => inputsRef.current[0]?.focus(), 100);
      startTimer();
    } catch (err: any) {
      alert(err.message || "Resend request failed.");
    } finally {
      setLoading(false);
    }
  };


  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputsRef.current[index + 1]?.focus();
  };

 
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  
const handleVerify = async () => {
  const fullOtp = otp.join("");
  if (fullOtp.length !== 6) {
    alert("Enter full 6-digit verification code");
    return;
  }

  setVerifying(true);
  try {
    const response = await apiClient.post("/auth/verify-otp", {
      mobile: `+880${mobile}`,
      otpCode: fullOtp,
    });

    
    const token = response.data?.data?.accessToken;

    if (timerRef.current) clearInterval(timerRef.current);
    setShowModal(false);
    setOtp(["", "", "", "", "", ""]);


    const isProduction = process.env.NODE_ENV === "production";
    const secureFlag = isProduction ? "; Secure" : "";

    if (token) {
      document.cookie = `next_auth_session=${token}; path=/; max-age=3600; SameSite=Strict${secureFlag}`;
    }

    document.cookie = `reg_step=mobile_verified; path=/; max-age=1800; SameSite=Strict${secureFlag}`;

    router.push("/register/nid-verification");
  } catch (err: any) {
    alert(
      err.message || "Invalid validation code or attempts limit exceeded.",
    );
  } finally {
    setVerifying(false);
  }
};

 
  const handleClose = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setShowModal(false);
    setOtp(["", "", "", "", "", ""]);
  };

  const maskMobileNumber = (number: string) => {
    if (number.length <= 4) return number;
    return `****** ${number.slice(-4)}`;
  };

  return (
    <div className="w-full bg-slate-50 overflow-y-auto py-20 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="max-w-md w-full">
        <div className="w-full mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            eKYC Registration
          </h1>
        </div>

        {/* MAIN CARD */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 md:p-8 space-y-6">
          <div>
            <h2 className="text-xs font-bold tracking-wider text-cyan-700 uppercase border-b border-gray-100 pb-2 mb-5">
              Mobile Identity Onboarding
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-2">
                <label className="text-sm font-medium text-gray-500">
                  Mobile Number
                </label>
                <div className="flex">
                  <div className="px-3 flex items-center bg-slate-50 border border-gray-200 border-r-0 rounded-l-md text-sm text-gray-500 font-medium select-none">
                    🇧🇩 +880
                  </div>
                  <input
                    type="tel"
                    value={mobile}
                    disabled={loading}
                    maxLength={10}
                    onChange={(e) => {
                      setMobile(e.target.value.replace(/\D/g, "").slice(0, 10));
                      setError("");
                    }}
                    placeholder="1XXXXXXXXX"
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-r-md text-sm text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all disabled:opacity-60"
                  />
                </div>
                {error && (
                  <p className="text-red-500 text-xs mt-1 font-medium pl-1">
                    {error}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Verification Trigger Button */}
          <div className="pt-2 border-t border-gray-100 flex justify-end">
            <button
              type="button"
              onClick={handleSendOTP}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md shadow-blue-200 text-sm tracking-wide text-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </div>
        </div>
      </div>

      {/* ── OTP MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-[380px] p-6 md:p-8 rounded-xl shadow-xl border border-gray-100 space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Enter Verification Code
              </h2>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                Please enter the Customer Authentication Code sent to your
                mobile number.
                <br />
                <span className="font-semibold text-slate-800 text-sm tracking-wide inline-block mt-0.5">
                  +880 {maskMobileNumber(mobile)}
                </span>
              </p>
            </div>

            {/* OTP BOXES */}
            <div className="flex justify-between gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputsRef.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  disabled={verifying}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="w-11 h-12 text-center border border-gray-200 rounded-md text-lg font-bold bg-slate-50 text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all disabled:opacity-60"
                />
              ))}
            </div>

            {/* ── TIMER + RESEND ── */}
            <div className="flex items-center justify-between px-0.5">
              {!canResend ? (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <svg
                    className="w-3.5 h-3.5 text-cyan-700 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <circle cx="12" cy="12" r="10" strokeDasharray="30 30" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  <span>
                    Resend in{" "}
                    <span className="font-semibold text-cyan-700 tabular-nums">
                      {formatTime(timeLeft)}
                    </span>
                  </span>
                </div>
              ) : (
                <p className="text-xs text-gray-400">Didn't receive code?</p>
              )}

              <button
                type="button"
                onClick={handleResend}
                disabled={!canResend || loading}
                className={`text-xs font-bold transition-colors ${
                  canResend && !loading
                    ? "text-blue-600 hover:text-blue-700 cursor-pointer"
                    : "text-gray-300 cursor-not-allowed"
                }`}
              >
                {loading ? "Requesting..." : "Resend OTP"}
              </button>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={handleClose}
                disabled={verifying}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2.5 rounded-lg font-medium transition-colors text-sm cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerify}
                disabled={verifying}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium shadow-md shadow-blue-100 transition-colors text-sm cursor-pointer flex items-center justify-center disabled:opacity-50"
              >
                {verifying ? "Verifying..." : "Verify"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
