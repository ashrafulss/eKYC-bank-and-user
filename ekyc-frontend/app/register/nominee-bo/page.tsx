"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

// ── VALIDATION CONFIG ──────────────────────────────────────────
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const MIN_SIZE_BYTES = 50 * 1024; // 50KB

function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type))
    return `Invalid file type. Only ${ALLOWED_EXTENSIONS.join(", ")} are allowed.`;
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext))
    return `Invalid extension. Only ${ALLOWED_EXTENSIONS.join(", ")} are allowed.`;
  if (file.size > MAX_SIZE_BYTES)
    return "File too large. Maximum size is 10MB.";
  if (file.size < MIN_SIZE_BYTES)
    return "Image too small. Please upload a clear photo.";
  return null;
}

// ── TYPES ──────────────────────────────────────────────────────
interface Nominee {
  nidSkipped: boolean;
  frontImage: string | null;
  backImage: string | null;
  frontError: string | null;
  backError: string | null;
  name: string;
  relationship: string;
  nidPassport: string;
  dob: string;
  share: string;
  contact: string;
}

function emptyNominee(): Nominee {
  return {
    nidSkipped: false,
    frontImage: null,
    backImage: null,
    frontError: null,
    backError: null,
    name: "",
    relationship: "",
    nidPassport: "",
    dob: "",
    share: "",
    contact: "",
  };
}

