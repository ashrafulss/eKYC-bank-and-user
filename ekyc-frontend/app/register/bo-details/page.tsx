"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { boApiService } from "../../services/bo.service";

interface BoFormData {
    accountType: string;
    dpName: string;
    tin: string;
    bankName: string;
    accountNumber: string;
    cash: boolean;
    margin: boolean;
    foreign: boolean;
}

export default function BoDetailsPage() {
    const router = useRouter();

    const [formData, setFormData] = useState<BoFormData>({
        accountType: "Individual",
        dpName: "",
        tin: "",
        bankName: "",
        accountNumber: "",
        cash: true,
        margin: false,
        foreign: false,
    });
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);



    const set = (field: keyof BoFormData, value: string | boolean) =>
        setFormData((prev) => ({ ...prev, [field]: value }));

    const isFormValid = () =>
        formData.dpName.trim() !== "" &&
        formData.bankName.trim() !== "" &&
        formData.accountNumber.trim() !== "";

    const handleSubmit = async () => {
        if (!isFormValid() || submitting) return;
        try {
            setSubmitting(true);
            setErrorMessage(null);
            await boApiService.saveBoDetails({
                accountType: formData.accountType,
                depositoryParticipant: formData.dpName,
                bankName: formData.bankName,
                settlementAccount: formData.accountNumber,
                tinNumber: formData.tin,
                permissionCash: formData.cash,
                permissionMargin: formData.margin,
                permissionForeign: formData.foreign,
            });
            router.push("/register/review");
        } catch (err: any) {
            setErrorMessage(err.message || "Submission failed. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const inStyles =
        "w-full sm:col-span-2 px-3 py-2 bg-slate-50 border border-gray-200 rounded-md text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white";

    if (loading) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center space-y-3">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-gray-500 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">

                {errorMessage && (
                    <div className="p-4 mb-6 bg-red-50 border-l-4 border-red-500 rounded-r-md text-sm text-red-700">
                        <strong>Error:</strong> {errorMessage}
                    </div>
                )}

                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">BO Account Opening</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Fill in your depository participant and bank settlement details to open your Beneficiary Owner account.
                    </p>
                </div>

                <div className="space-y-6">

                    {/* ── BO Account Details ── */}
                    <div className="bg-white rounded-xl border border-gray-100 p-6 md:p-8 space-y-4">
                        <h2 className="text-xs font-bold tracking-wider text-cyan-700 uppercase border-b border-gray-100 pb-3">
                            BO Account Details
                        </h2>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                                <label className="text-sm font-medium text-gray-500">Account Type</label>
                                <select
                                    value={formData.accountType}
                                    onChange={(e) => set("accountType", e.target.value)}
                                    className={inStyles}
                                >
                                    <option value="Individual">Individual</option>
                                    <option value="Joint">Joint</option>
                                    <option value="Corporate">Corporate</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                                <label className="text-sm font-medium text-gray-500">
                                    Depository Participant <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Spectrum Securities (DP 300)"
                                    value={formData.dpName}
                                    onChange={(e) => set("dpName", e.target.value)}
                                    className={inStyles}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                                <label className="text-sm font-medium text-gray-500">TIN Number</label>
                                <input
                                    type="text"
                                    placeholder="12-digit TIN"
                                    value={formData.tin}
                                    onChange={(e) => set("tin", e.target.value)}
                                    className={`${inStyles} font-mono`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── Settlement Bank ── */}
                    <div className="bg-white rounded-xl border border-gray-100 p-6 md:p-8 space-y-4">
                        <h2 className="text-xs font-bold tracking-wider text-cyan-700 uppercase border-b border-gray-100 pb-3">
                            Clearing & Settlement Bank
                        </h2>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                                <label className="text-sm font-medium text-gray-500">
                                    Bank Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Dutch-Bangla Bank PLC"
                                    value={formData.bankName}
                                    onChange={(e) => set("bankName", e.target.value)}
                                    className={inStyles}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                                <label className="text-sm font-medium text-gray-500">
                                    Account Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. 117.110.456123"
                                    value={formData.accountNumber}
                                    onChange={(e) => set("accountNumber", e.target.value)}
                                    className={`${inStyles} font-mono`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── Trading Permissions ── */}
                    <div className="bg-white rounded-xl border border-gray-100 p-6 md:p-8">
                        <h2 className="text-xs font-bold tracking-wider text-cyan-700 uppercase border-b border-gray-100 pb-3 mb-4">
                            Trading Permissions
                        </h2>
                        {(["cash", "margin", "foreign"] as const).map((key) => {
                            const meta = {
                                cash: { label: "Cash Market", desc: "Standard equity trading" },
                                margin: { label: "Margin Market", desc: "Leveraged positions" },
                                foreign: { label: "Foreign Portfolio", desc: "International securities" },
                            }[key];
                            return (
                                <label
                                    key={key}
                                    className="flex items-center justify-between cursor-pointer py-3 border-b border-gray-50 last:border-0"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">{meta.label}</p>
                                        <p className="text-xs text-gray-400">{meta.desc}</p>
                                    </div>
                                    <div className="relative ml-4 shrink-0">
                                        <input
                                            type="checkbox"
                                            checked={formData[key]}
                                            onChange={(e) => set(key, e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-10 h-5 bg-gray-200 peer-checked:bg-blue-600 rounded-full transition-colors" />
                                        <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                                    </div>
                                </label>
                            );
                        })}
                    </div>

                </div>

                {/* ── Footer ── */}
                <div className="w-full mt-8 flex justify-end border-t border-gray-200 pt-6">
                    <button
                        disabled={!isFormValid() || submitting}
                        onClick={handleSubmit}
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
                        ) : "Next →"}
                    </button>
                </div>

            </div>
        </div>
    );
}