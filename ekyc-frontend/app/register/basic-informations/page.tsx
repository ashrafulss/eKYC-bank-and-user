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

  useEffect(() => {
    const loadBasicInformation = async () => {
      try {
        const data = await basicInformationService.getBasicInformations();
        setFormData((prev) => ({ ...prev, ...data }));
      } catch (error) {
        console.error("Failed to load basic information:", error);
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

  // Helper logic to validate the email string structure correctly
  const isValidEmail = (emailStr: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr.trim());
  };

  // Main evaluation: checks all necessary keys AND evaluates proper email form
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

  return (
    <div className="w-full min-h-screen bg-slate-50 overflow-y-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Block */}
        <div className="w-full mb-2">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Let's provide some primary information
          </h1>
        </div>

        {/* Form Container */}
        <form
          onSubmit={(e) => e.preventDefault()}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch"
        >
          {/* ─── LEFT COLUMN: PERSONAL INFORMATION ─── */}
          <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 md:p-8 space-y-6 flex flex-col justify-between">
            <div>
              <h2 className="text-xs font-bold tracking-wider text-cyan-700 uppercase border-b border-gray-100 pb-2 mb-6">
                Personal Information
              </h2>

              <div className="space-y-4">
                {/* Full Name (English) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                  <label className="text-sm font-medium text-gray-500">
                    Full Name (English) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fullNameEnglish}
                    onChange={(e) =>
                      handleChange("fullNameEnglish", e.target.value)
                    }
                    className="w-full sm:col-span-2 px-3 py-2 bg-slate-50 border border-gray-200 rounded-md text-sm text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                {/* Full Name (Bangla) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                  <label className="text-sm font-medium text-gray-500">
                    Full Name (Bangla) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fullNameBangla}
                    onChange={(e) => {
                      const filteredValue = e.target.value.replace(
                        /[^\u0980-\u09FF\s]/g,
                        "",
                      );
                      handleChange("fullNameBangla", filteredValue);
                    }}
                    placeholder="এখানে আপনার নাম লিখুন"
                    className="w-full sm:col-span-2 px-3 py-2 bg-slate-50 border border-gray-200 rounded-md text-sm text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                {/* Father's Name */}
                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                  <label className="text-sm font-medium text-gray-500">
                    Father's Name (Bangla){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fatherNameBangla}
                    onChange={(e) => {
                      const filteredValue = e.target.value.replace(
                        /[^\u0980-\u09FF\s]/g,
                        "",
                      );
                      handleChange("fatherNameBangla", filteredValue);
                    }}
                    className="w-full sm:col-span-2 px-3 py-2 bg-slate-50 border border-gray-200 rounded-md text-sm text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                {/* Mother's Name */}
                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                  <label className="text-sm font-medium text-gray-500">
                    Mother's Name (Bangla){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.motherNameBangla}
                    onChange={(e) => {
                      const filteredValue = e.target.value.replace(
                        /[^\u0980-\u09FF\s]/g,
                        "",
                      );
                      handleChange("motherNameBangla", filteredValue);
                    }}
                    className="w-full sm:col-span-2 px-3 py-2 bg-slate-50 border border-gray-200 rounded-md text-sm text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                {/* Date of Birth */}
                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                  <label className="text-sm font-medium text-gray-500">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => handleChange("dob", e.target.value)}
                    className="w-full sm:col-span-2 px-3 py-2 bg-slate-50 border border-gray-200 rounded-md text-sm text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                {/* Gender */}
                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                  <label className="text-sm font-medium text-gray-500">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleChange("gender", e.target.value)}
                    className="w-full sm:col-span-2 px-3 py-2 bg-slate-50 border border-gray-200 rounded-md text-sm text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* NID Number */}
                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                  <label className="text-sm font-medium text-gray-500">
                    NID Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nidNumber}
                    onChange={(e) => handleChange("nidNumber", e.target.value)}
                    className="w-full sm:col-span-2 px-3 py-2 bg-slate-50 border border-gray-200 rounded-md text-sm font-mono tracking-wide text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                {/* Mobile Number */}
                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                  <label className="text-sm font-medium text-gray-500">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => handleChange("mobile", e.target.value)}
                    className="w-full sm:col-span-2 px-3 py-2 bg-slate-50 border border-gray-200 rounded-md text-sm text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ─── RIGHT COLUMN: CONTACT & EMPLOYMENT ─── */}
          <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 md:p-8 flex flex-col justify-between">
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
        <div className="w-full mt-8 flex flex-col sm:flex-row justify-between items-center border-t border-gray-200 pt-6 gap-4">
          <button
            onClick={() => router.back()}
            className="bg-gray-500 text-white px-8 py-3 rounded cursor-pointer hover:bg-gray-600 transition-colors"
          >
            Back
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto justify-end">
            <button
              disabled={!isFormValid()}
              onClick={() => router.push("/register/nominee-bo")}
              className={`px-10 py-3 rounded text-white font-semibold transition-all ${
                isFormValid()
                  ? "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                  : "bg-blue-400 opacity-50 cursor-not-allowed"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