export default function NomineeBo() {
  const router = useRouter();

  const [nominees, setNominees] = useState<Nominee[]>([emptyNominee()]);
  const [boPrefs, setBoPrefs] = useState({
    accountType: "",
    dp: "",
    bank: "",
    settlementAccount: "",
    tin: "",
  });
  const [permissions, setPermissions] = useState({
    cash: true,
    margin: true,
    foreign: false,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeCamera, setActiveCamera] = useState<{
    nomineeIndex: number;
    side: "front" | "back";
  } | null>(null);

  const frontInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const backInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach((t) => t.stop());
      }
    };
  }, []);

  // ── HELPERS ─────────────────────────────────────────────────
  const updateNominee = (index: number, patch: Partial<Nominee>) =>
    setNominees((prev) =>
      prev.map((n, i) => (i === index ? { ...n, ...patch } : n)),
    );

  const addNominee = () => setNominees((prev) => [...prev, emptyNominee()]);

  const removeNominee = (index: number) => {
    if (nominees.length === 1) return;
    setNominees((prev) => prev.filter((_, i) => i !== index));
    frontInputRefs.current.splice(index, 1);
    backInputRefs.current.splice(index, 1);
  };

  // ── SKIP / KEEP TOGGLE ───────────────────────────────────────
  const toggleSkip = (index: number) => {
    if (!nominees[index].nidSkipped) {
      updateNominee(index, {
        nidSkipped: true,
        frontImage: null,
        backImage: null,
        frontError: null,
        backError: null,
      });
    } else {
      updateNominee(index, { nidSkipped: false });
    }
  };

  // ── FILE UPLOAD ──────────────────────────────────────────────
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
    side: "front" | "back",
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const err = validateImageFile(file);
    if (err) {
      updateNominee(
        index,
        side === "front" ? { frontError: err } : { backError: err },
      );
      return;
    }
    const url = URL.createObjectURL(file);
    updateNominee(
      index,
      side === "front"
        ? { frontImage: url, frontError: null }
        : { backImage: url, backError: null },
    );
  };

  // ── CAMERA ───────────────────────────────────────────────────
  const startCamera = async (nomineeIndex: number, side: "front" | "back") => {
    setActiveCamera({ nomineeIndex, side });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setActiveCamera(null);
    }
  };

  const takePhoto = () => {
    if (!activeCamera) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL("image/png");
    const { nomineeIndex, side } = activeCamera;
    updateNominee(
      nomineeIndex,
      side === "front"
        ? { frontImage: imageData, frontError: null }
        : { backImage: imageData, backError: null },
    );
    stopCamera();
  };

  const stopCamera = () => {
    (videoRef.current?.srcObject as MediaStream)
      ?.getTracks()
      .forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setActiveCamera(null);
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 overflow-y-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-2">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Nominee & BO Account Setup
          </h1>
        </div>

        {/* Camera modal */}
        {activeCamera && (
          <div className="fixed inset-0 bg-black/70 flex flex-col items-center justify-center z-50">
            <video
              ref={videoRef}
              autoPlay
              className="w-[500px] rounded-lg border-4 border-white"
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex gap-4 mt-4">
              <button
                onClick={takePhoto}
                className="bg-green-600 text-white px-6 py-2 rounded-lg"
              >
                📸 Take Photo
              </button>
              <button
                onClick={stopCamera}
                className="bg-red-600   text-white px-6 py-2 rounded-lg"
              >
                ✕ Close
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 items-start">
          {/* ── LEFT: NOMINEES ── */}
          <div className="space-y-6">
            {nominees.map((nominee, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-xs border border-gray-100 overflow-hidden"
              >
                {/* Card header */}
                <div className="flex justify-between items-center px-6 pt-5 pb-3 border-b border-gray-100">
                  <h2 className="text-xs font-bold tracking-wider text-cyan-700 uppercase">
                    {index === 0
                      ? "Nominee (Primary)"
                      : `Nominee #${index + 1}`}
                  </h2>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeNominee(index)}
                      className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* ── NID UPLOAD SECTION ── */}
                <div className="px-6 pt-5 pb-4">
                  {/* Label row + Skip/Keep toggle */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      NID Upload
                    </span>

                    <button
                      type="button"
                      onClick={() => toggleSkip(index)}
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border transition-all ${
                        nominee.nidSkipped
                          ? "bg-blue-50 border-blue-300 text-blue-600 hover:bg-blue-100"
                          : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-600"
                      }`}
                    >
                      {nominee.nidSkipped ? (
                        <>
                          {/* Upload icon */}
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3 16.5V19a2 2 0 002 2h14a2 2 0 002-2v-2.5M16 12l-4-4m0 0l-4 4m4-4v12"
                            />
                          </svg>
                          Upload NID
                        </>
                      ) : (
                        <>
                          {/* Skip icon */}
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10M6.343 6.343A8 8 0 0120 12M3 3l18 18"
                            />
                          </svg>
                          Skip upload
                        </>
                      )}
                    </button>
                  </div>

                  {/* ── SKIPPED STATE ── */}
                  {nominee.nidSkipped ? (
                    <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                      <svg
                        className="w-4 h-4 text-amber-500 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v4M12 16h.01" />
                      </svg>
                      <p className="text-xs text-amber-700 leading-relaxed">
                        NID upload skipped — fill in the details below manually.{" "}
                        <button
                          type="button"
                          onClick={() => toggleSkip(index)}
                          className="underline font-semibold hover:text-amber-900"
                        >
                          Upload instead
                        </button>
                      </p>
                    </div>
                  ) : (
                    /* ── UPLOAD CARDS ── */
                    <div>
                      <div className="grid grid-cols-2 gap-3">
                        {/* Hidden inputs */}
                        <input
                          type="file"
                          accept={ALLOWED_TYPES.join(",")}
                          className="hidden"
                          ref={(el) => {
                            frontInputRefs.current[index] = el;
                          }}
                          onChange={(e) => handleFileChange(e, index, "front")}
                        />
                        <input
                          type="file"
                          accept={ALLOWED_TYPES.join(",")}
                          className="hidden"
                          ref={(el) => {
                            backInputRefs.current[index] = el;
                          }}
                          onChange={(e) => handleFileChange(e, index, "back")}
                        />

                        <NIDMiniCard
                          label="Front Side"
                          image={nominee.frontImage}
                          error={nominee.frontError}
                          onRemove={() =>
                            updateNominee(index, {
                              frontImage: null,
                              frontError: null,
                            })
                          }
                          onBrowse={() => {
                            updateNominee(index, { frontError: null });
                            frontInputRefs.current[index]?.click();
                          }}
                          onCapture={() => startCamera(index, "front")}
                        />
                        <NIDMiniCard
                          label="Back Side"
                          image={nominee.backImage}
                          error={nominee.backError}
                          onRemove={() =>
                            updateNominee(index, {
                              backImage: null,
                              backError: null,
                            })
                          }
                          onBrowse={() => {
                            updateNominee(index, { backError: null });
                            backInputRefs.current[index]?.click();
                          }}
                          onCapture={() => startCamera(index, "back")}
                        />
                      </div>
                      <div className="flex justify-center mt-2">
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer shadow-xs">
                          Verify & Load Information
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── FIELDS ── */}
                <div className="px-6 pb-6 space-y-4 border-t border-gray-50 pt-4">
                  {[
                    { label: "Nominee Name", field: "name", type: "text" },
                    {
                      label: "Relationship",
                      field: "relationship",
                      type: "text",
                    },
                    {
                      label: "NID / Passport",
                      field: "nidPassport",
                      type: "text",
                      mono: true,
                    },
                    { label: "Date of Birth", field: "dob", type: "date" },
                    { label: "Share %", field: "share", type: "text" },
                    { label: "Contact Number", field: "contact", type: "tel" },
                  ].map(({ label, field, type, mono }) => (
                    <div
                      key={field}
                      className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2"
                    >
                      <label className="text-sm font-medium text-gray-500">
                        {label}
                      </label>
                      <input
                        type={type}
                        value={(nominee as any)[field]}
                        onChange={(e) =>
                          updateNominee(index, {
                            [field]: e.target.value,
                          } as any)
                        }
                        className={`w-full sm:col-span-2 px-3 py-2 bg-slate-50 border border-gray-200 rounded-md text-sm text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white ${mono ? "font-mono" : ""}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="pl-2">
              <button
                type="button"
                onClick={addNominee}
                className="text-sm font-semibold text-cyan-600 hover:text-cyan-700 transition-colors"
              >
                + Add another nominee
              </button>
            </div>
          </div>

          {/* ── RIGHT: BO PREFERENCES ── */}
          <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 md:p-8 space-y-6 lg:sticky lg:top-6">
            <h2 className="text-xs font-bold tracking-wider text-cyan-700 uppercase border-b border-gray-100 pb-2">
              BO Account Preferences
            </h2>
            <div className="space-y-4">
              {[
                { label: "Account Type", key: "accountType" },
                { label: "Depository Participant", key: "dp" },
                { label: "Bank for Settlement", key: "bank" },
                {
                  label: "Settlement Account",
                  key: "settlementAccount",
                  mono: true,
                },
                { label: "TIN Number", key: "tin", mono: true },
              ].map(({ label, key, mono }) => (
                <div
                  key={key}
                  className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2"
                >
                  <label className="text-sm font-medium text-gray-500">
                    {label}
                  </label>
                  <input
                    type="text"
                    value={(boPrefs as any)[key]}
                    onChange={(e) =>
                      setBoPrefs({ ...boPrefs, [key]: e.target.value })
                    }
                    className={`w-full sm:col-span-2 px-3 py-2 bg-slate-50 border border-gray-200 rounded-md text-sm text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white ${mono ? "font-mono" : ""}`}
                  />
                </div>
              ))}

              <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-2 pt-2">
                <label className="text-sm font-medium text-gray-500 pt-1">
                  Trading Permissions
                </label>
                <div className="sm:col-span-2 flex flex-wrap gap-2">
                  {(["cash", "margin", "foreign"] as const).map((perm) => (
                    <button
                      key={perm}
                      type="button"
                      onClick={() =>
                        setPermissions({
                          ...permissions,
                          [perm]: !permissions[perm],
                        })
                      }
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${
                        permissions[perm]
                          ? "bg-cyan-700 text-white"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {perm} {permissions[perm] ? "✓" : "✗"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="w-full mt-8 flex flex-col sm:flex-row justify-between items-center border-t border-gray-200 pt-6 gap-4">
          <button
            onClick={() => router.back()}
            className="bg-gray-500 text-white px-8 py-3 rounded cursor-pointer"
          >
            Back
          </button>

          <button
            onClick={() => router.push("/register/review")}
            className={`px-10 py-3 rounded text-white font-semibold transition-all bg-blue-600  hover:bg-blue-700 shadow-blue-200 cursor-pointer active:scale-[0.98] `}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MINI NID CARD ────────────────────────────────────────────────
interface NIDMiniCardProps {
  label: string;
  image: string | null;
  error: string | null;
  onRemove: () => void;
  onBrowse: () => void;
  onCapture: () => void;
}

function NIDMiniCard({
  label,
  image,
  error,
  onRemove,
  onBrowse,
  onCapture,
}: NIDMiniCardProps) {
  return (
    <div
      className={`flex-1 bg-white border-2 border-dashed p-8 text-center rounded-xl transition-colors ${
        error
          ? "border-red-300 bg-red-50/10"
          : image
            ? "border-green-300 bg-emerald-50/5"
            : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <p className="font-bold mb-4 text-slate-800">{label}</p>

      {/* Preview / placeholder */}
      <div className="h-40 flex items-center justify-center mb-4 relative">
        {image ? (
          <div className="relative h-full">
            <img
              src={image}
              className="h-full object-contain rounded"
              alt={label}
            />
            <button
              onClick={onRemove}
              className="absolute -top-2 -right-2 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm cursor-pointer hover:bg-red-700 transition-colors shadow-sm"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <svg
              className="w-12 h-12 opacity-40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <circle cx="8.5" cy="10.5" r="1.5" />
              <path d="M21 15l-5-5L5 19" />
            </svg>
            <span className="text-sm">No image selected</span>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3 text-left">
          <svg
            className="w-4 h-4 text-red-500 mt-0.5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <p className="text-red-600 text-xs leading-relaxed">{error}</p>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3 justify-center">
        <button
          onClick={onBrowse}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer shadow-xs"
        >
          Browse
        </button>
        <button
          onClick={onCapture}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer shadow-xs"
        >
          Capture
        </button>
      </div>

      {/* Format hint per card */}
      {!image && !error && (
        <p className="text-xs text-gray-400 mt-3">
          JPG · JPEG · PNG · WEBP · max 5MB
        </p>
      )}
    </div>
  );
}
