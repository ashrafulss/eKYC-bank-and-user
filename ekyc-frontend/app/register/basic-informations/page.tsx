"use client";

import BanglaField from "@/app/components/BanglaField";
import {
  BasicInformationsData,
  basicInformationService,
} from "@/app/services/basic.information.service";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";


export default function BasicInformations() {
  const router = useRouter();

  const [formData, setFormData] = useState<BasicInformationsData>({
    fullNameEnglish: "",
    fullNameBangla: "",
    fatherNameBangla: "",
    motherNameBangla: "",
    dob: "",
    gender: "Male",
    nidNumber: "",
    mobile: "",
    presentAddress: "",
    email: "",
    occupation: "",
    employer: "",
    monthlyIncome: "Below BDT 50,000",
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setErrorMessage(null);
        const data = await basicInformationService.getBasicInformations();
        if (data.dob) {
          const d = new Date(data.dob);
          if (!isNaN(d.getTime())) data.dob = d.toISOString().split("T")[0];
        }
        setFormData((prev) => ({ ...prev, ...data }));
      } catch (error: any) {
        setErrorMessage(error.message || "Could not retrieve identity details.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (field: keyof typeof formData, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  const isFormValid = () =>
    formData.fullNameEnglish.trim() !== "" &&
    formData.fullNameBangla.trim() !== "" &&
    formData.fatherNameBangla.trim() !== "" &&
    formData.motherNameBangla.trim() !== "" &&
    isValidEmail(formData.email) &&
    formData.nidNumber.trim() !== "" &&
    formData.dob.trim() !== "" &&
    formData.mobile.trim() !== "";

  const handleNextStep = async () => {
    if (!isFormValid() || submitting) return;
    try {
      setSubmitting(true);
      setErrorMessage(null);
      await basicInformationService.updateBasicInformations(formData);
      router.push("/register/nominee");
    } catch (error: any) {
      setErrorMessage(error.message || "Something went wrong while saving.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 font-medium">Fetching verified identity records...</p>
        </div>
      </div>
    );
  }

  const inputStyles =
    "w-full sm:col-span-2 px-3 py-2 bg-slate-50 border border-gray-200 rounded-md text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white";
  const readOnlyStyles =
    "w-full sm:col-span-2 px-3 py-2 bg-slate-100 border border-gray-200 rounded-md text-sm text-gray-500 cursor-not-allowed select-none";

  return (
    <div className="w-full min-h-screen bg-slate-50 overflow-y-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">

        {errorMessage && (
          <div className="w-full p-4 mb-6 bg-red-50 border-l-4 border-red-500 rounded-r-md text-sm text-red-700">
            <strong>Action Blocked:</strong> {errorMessage}
          </div>
        )}

        <div className="w-full mb-6">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Verify your primary information
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review and complete your personal details below.
          </p>
        </div>

        <form
          onSubmit={(e) => e.preventDefault()}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start"
        >
          {/* ── LEFT: Personal Information ── */}
          <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 md:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h2 className="text-xs font-bold tracking-wider text-cyan-700 uppercase">
                Personal Information
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <label className="text-sm font-medium text-gray-500">
                Full Name (English) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.fullNameEnglish}
                onChange={(e) => handleChange("fullNameEnglish", e.target.value)}
                className={inputStyles}
              />
            </div>

            {/* Reusable Standalone Bangla Fields */}
            <BanglaField
              label="Full Name (Bangla)"
              value={formData.fullNameBangla}
              onChange={(v) => handleChange("fullNameBangla", v)}
              required
              inputStyles={inputStyles}
            />

            <BanglaField
              label="Father's Name (Bangla)"
              value={formData.fatherNameBangla}
              onChange={(v) => handleChange("fatherNameBangla", v)}
              required
              inputStyles={inputStyles}
            />

            <BanglaField
              label="Mother's Name (Bangla)"
              value={formData.motherNameBangla}
              onChange={(v) => handleChange("motherNameBangla", v)}
              required
              inputStyles={inputStyles}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <label className="text-sm font-medium text-gray-500">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => handleChange("dob", e.target.value)}
                className={inputStyles}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <label className="text-sm font-medium text-gray-500">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => handleChange("gender", e.target.value)}
                className={inputStyles}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <label className="text-sm font-medium text-gray-500">
                NID Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nidNumber}
                onChange={(e) => handleChange("nidNumber", e.target.value)}
                className={`${inputStyles} font-mono tracking-wide`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <label className="text-sm font-medium text-gray-500">
                Mobile Number
                <span className="text-[10px] ml-1 text-emerald-600 font-semibold">(Verified)</span>
              </label>
              <input
                type="tel"
                value={formData.mobile}
                readOnly
                className={readOnlyStyles}
              />
            </div>
          </div>

          {/* ── RIGHT: Contact & Employment ── */}
          <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 md:p-8 space-y-4">
            <h2 className="text-xs font-bold tracking-wider text-cyan-700 uppercase border-b border-gray-100 pb-2">
              Contact & Employment
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <label className="text-sm font-medium text-gray-500">Present Address</label>
              <input
                type="text"
                value={formData.presentAddress}
                onChange={(e) => handleChange("presentAddress", e.target.value)}
                className={inputStyles}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-2">
              <label className="text-sm font-medium text-gray-500 mt-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="w-full sm:col-span-2 space-y-1">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-md text-sm text-gray-800 focus:outline-none focus:ring-2 focus:bg-white ${formData.email && !isValidEmail(formData.email)
                    ? "border-red-400 focus:ring-red-400"
                    : "border-gray-200 focus:ring-blue-500"
                    }`}
                />
                {formData.email && !isValidEmail(formData.email) && (
                  <p className="text-xs text-red-500">Please enter a valid email address</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <label className="text-sm font-medium text-gray-500">Occupation</label>
              <input
                type="text"
                value={formData.occupation}
                onChange={(e) => handleChange("occupation", e.target.value)}
                className={inputStyles}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <label className="text-sm font-medium text-gray-500">Employer Name</label>
              <input
                type="text"
                value={formData.employer}
                onChange={(e) => handleChange("employer", e.target.value)}
                className={inputStyles}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <label className="text-sm font-medium text-gray-500">Monthly Income</label>
              <select
                value={formData.monthlyIncome}
                onChange={(e) => handleChange("monthlyIncome", e.target.value)}
                className={inputStyles}
              >
                <option value="Below BDT 50,000">Below BDT 50,000</option>
                <option value="BDT 50,000 - 100,000">BDT 50,000 - 100,000</option>
                <option value="BDT 100,000 - 500,000">BDT 100,000 - 500,000</option>
                <option value="BDT 500,000 - 1,000,000 / month">BDT 500,000 - 1,000,000 / month</option>
                <option value="Above BDT 1,000,000">Above BDT 1,000,000</option>
              </select>
            </div>

          </div>
        </form>

        {/* ── Footer ── */}
        <div className="w-full mt-8 flex justify-end border-t border-gray-200 pt-6">
          <button
            disabled={!isFormValid() || submitting}
            onClick={handleNextStep}
            className={`px-10 py-3 rounded text-white font-semibold transition-all flex items-center gap-2 ${isFormValid() && !submitting
              ? "bg-blue-600 hover:bg-blue-700 cursor-pointer"
              : "bg-blue-400 opacity-50 cursor-not-allowed"
              }`}
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : "Next"}
          </button>
        </div>

      </div>
    </div>
  );
}