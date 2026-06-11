"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

// ── VALIDATION CONFIG ──────────────────────────────────────────
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

function validateImageFile(file: File): string | null {
  // 1. Check MIME type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `Invalid file type. Only ${ALLOWED_EXTENSIONS.join(", ")} are allowed.`;
  }

  // 2. Check extension (double safety against spoofed MIME)
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return `Invalid extension. Only ${ALLOWED_EXTENSIONS.join(", ")} are allowed.`;
  }

  // 3. Check file size
  if (file.size > MAX_SIZE_BYTES) {
    return `File too large. Maximum size is ${MAX_SIZE_MB}MB.`;
  }

  return null; // valid
}
// ──────────────────────────────────────────────────────────────

export default function NIDVerification() {
  const router = useRouter();

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [frontError, setFrontError] = useState<string | null>(null);
  const [backError, setBackError] = useState<string | null>(null);

  const [activeCamera, setActiveCamera] = useState<"front" | "back" | null>(
    null,
  );

  const removeFrontImage = () => {
    setFrontImage(null);
    setFrontError(null);
  };
  const removeBackImage = () => {
    setBackImage(null);
    setBackError(null);
  };

  // ── FILE BROWSE ──
  const handleFrontBrowse = () => {
    setFrontError(null);
    frontInputRef.current?.click();
  };
  const handleBackBrowse = () => {
    setBackError(null);
    backInputRef.current?.click();
  };

  // ── FILE CHANGE WITH VALIDATION ──
  const handleFrontChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset so same file can be re-selected after error
    if (!file) return;

    const err = validateImageFile(file);
    if (err) {
      setFrontError(err);
      return;
    }

    setFrontError(null);
    setFrontImage(URL.createObjectURL(file));
  };

  const handleBackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const err = validateImageFile(file);
    if (err) {
      setBackError(err);
      return;
    }

    setBackError(null);
    setBackImage(URL.createObjectURL(file));
  };

  // ── CAMERA ──
  const startCamera = async (side: "front" | "back") => {
    setActiveCamera(side);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Camera access denied or unavailable", err);
      setActiveCamera(null);
    }
  };

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL("image/png");
    if (activeCamera === "front") setFrontImage(imageData);
    else if (activeCamera === "back") setBackImage(imageData);

    stopCamera();
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setActiveCamera(null);
  };

  const canProceed = !!frontImage && !!backImage;

  return (
    /* 🌟 FIXED: Changed items-center to items-start & expanded constraints to match max-w-6xl */
    <div className="w-full flex flex-col items-start pt-10 px-4 md:px-8 max-w-6xl mx-auto">
      {/* 🌟 FIXED: Left-aligned heading container block */}
      <div className="w-full mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Let's Upload/Capture NID Image
        </h1>
      </div>

      {/* Hidden file inputs — accept attribute pre-filters OS file picker */}
      <input
        type="file"
        ref={frontInputRef}
        onChange={handleFrontChange}
        accept={ALLOWED_TYPES.join(",")}
        className="hidden"
      />
      <input
        type="file"
        ref={backInputRef}
        onChange={handleBackChange}
        accept={ALLOWED_TYPES.join(",")}
        className="hidden"
      />

      {/* CAMERA MODAL */}
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
              className="bg-green-600 text-white px-6 py-2 rounded-lg cursor-pointer"
            >
              📸 Take Photo
            </button>
            <button
              onClick={stopCamera}
              className="bg-red-600 text-white px-6 py-2 rounded-lg cursor-pointer"
            >
              ✕ Close
            </button>
          </div>
        </div>
      )}

      {/* CARDS CONTAINER */}

      <div className="flex flex-col md:flex-row gap-8 w-full">
        {/* FRONT */}
        <NIDCard
          label="Front Side"
          image={frontImage}
          error={frontError}
          onRemove={removeFrontImage}
          onBrowse={handleFrontBrowse}
          onCapture={() => startCamera("front")}
        />

        {/* BACK */}
        <NIDCard
          label="Back Side"
          image={backImage}
          error={backError}
          onRemove={removeBackImage}
          onBrowse={handleBackBrowse}
          onCapture={() => startCamera("back")}
        />
      </div>

      {/* NAVIGATION PANEL */}

      <div className="w-full flex flex-col sm:flex-row justify-between gap-4 border-t border-slate-200/60 mt-10 pt-6 pb-24">
        <button
          onClick={() => router.back()}
          className="bg-gray-500 text-white px-8 py-3 rounded cursor-pointer"
        >
          Back
        </button>

        <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
          <button
            disabled={!canProceed}
            onClick={() => router.push("/register/selfie")}
            className={`px-10 py-3 rounded text-white font-semibold transition-all bg-blue-600 ${
              canProceed
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 cursor-pointer active:scale-[0.98]"
                : "bg-gray-200 text-gray-400 shadow-none cursor-not-allowed"
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

// ── REUSABLE CARD COMPONENT ─────────────────────────────────────
type NIDCardProps = {
  label: string;
  image: string | null;
  error: string | null;
  onRemove: () => void;
  onBrowse: () => void;
  onCapture: () => void;
};

function NIDCard({
  label,
  image,
  error,
  onRemove,
  onBrowse,
  onCapture,
}: NIDCardProps) {
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
