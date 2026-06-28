"use client";

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
    const loadBasicInformation = async () => {
      try {
        setLoading(true);
        setErrorMessage(null);
        
        const data = await basicInformationService.getBasicInformations();
        
        if (data.dob) {
          const dateObj = new Date(data.dob);
          if (!isNaN(dateObj.getTime())) {
            data.dob = dateObj.toISOString().split("T")[0];
          }
        }

        setFormData((prev) => ({ ...prev, ...data }));
      } catch (error: any) {
        console.error("Failed to load pre-populated basic information profile:", error);
        setErrorMessage(error.message || "Could not retrieve identity details.");
      } finally {
        setLoading(false);
      }
    };

    loadBasicInformation();
  }, []);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNextStep = async () => {
    if (!isFormValid() || submitting) return;
    
    try {
      setSubmitting(true);
      setErrorMessage(null);
      
      await basicInformationService.updateBasicInformations(formData);
      router.push("/register/nominee");
    } catch (error: any) {
      console.error("Failed to persist basic info amendments:", error);
      setErrorMessage(error.message || "Something went wrong while preserving updates.");
    } finally {
      setSubmitting(false);
    }
  };

  const isValidEmail = (emailStr: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr.trim());
  };

  const isFormValid = () => {
    return (
      formData.fullNameEnglish.trim() !== "" &&
      formData.fullNameBangla.trim() !== "" &&
      formData.fatherNameBangla.trim() !== "" &&
      formData.motherNameBangla.trim() !== "" &&
      isValidEmail(formData.email) &&
      formData.nidNumber.trim() !== "" &&
      formData.dob.trim() !== "" &&
      formData.mobile.trim() !== ""
    );
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-500 font-medium">Fetching verified identity records...</p>
        </div>
      </div>
    );
  }

  // Common Tailwind classes for fields locked down by NID verification
  const readOnlyInputStyles = "w-full sm:col-span-2 px-3 py-2 bg-slate-100 border border-gray-200 rounded-md text-sm text-gray-500 cursor-not-allowed select-none focus:outline-hidden";

  return (
    <div className="w-full min-h-screen bg-slate-50 overflow-y-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {errorMessage && (
          <div className="w-full p-4 mb-6 bg-red-50 border-l-4 border-red-500 rounded-r-md text-sm text-red-700">
            <strong>Action Blocked:</strong> {errorMessage}
          </div>
        )}

        <div className="w-full mb-2">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Verify your primary information
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            These fields have been successfully extracted and verified from your uploaded NID identity card.
          </p>
        </div>

        <form
          onSubmit={(e) => e.preventDefault()}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch"
        >
          {/* ─── LEFT COLUMN: PERSONAL INFORMATION (ALL READ-ONLY) ─── */}
          <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 md:p-8 space-y-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-6">
                <h2 className="text-xs font-bold tracking-wider text-cyan-700 uppercase">
                  Personal Information
                </h2>
                <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold px-2 py-0.5 rounded-sm flex items-center gap-1">
                  🔒 NID Verified
                </span>
              </div>

              <div className="space-y-4">
                {/* Full Name (English) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                  <label className="text-sm font-medium text-gray-400">
                    Full Name (English)
                  </label>
                  <input
                    type="text"
                    value={formData.fullNameEnglish}
                    readOnly
                    className={readOnlyInputStyles}
                  />
                </div>

                {/* Full Name (Bangla) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                  <label className="text-sm font-medium text-gray-400">
                    Full Name (Bangla)
                  </label>
                  <input
                    type="text"
                    value={formData.fullNameBangla}
                    readOnly
                    className={readOnlyInputStyles}
                  />
                </div>

                {/* Father's Name */}
                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                  <label className="text-sm font-medium text-gray-400">
                    Father's Name (Bangla)
                  </label>
                  <input
                    type="text"
                    value={formData.fatherNameBangla}
                    readOnly
                    className={readOnlyInputStyles}
                  />
                </div>

                {/* Mother's Name */}
                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                  <label className="text-sm font-medium text-gray-400">
                    Mother's Name (Bangla)
                  </label>
                  <input
                    type="text"
                    value={formData.motherNameBangla}
                    readOnly
                    className={readOnlyInputStyles}
                  />
                </div>

                {/* Date of Birth */}
                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                  <label className="text-sm font-medium text-gray-400">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dob}
                    readOnly
                    className={readOnlyInputStyles}
                  />
                </div>

                {/* Gender */}
                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                  <label className="text-sm font-medium text-gray-400">
                    Gender
                  </label>
                  <input
                    type="text"
                    value={formData.gender}
                    readOnly
                    className={readOnlyInputStyles}
                  />
                </div>

                {/* NID Number */}
                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                  <label className="text-sm font-medium text-gray-400">
                    NID Number
                  </label>
                  <input
                    type="text"
                    value={formData.nidNumber}
                    readOnly
                    className={`${readOnlyInputStyles} font-mono tracking-wide`}
                  />
                </div>

                {/* Mobile Number */}
                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                  <label className="text-sm font-medium text-gray-400 flex flex-wrap items-center">
                    <span>Mobile Number</span>
                    <span className="text-[10px] ml-1 text-emerald-600 font-semibold block sm:inline">
                      (Verified)
                    </span>
                  </label>
                  <input
                    type="tel"
                    value={formData.mobile}
                    readOnly
                    className={readOnlyInputStyles}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ─── RIGHT COLUMN: CONTACT & EMPLOYMENT (STILL EDITABLE) ─── */}
          <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 md:p-8 space-y-6 flex flex-col justify-between">
            <div className="lg:sticky lg:top-6 w-full">
              <h2 className="text-xs font-bold tracking-wider text-cyan-700 uppercase border-b border-gray-100 pb-2 mb-6">
                Contact & Employment
              </h2>

              <div className="space-y-4">
                {/* Present Address */}
                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                  <label className="text-sm font-medium text-gray-500">
                    Present Address
                  </label>
                  <input
                    type="text"
                    value={formData.presentAddress}
                    onChange={(e) =>
                      handleChange("presentAddress", e.target.value)
                    }
                    className="w-full sm:col-span-2 px-3 py-2 bg-slate-50 border border-gray-200 rounded-md text-sm text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                {/* Email Address */}
                <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-2">
                  <label className="text-sm font-medium text-gray-500 mt-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="w-full sm:col-span-2 space-y-1">
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className={`w-full px-3 py-2 bg-slate-50 border rounded-md text-sm text-gray-800 focus:outline-hidden focus:ring-2 focus:bg-white ${
                        formData.email && !isValidEmail(formData.email)
                          ? "border-red-400 focus:ring-red-400"
                          : "border-gray-200 focus:ring-blue-500"
                      }`}
                    />
                    {formData.email && !isValidEmail(formData.email) && (
                      <p className="text-xs text-red-500">
                        Please enter a valid email address
                      </p>
                    )}
                  </div>
                </div>

                {/* Occupation */}
                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                  <label className="text-sm font-medium text-gray-500">
                    Occupation
                  </label>
                  <input
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => handleChange("occupation", e.target.value)}
                    className="w-full sm:col-span-2 px-3 py-2 bg-slate-50 border border-gray-200 rounded-md text-sm text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                {/* Employer Name */}
                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                  <label className="text-sm font-medium text-gray-500">
                    Employer Name
                  </label>
                  <input
                    type="text"
                    value={formData.employer}
                    onChange={(e) => handleChange("employer", e.target.value)}
                    className="w-full sm:col-span-2 px-3 py-2 bg-slate-50 border border-gray-200 rounded-md text-sm text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                {/* Monthly Income Range */}
                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                  <label className="text-sm font-medium text-gray-500">
                    Monthly Income
                  </label>
                  <select
                    value={formData.monthlyIncome}
                    onChange={(e) =>
                      handleChange("monthlyIncome", e.target.value)
                    }
                    className="w-full sm:col-span-2 px-3 py-2 bg-slate-50 border border-gray-200 rounded-md text-sm text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  >
                    <option value="Below BDT 50,000">Below BDT 50,000</option>
                    <option value="BDT 50,000 - 100,000">
                      BDT 50,000 - 100,000
                    </option>
                    <option value="BDT 100,000 - 500,000">
                      BDT 100,000 - 500,000
                    </option>
                    <option value="BDT 500,000 - 1,000,000 / month">
                      BDT 500,000 - 1,000,000 / month
                    </option>
                    <option value="Above BDT 1,000,000">
                      Above BDT 1,000,000
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Global Footer Buttons */}
        <div className="w-full mt-8 flex flex-col sm:flex-row justify-end items-center border-t border-gray-200 pt-6 gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto justify-end">
            <button
              disabled={!isFormValid() || submitting}
              onClick={handleNextStep}
              className={`w-full sm:w-auto px-10 py-3 rounded text-white font-semibold transition-all flex items-center justify-center gap-2 ${
                isFormValid() && !submitting
                  ? "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                  : "bg-blue-400 opacity-50 cursor-not-allowed"
              }`}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                "Next"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}