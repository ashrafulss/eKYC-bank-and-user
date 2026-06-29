"use client";

import React from "react";

export default function BoDetailsPage() {
    // Static mock data mimicking a successfully processed BO Account application
    const boAccountDetails = {
        accountDetails: {
            accountType: "Individual",
            boId: "1203000067891234",
            boStatus: "Active",
            boCategory: "Regular",
            dpName: "Spectrum Securities & Consultants Ltd. (DP 300)",
            openDate: "2026-06-28",
        },
        holderInformation: {
            fullName: "Anika Chowdhury",
            nid: "5509823412",
            dob: "1996-05-20",
            contact: "+8801712345678",
            email: "anika.c@spectrum-bd.com",
            tin: "412356789012",
        },
        bankDetails: {
            bankName: "Dutch-Bangla Bank PLC",
            branchName: "Gulshan Branch",
            accountNumber: "117.110.456123",
            routingNumber: "090261345",
        },
        permissions: {
            cash: true,
            margin: true,
            foreign: false,
        },
    };

    return (
        <div className="w-full min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header Section */}
                <div className="border-b border-gray-200 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                            BO Account Profile
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Review registered depository participant and routing setup preferences.
                        </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Verified Profile
                    </span>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Section 1: Account Parameters */}
                    <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 space-y-4">
                        <h2 className="text-xs font-bold tracking-wider text-cyan-700 uppercase border-b border-gray-50 pb-2">
                            Account Parameters
                        </h2>
                        <div className="space-y-3">
                            {[
                                { label: "Account Type", value: boAccountDetails.accountDetails.accountType },
                                { label: "BO ID Reference", value: boAccountDetails.accountDetails.boId, mono: true },
                                { label: "Account Status", value: boAccountDetails.accountDetails.boStatus },
                                { label: "BO Category", value: boAccountDetails.accountDetails.boCategory },
                                { label: "Depository Participant", value: boAccountDetails.accountDetails.dpName },
                            ].map(({ label, value, mono }) => (
                                <div key={label} className="grid grid-cols-3 text-sm">
                                    <span className="text-gray-500 font-medium">{label}</span>
                                    <span className={`col-span-2 text-slate-800 font-semibold ${mono ? "font-mono text-cyan-800" : ""}`}>
                                        {value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section 2: Trading Permissions */}
                    <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 space-y-4">
                        <h2 className="text-xs font-bold tracking-wider text-cyan-700 uppercase border-b border-gray-50 pb-2">
                            Trading Permissions
                        </h2>
                        <div className="space-y-3">
                            {[
                                { label: "Cash Account Tier", active: boAccountDetails.permissions.cash },
                                { label: "Margin Provisioning", active: boAccountDetails.permissions.margin },
                                { label: "Foreign Portfolio Gateway", active: boAccountDetails.permissions.foreign },
                            ].map(({ label, active }) => (
                                <div key={label} className="flex items-center justify-between text-sm py-0.5">
                                    <span className="text-gray-500 font-medium">{label}</span>
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold ${active
                                            ? "bg-blue-50 border border-blue-200 text-blue-700"
                                            : "bg-slate-100 text-slate-400"
                                        }`}>
                                        {active ? "Enabled ✓" : "Disabled ✗"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section 3: Primary Holder Details */}
                    <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 space-y-4 md:col-span-2">
                        <h2 className="text-xs font-bold tracking-wider text-cyan-700 uppercase border-b border-gray-50 pb-2">
                            Primary Account Holder Information
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            {[
                                { label: "Full Name", value: boAccountDetails.holderInformation.fullName },
                                { label: "National ID (NID)", value: boAccountDetails.holderInformation.nid, mono: true },
                                { label: "Date of Birth", value: boAccountDetails.holderInformation.dob },
                                { label: "Contact Reference", value: boAccountDetails.holderInformation.contact },
                                { label: "Electronic Mail", value: boAccountDetails.holderInformation.email },
                                { label: "TIN Tax Number", value: boAccountDetails.holderInformation.tin, mono: true },
                            ].map(({ label, value, mono }) => (
                                <div key={label} className="grid grid-cols-3 sm:grid-cols-4 items-center">
                                    <span className="text-gray-500 font-medium col-span-1">{label}</span>
                                    <span className={`col-span-2 sm:col-span-3 text-slate-800 font-semibold ${mono ? "font-mono" : ""}`}>
                                        {value || "—"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section 4: Clearing & Settlement Bank Mapping */}
                    <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 space-y-4 md:col-span-2">
                        <h2 className="text-xs font-bold tracking-wider text-cyan-700 uppercase border-b border-gray-50 pb-2">
                            Clearing & Settlement Bank Mapping
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            {[
                                { label: "Settlement Bank", value: boAccountDetails.bankDetails.bankName },
                                { label: "Routing Code", value: boAccountDetails.bankDetails.routingNumber, mono: true },
                                { label: "Branch Location", value: boAccountDetails.bankDetails.branchName },
                                { label: "Account Number", value: boAccountDetails.bankDetails.accountNumber, mono: true },
                            ].map(({ label, value, mono }) => (
                                <div key={label} className="grid grid-cols-3 sm:grid-cols-4 items-center">
                                    <span className="text-gray-500 font-medium col-span-1">{label}</span>
                                    <span className={`col-span-2 sm:col-span-3 text-slate-800 font-semibold ${mono ? "font-mono" : ""}`}>
                                        {value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}