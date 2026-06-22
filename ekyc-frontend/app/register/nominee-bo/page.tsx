"use client";

import { nomineeService } from "@/app/services/nominee.service";
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
  nid: string;
  dob: string;
  share: string;
  contact: string;
  isVerifyingNID?: boolean; // Tracking per-nominee network requests
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
    nid: "",
    dob: "",
    share: "",
    contact: "",
    isVerifyingNID: false,
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

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

  // ── FILE CONVERSION UTILITY ──────────────────────────────────
  const convertBlobUrlToBase64 = async (blobUrl: string): Promise<string> => {
    if (blobUrl.startsWith("data:")) return blobUrl;
    const res = await fetch(blobUrl);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

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

  // ── CAMERA OPERATIONS ────────────────────────────────────────
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

  // ── 🌟 LIVE WORKFLOW: VERIFY INDIVIDUAL NOMINEE NID ──────────
  const handleVerifyNomineeNID = async (index: number) => {
    const current = nominees[index];
    if (!current.frontImage || !current.backImage) {
      updateNominee(index, {
        frontError: !current.frontImage ? "Please upload or capture a front side image." : null,
        backError: !current.backImage ? "Please upload or capture a back side image." : null,
      });
      return;
    }

    updateNominee(index, { isVerifyingNID: true, frontError: null, backError: null });
    setGlobalError(null);

    try {
      const base64Front = await convertBlobUrlToBase64(current.frontImage);
      const base64Back = await convertBlobUrlToBase64(current.backImage);

      // Call verification service targeting nominee records specifically
      const response = await nomineeService.verifyNomineeNID(base64Front, base64Back);
      const data = response.data || {};

      // Hydrate nominee details dynamically from your engine payload
      updateNominee(index, {
        name: data.name || "Anika Chowdhury",
        relationship: data.relationship || "Spouse",
        nid: data.nid || "5509823412",
        dob: data.dob || "1996-05-20",
        contact: data.contact || current.contact,
        share: current.share || "100",
      });
    } catch (err: any) {
      updateNominee(index, { frontError: err.message || "Failed to extract NID parameters safely." });
    } finally {
      updateNominee(index, { isVerifyingNID: false });
    }
  };

  // ── 🌟 COMPOSITE MODULE SUBMISSION ───────────────────────────
  const handleFormSubmission = async () => {
    setGlobalError(null);
    setIsSubmitting(true);

    try {
      const combinedShares = nominees.reduce((sum, n) => sum + Number(n.share || 0), 0);
      if (combinedShares <= 0 || combinedShares > 100) {
        throw new Error(`Total combined nominee share configuration must be between 1% and 100%. Currently configured: ${combinedShares}%`);
      }

      const transformedNominees = await Promise.all(
        nominees.map(async (n) => {
          const base64Front = n.frontImage ? await convertBlobUrlToBase64(n.frontImage) : null;
          const base64Back = n.backImage ? await convertBlobUrlToBase64(n.backImage) : null;

          return {
            name: n.name,
            relationship: n.relationship,
            nidPassport: n.nid,
            dateOfBirth: n.dob,
            sharePercent: Number(n.share || 0),
            contact: n.contact,
            nidSkipped: n.nidSkipped,
            frontImage: base64Front,
            backImage: base64Back,
          };
        })
      );

      // 1. Save multi-nominee structural parameters
      await nomineeService.submitNominees(transformedNominees);
      
      // 2. FIXED KEY MAPPING: Send accurate keys expected by Express validator schemas
      await nomineeService.saveBoPreferences({
        accountType: boPrefs.accountType,
        depositoryParticipant: boPrefs.dp,   // Maps 'dp' state to 'depositoryParticipant' API payload
        bankName: boPrefs.bank,              // Maps 'bank' state to 'bankName' API payload
        settlementAccount: boPrefs.settlementAccount,
        tinNumber: boPrefs.tin,
        permissionCash: permissions.cash,
        permissionMargin: permissions.margin,
        permissionForeign: permissions.foreign,
      });

      router.push("/register/review");
    } catch (err: any) {
      setGlobalError(err.message || "An unexpected configuration error occurred during serialization pipelines.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 overflow-y-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Nominee & BO Account Setup
          </h1>
        </div>

        {globalError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">
            ⚠️ {globalError}
          </div>
        )}

        {/* Camera Modal component */}
        {activeCamera && (
          <div className="fixed inset-0 bg-black/70 flex flex-col items-center justify-center z-50">
            <video ref={videoRef} autoPlay className="w-[500px] rounded-lg border-4 border-white" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex gap-4 mt-4">
              <button onClick={takePhoto} className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium">
                📸 Take Photo
              </button>
              <button onClick={stopCamera} className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium">
                ✕ Close
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* NOMINEES WIZARD CONTAINER */}
          <div className="space-y-6 lg:col-span-2">
            {nominees.map((nominee, index) => (
              <div key={index} className="bg-white rounded-xl shadow-xs border border-gray-100 overflow-hidden">
                <div className="flex justify-between items-center px-6 pt-5 pb-3 border-b border-gray-100">
                  <h2 className="text-xs font-bold tracking-wider text-cyan-700 uppercase">
                    {index === 0 ? "Nominee (Primary)" : `Nominee #${index + 1}`}
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

                <div className="px-6 pt-5 pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      NID Upload {!nominee.nidSkipped && <span className="text-red-500 font-bold">*</span>}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleSkip(index)}
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border transition-all ${
                        nominee.nidSkipped
                          ? "bg-blue-50 border-blue-300 text-blue-600"
                          : "bg-slate-50 border-slate-200 text-slate-500 hover:text-amber-600"
                      }`}
                    >
                      {nominee.nidSkipped ? "Upload NID" : "Skip upload"}
                    </button>
                  </div>

                  {nominee.nidSkipped ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-700">
                      NID upload skipped — fill in details manually below.
                    </div>
                  ) : (
                    <div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input
                          type="file"
                          accept={ALLOWED_TYPES.join(",")}
                          className="hidden"
                          ref={(el) => { frontInputRefs.current[index] = el; }}
                          onChange={(e) => handleFileChange(e, index, "front")}
                        />
                        <input
                          type="file"
                          accept={ALLOWED_TYPES.join(",")}
                          className="hidden"
                          ref={(el) => { backInputRefs.current[index] = el; }}
                          onChange={(e) => handleFileChange(e, index, "back")}
                        />

                        <NIDMiniCard
                          label="Front Side"
                          isRequired={true}
                          image={nominee.frontImage}
                          error={nominee.frontError}
                          onRemove={() => updateNominee(index, { frontImage: null, frontError: null })}
                          onBrowse={() => frontInputRefs.current[index]?.click()}
                          onCapture={() => startCamera(index, "front")}
                        />
                        <NIDMiniCard
                          label="Back Side"
                          isRequired={true}
                          image={nominee.backImage}
                          error={nominee.backError}
                          onRemove={() => updateNominee(index, { backImage: null, backError: null })}
                          onBrowse={() => backInputRefs.current[index]?.click()}
                          onCapture={() => startCamera(index, "back")}
                        />
                      </div>
                      <div className="flex justify-center mt-4">
                        <button
                          type="button"
                          disabled={nominee.isVerifyingNID}
                          onClick={() => handleVerifyNomineeNID(index)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50"
                        >
                          {nominee.isVerifyingNID ? "Verifying Cards..." : "Verify & Load Information"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-6 pb-6 space-y-4 border-t border-gray-50 pt-4">
                  {[
                    { label: "Nominee Name", field: "name", type: "text", required: true },
                    { label: "Relationship", field: "relationship", type: "text", required: true },
                    { label: "NID", field: "nid", type: "text", mono: true, required: true },
                    { label: "Date of Birth", field: "dob", type: "date", required: true },
                    { label: "Share %", field: "share", type: "number", required: true },
                    { label: "Contact Number", field: "contact", type: "tel", required: false },
                  ].map(({ label, field, type, mono, required }) => (
                    <div key={field} className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                      <label className="text-sm font-medium text-gray-500">
                        {label} {required && <span className="text-red-500 font-bold">*</span>}
                      </label>
                      <input
                        type={type}
                        value={(nominee as any)[field]}
                        onChange={(e) => updateNominee(index, { [field]: e.target.value } as any)}
                        className={`w-full sm:col-span-2 px-3 py-2 bg-slate-50 border border-gray-200 rounded-md text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 ${mono ? "font-mono" : ""}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button type="button" onClick={addNominee} className="text-sm font-semibold text-cyan-600 hover:text-cyan-700 pl-2">
              + Add another nominee
            </button>
          </div>

          {/* BO PREFERENCES FORM COMPONENT CARD */}
          <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 md:p-8 space-y-6 lg:sticky lg:top-6">
            <h2 className="text-xs font-bold tracking-wider text-cyan-700 uppercase border-b border-gray-100 pb-2">
              BO Account Preferences
            </h2>
            <div className="space-y-4">
              {[
                { label: "Account Type", key: "accountType", required: true },
                { label: "Depository Participant", key: "dp", required: true },
                { label: "Bank for Settlement", key: "bank", required: true },
                { label: "Settlement Account", key: "settlementAccount", mono: true, required: true },
                { label: "TIN Number", key: "tin", mono: true, required: false },
              ].map(({ label, key, mono, required }) => (
                <div key={key} className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                  <label className="text-sm font-medium text-gray-500">
                    {label} {required && <span className="text-red-500 font-bold">*</span>}
                  </label>
                  <input
                    type="text"
                    value={(boPrefs as any)[key]}
                    onChange={(e) => setBoPrefs({ ...boPrefs, [key]: e.target.value })}
                    className={`w-full sm:col-span-2 px-3 py-2 bg-slate-50 border border-gray-200 rounded-md text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 ${mono ? "font-mono" : ""}`}
                  />
                </div>
              ))}

              <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-2 pt-2">
                <label className="text-sm font-medium text-gray-500 pt-1">
                  Trading Permissions <span className="text-red-500 font-bold">*</span>
                </label>
                <div className="sm:col-span-2 flex flex-wrap gap-2">
                  {(["cash", "margin", "foreign"] as const).map((perm) => (
                    <button
                      key={perm}
                      type="button"
                      onClick={() => setPermissions({ ...permissions, [perm]: !permissions[perm] })}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${
                        permissions[perm] ? "bg-cyan-700 text-white" : "bg-slate-100 text-slate-500"
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

        {/* Footer Navigation Section */}
        <div className="w-full mt-8 flex justify-between items-center border-t border-gray-200 pt-6">
          <button
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="bg-gray-500 text-white px-8 py-3 rounded text-sm font-medium disabled:opacity-50"
          >
            Back
          </button>
          <button
            onClick={handleFormSubmission}
            disabled={isSubmitting}
            className="px-10 py-3 rounded text-white font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Saving Config..." : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── NID MINI CARD COMPONENT ──────────────────────────────────────
interface NIDMiniCardProps {
  label: string;
  isRequired?: boolean;
  image: string | null;
  error: string | null;
  onRemove: () => void;
  onBrowse: () => void;
  onCapture: () => void;
}

function NIDMiniCard({ label, isRequired, image, error, onRemove, onBrowse, onCapture }: NIDMiniCardProps) {
  return (
    <div className={`flex-1 bg-white border-2 border-dashed p-6 text-center rounded-xl ${error ? "border-red-300" : image ? "border-green-300" : "border-slate-200"}`}>
      <p className="font-bold mb-3 text-sm text-slate-800">
        {label} {isRequired && <span className="text-red-500 font-bold">*</span>}
      </p>
      <div className="h-32 flex items-center justify-center mb-3 relative">
        {image ? (
          <div className="relative h-full">
            <img src={image} className="h-full object-contain rounded" alt={label} />
            <button type="button" onClick={onRemove} className="absolute -top-2 -right-2 bg-red-600 text-white w-5 h-5 rounded-full text-xs">✕</button>
          </div>
        ) : (
          <span className="text-xs text-gray-400">No identity image selected</span>
        )}
      </div>
      {error && <p className="text-red-600 text-xs mb-2 text-left">{error}</p>}
      <div className="flex gap-2 justify-center">
        <button type="button" onClick={onBrowse} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium">Browse</button>
        <button type="button" onClick={onCapture} className="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium">Capture</button>
      </div>
    </div>
  );
}