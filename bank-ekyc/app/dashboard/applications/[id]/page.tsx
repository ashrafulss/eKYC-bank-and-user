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
  FileText,
  Users,
  Building,
  ZoomIn,
  X,
} from "lucide-react";

// ── TYPES ──────────────────────────────────────────────────────
type Role = "checker" | "maker";

type AppStatus =
  | "pending"
  | "under_review"
  | "checker_approved"
  | "checker_rejected"
  | "info_requested"
  | "approved"
  | "rejected";

// ── STATUS MAPS (outside component) ───────────────────────────
const STATUS_STYLE: Record<AppStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  under_review: "bg-blue-100 text-blue-700",
  checker_approved: "bg-cyan-100 text-cyan-700",
  checker_rejected: "bg-orange-100 text-orange-700",
  info_requested: "bg-purple-100 text-purple-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const STATUS_LABEL: Record<AppStatus, string> = {
  pending: "Pending",
  under_review: "Under Review",
  checker_approved: "Sent to Maker",
  checker_rejected: "Checker Rejected",
  info_requested: "Info Requested",
  approved: "Approved",
  rejected: "Rejected",
};

// ── PAGE PROPS ─────────────────────────────────────────────────
interface PageProps {
  params: Promise<{ id: string }>;
}

// ── IMAGE MODAL ────────────────────────────────────────────────
function ImageModal({
  src,
  label,
  onClose,
}: {
  src: string;
  label: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl overflow-hidden max-w-2xl w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-700">{label}</span>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>
        <div className="p-4 bg-gray-50 flex items-center justify-center min-h-64">
          <img
            src={src}
            alt={label}
            className="max-w-full max-h-[70vh] object-contain rounded"
          />
        </div>
      </div>
    </div>
  );
}

// ── SECTION CARD ───────────────────────────────────────────────
function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
        <div className="p-1.5 bg-blue-50 text-blue-700 rounded-md">{icon}</div>
        <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
          {title}
        </h3>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ── FIELD ROW ──────────────────────────────────────────────────
function FieldRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span
        className={`text-sm font-medium text-gray-900 ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

// ── NID IMAGE CARD ─────────────────────────────────────────────
function NIDImageCard({
  label,
  placeholder,
  onView,
}: {
  label: string;
  placeholder: string;
  onView: () => void;
}) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {label}
        </p>
      </div>
      <div
        className="h-40 bg-gray-100 flex flex-col items-center justify-center gap-3 relative group cursor-pointer"
        onClick={onView}
      >
        <div className="w-24 h-16 bg-white border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
          <FileText size={20} className="text-gray-300" />
        </div>
        <span className="text-xs text-gray-400">{placeholder}</span>
        <div className="absolute inset-0 bg-blue-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-semibold">
          <ZoomIn size={16} />
          View Full Image
        </div>
      </div>
    </div>
  );
}

// ── AUDIT LOG ──────────────────────────────────────────────────
function AuditLog({
  logs,
}: {
  logs: { action: string; by: string; time: string }[];
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-xs p-6">
      <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-4">
        Audit Trail
      </h3>
      <div className="space-y-3">
        {logs.map((log, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-gray-700">{log.action}</p>
              <p className="text-xs text-gray-400">
                {log.by} · {log.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── PAGE ───────────────────────────────────────────────────────
export default function ApplicationDetailPage({ params }: PageProps) {
  const unwrappedParams = use(params);

  // TODO: get from real auth/session context configuration
  const [userRole] = useState<Role>("checker");

  const [appStatus, setAppStatus] = useState<AppStatus>("pending");
  const [checkerNote, setCheckerNote] = useState("");
  const [makerNote, setMakerNote] = useState("");
  const [modalImage, setModalImage] = useState<{
    src: string;
    label: string;
  } | null>(null);

  // Fallback high-quality stock imagery instead of blank image tags
  const fallbackImage =
    "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&q=80&w=1000";

  const [auditLog, setAuditLog] = useState([
    { action: "Application submitted", by: "User", time: "09:12" },
    { action: "Assigned to reviewer", by: "System", time: "09:13" },
    { action: "Opened for review", by: "Arif Rahman", time: "09:45" },
  ]);

  const pushAudit = (action: string, by: string) => {
    setAuditLog((prev) => [
      ...prev,
      {
        action,
        by,
        time: new Date().toLocaleTimeString("en-BD", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
  };

  /* Fixed the structural syntax error below by wrapping dynamic conditional generic inside brackets */
  const handleCheckerAction = (
    action: Extract<
      AppStatus,
      "checker_approved" | "checker_rejected" | "info_requested"
    >,
  ) => {
    setAppStatus(action);
    const labels: Record<typeof action, string> = {
      checker_approved: "Verified & pushed to Maker",
      checker_rejected: "Rejected by Checker",
      info_requested: "More info requested",
    };
    pushAudit(
      `${labels[action]}${checkerNote ? ` — "${checkerNote}"` : ""}`,
      "Checker",
    );
  };

  const handleMakerAction = (
    action: Extract<AppStatus, "approved" | "rejected">,
  ) => {
    setAppStatus(action);
    pushAudit(
      `${action === "approved" ? "Final System Approval" : "Final Rejection"}${
        makerNote ? ` — "${makerNote}"` : ""
      }`,
      "Maker",
    );
  };

  const isFinalized = appStatus === "approved" || appStatus === "rejected";

  return (
    <div className="bg-gray-50 min-h-screen text-slate-800">
      {/* Image modal rendering */}
      {modalImage && (
        <ImageModal
          src={modalImage.src}
          label={modalImage.label}
          onClose={() => setModalImage(null)}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 py-10 space-y-6">
        {/* ── HEADER ── */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/applications"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-blue-700 transition-colors"
            >
              <ArrowLeft size={16} /> Back
            </Link>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {unwrappedParams.id || "KYC-2026-001"}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Submitted: 2026-06-11 09:12
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${STATUS_STYLE[appStatus]}`}
            >
              {STATUS_LABEL[appStatus]}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-slate-100 text-slate-700">
              {userRole}
            </span>
          </div>
        </div>

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── LEFT: Content Details ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Info */}
            <SectionCard title="Personal Information" icon={<User size={15} />}>
              <FieldRow label="Full Name" value="Rafiq Hossain" />
              <FieldRow label="Date of Birth" value="12 March 1990" />
              <FieldRow label="Gender" value="Male" />
              <FieldRow label="Nationality" value="Bangladeshi" />
              <FieldRow label="Mobile" value="+880 1711 000001" />
              <FieldRow label="Email" value="rafiq@example.com" />
            </SectionCard>

            {/* Address */}
            <SectionCard title="Address Details" icon={<MapPin size={15} />}>
              <FieldRow label="Address Line 1" value="House 12, Road 4" />
              <FieldRow label="Area" value="Dhanmondi" />
              <FieldRow label="District" value="Dhaka" />
              <FieldRow label="Division" value="Dhaka" />
              <FieldRow label="Postal Code" value="1209" />
            </SectionCard>

            {/* Documents */}
            <SectionCard
              title="Uploaded Documents"
              icon={<FileText size={15} />}
            >
              <div className="grid grid-cols-2 gap-4 mb-5">
                <NIDImageCard
                  label="NID — Front Side"
                  placeholder="nid_front.jpg"
                  onView={() =>
                    setModalImage({
                      src: fallbackImage,
                      label: "NID Front Side",
                    })
                  }
                />
                <NIDImageCard
                  label="NID — Back Side"
                  placeholder="nid_back.jpg"
                  onView={() =>
                    setModalImage({
                      src: fallbackImage,
                      label: "NID Back Side",
                    })
                  }
                />
              </div>

              {/* Proof of address */}
              <div className="mb-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Proof of Address
                </p>
                <NIDImageCard
                  label="Utility Bill / Bank Statement"
                  placeholder="proof_address.jpg"
                  onView={() =>
                    setModalImage({
                      src: fallbackImage,
                      label: "Proof of Address",
                    })
                  }
                />
              </div>

              {/* Selfie */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Selfie / Liveness Photo
                </p>
                <div className="flex items-start gap-4">
                  <div
                    className="w-32 h-32 bg-gray-100 border border-gray-200 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer group relative overflow-hidden flex-shrink-0"
                    onClick={() =>
                      setModalImage({
                        src: fallbackImage,
                        label: "Selfie / Liveness",
                      })
                    }
                  >
                    <User size={28} className="text-gray-300" />
                    <span className="text-xs text-gray-400">selfie.jpg</span>
                    <div className="absolute inset-0 bg-blue-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                      <ZoomIn size={14} /> View
                    </div>
                  </div>
                  <div className="flex-1 bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-green-700 mb-1">
                      ✓ Liveness Check Passed
                    </p>
                    <p className="text-xs text-green-600">
                      Face matched with NID photo — confidence 94.2%
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Nominee */}
            <SectionCard title="Nominee Details" icon={<Users size={15} />}>
              <FieldRow label="Nominee Name" value="Fatema Hossain" />
              <FieldRow label="Relationship" value="Spouse" />
              <FieldRow label="NID / Passport" value="9988776655" mono />
              <FieldRow label="Date of Birth" value="15 July 1993" />
              <FieldRow label="Share %" value="100%" />
              <FieldRow label="Contact" value="+880 1811 000099" />

              <div className="mt-4 pt-4 border-t border-gray-50">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Nominee NID
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <NIDImageCard
                    label="Nominee NID — Front"
                    placeholder="nominee_nid_front.jpg"
                    onView={() =>
                      setModalImage({
                        src: fallbackImage,
                        label: "Nominee NID Front",
                      })
                    }
                  />
                  <NIDImageCard
                    label="Nominee NID — Back"
                    placeholder="nominee_nid_back.jpg"
                    onView={() =>
                      setModalImage({
                        src: fallbackImage,
                        label: "Nominee NID Back",
                      })
                    }
                  />
                </div>
              </div>
            </SectionCard>

            {/* BO Preferences */}
            <SectionCard
              title="BO Account Preferences"
              icon={<Building size={15} />}
            >
              <FieldRow label="Account Type" value="Individual" />
              <FieldRow label="Depository Participant" value="CDBL" />
              <FieldRow label="Bank for Settlement" value="Dutch-Bangla Bank" />
              <FieldRow label="Settlement Account" value="1234567890123" mono />
              <FieldRow label="TIN Number" value="123456789" mono />
              <div className="grid grid-cols-2 gap-4 py-2.5">
                <span className="text-sm text-gray-500">
                  Trading Permissions
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {["Cash", "Margin"].map((p) => (
                    <span
                      key={p}
                      className="px-2 py-0.5 bg-blue-900 text-white text-xs font-semibold rounded-md"
                    >
                      {p}
                    </span>
                  ))}
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-400 text-xs font-semibold rounded-md">
                    Foreign
                  </span>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* ── RIGHT: Actions Sidebar & Audit Trail ── */}
          <div className="space-y-5">
            {isFinalized && (
              <div
                className={`rounded-xl p-6 text-center border ${
                  appStatus === "approved"
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                {appStatus === "approved" ? (
                  <CheckCircle
                    size={32}
                    className="text-green-500 mx-auto mb-2"
                  />
                ) : (
                  <XCircle size={32} className="text-red-500 mx-auto mb-2" />
                )}
                <p className="font-semibold text-gray-900">
                  {appStatus === "approved"
                    ? "Application Approved"
                    : "Application Rejected"}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  No further action needed.
                </p>
              </div>
            )}

            {/* Checker Panel View */}
            {userRole === "checker" && !isFinalized && (
              <div className="bg-white rounded-xl p-6 border-2 border-amber-400 shadow-xs">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider mb-2">
                  <ShieldCheck size={16} /> Phase 1: Checker Review
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  Verify documentation and identity match. You cannot perform
                  final system approvals.
                </p>

                <div className="mb-4">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Checker Note
                  </label>
                  <textarea
                    rows={3}
                    value={checkerNote}
                    onChange={(e) => setCheckerNote(e.target.value)}
                    placeholder="Add evaluation note..."
                    className="w-full p-2.5 border border-gray-200 rounded-md text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => handleCheckerAction("checker_approved")}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-md transition-colors cursor-pointer"
                  >
                    <CheckCircle size={15} /> Verify & Push to Maker
                  </button>
                  <button
                    onClick={() => handleCheckerAction("info_requested")}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm rounded-md transition-colors cursor-pointer"
                  >
                    <Clock size={15} /> Request More Info
                  </button>
                  <button
                    onClick={() => handleCheckerAction("checker_rejected")}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold text-sm rounded-md transition-colors cursor-pointer"
                  >
                    <XCircle size={15} /> Reject Application
                  </button>
                </div>
              </div>
            )}

            {/* Maker Panel View */}
            {userRole === "maker" && !isFinalized && (
              <div className="bg-blue-950 rounded-xl p-6 text-white shadow-md">
                <div className="flex items-center gap-2 text-blue-300 font-bold text-xs uppercase tracking-wider mb-2">
                  <UserCheck size={16} /> Phase 2: Maker Final Decision
                </div>
                <p className="text-xs text-blue-200/80 mb-4">
                  Review checker remarks. Your decision commits to the live
                  system.
                </p>

                {checkerNote && (
                  <div className="bg-blue-900/50 p-3 rounded-md border border-blue-800 text-xs mb-4">
                    <span className="font-bold text-blue-300 block mb-1">
                      Checker Note:
                    </span>
                    <p className="text-blue-100 italic">"{checkerNote}"</p>
                  </div>
                )}

                {appStatus !== "checker_approved" ? (
                  <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-400/30 rounded-md px-3 py-3">
                    <Clock size={14} className="text-amber-300 flex-shrink-0" />
                    <p className="text-xs text-amber-200">
                      Waiting for checker to verify and push this application.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <label className="block text-xs font-bold text-blue-200 mb-1">
                        Maker Binding Remark
                      </label>
                      <textarea
                        rows={3}
                        value={makerNote}
                        onChange={(e) => setMakerNote(e.target.value)}
                        placeholder="Add final authorization note..."
                        className="w-full p-2.5 bg-blue-900/60 border border-blue-700 rounded-md text-sm text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => handleMakerAction("approved")}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold text-sm rounded-md transition-colors cursor-pointer"
                      >
                        <CheckCircle size={15} /> Final Approve
                      </button>
                      <button
                        onClick={() => handleMakerAction("rejected")}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold text-sm rounded-md transition-colors cursor-pointer"
                      >
                        <XCircle size={15} /> Final Reject
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            <AuditLog logs={auditLog} />
          </div>
        </div>
      </div>
    </div>
  );
}
