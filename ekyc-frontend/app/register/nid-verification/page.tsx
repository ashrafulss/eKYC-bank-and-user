"use client";

import { nidService } from "@/app/services/nid.service";
import { useRouter } from "next/navigation";
import React, { useRef, useState } from "react";
import { useAuth } from "@/app/context/auth-context";
import { validateImageFile } from "@/app/utils/imageValidator";

export default function NIDVerification() {
  const router = useRouter();

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { user, refetchUser } = useAuth();
  
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  
  React.useEffect(() => {
    if (user?.nidFront && !frontImage) setFrontImage(user.nidFront);
    if (user?.nidBack && !backImage) setBackImage(user.nidBack);
  }, [user]);

  const [frontError, setFrontError] = useState<string | null>(null);
  const [backError, setBackError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [activeCamera, setActiveCamera] = useState<"front" | "back" | null>(null);

  const removeFrontImage = () => {
    setFrontImage(null);
    setFrontError(null);
  };
  const removeBackImage = () => {
    setBackImage(null);
    setBackError(null);
  };

  const handleFrontBrowse = () => {
    setFrontError(null);
    frontInputRef.current?.click();
  };
  const handleBackBrowse = () => {
    setBackError(null);
    backInputRef.current?.click();
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFrontChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;


    const err = validateImageFile(file);
    if (err) {
      setFrontError(err);
      setFrontImage(null);
      return;
    }

    try {
      setFrontError(null);
      const base64Str = await convertFileToBase64(file);
      setFrontImage(base64Str);
    } catch (err) {
      setFrontError("Failed to read image file.");
    }
  };

  const handleBackChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const err = validateImageFile(file);
    if (err) {
      setBackError(err);
      setBackImage(null);
      return;
    }

    try {
      setBackError(null);
      const base64Str = await convertFileToBase64(file);
      setBackImage(base64Str);
    } catch (err) {
      setBackError("Failed to read image file.");
    }
  };

  const startCamera = async (side: "front" | "back") => {
    setActiveCamera(side);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment", width: 1280, height: 720 } 
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Camera access denied or unavailable", err);
      if (side === "front") setFrontError("Could not access camera device.");
      else setBackError("Could not access camera device.");
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

    
    canvas.toBlob((blob) => {
      if (!blob) return;

      const file = new File([blob], `captured_${activeCamera}.jpg`, { type: "image/jpeg" });
      const err = validateImageFile(file);

      if (err) {
        if (activeCamera === "front") setFrontError(err);
        else setBackError(err);
        stopCamera();
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (activeCamera === "front") {
          setFrontError(null);
          setFrontImage(reader.result as string);
        } else {
          setBackError(null);
          setBackImage(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
      stopCamera();
    }, "image/jpeg", 0.90);
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setActiveCamera(null);
  };

  const canProceed = !!frontImage && !!backImage && !isSubmitting;

  const handleSubmit = async () => {
    if (!frontImage || !backImage) return;

    setIsSubmitting(true);
    setGlobalError(null);

    try {
      await nidService.uploadNidDocuments({
        frontImage,
        backImage,
      });
      await refetchUser(); 
      router.push("/register/selfie");
    } catch (err: any) {
      console.error("❌ Submission failed:", err);
      const serverMessage = err.response?.data?.message || err.message || "";
      
     
      if (serverMessage.toLowerCase().includes("nid") || serverMessage.toLowerCase().includes("document")) {
        setGlobalError("The uploaded files are not recognized as valid National ID layouts. Please ensure they are flat and readable.");
      } else {
        setGlobalError(serverMessage || "Something went wrong while saving your documents. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-start pt-10 px-4 md:px-8 max-w-6xl mx-auto">
      <div className="w-full mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Let's Upload/Capture NID Image
        </h1>
        {globalError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
            ⚠️ {globalError}
          </div>
        )}
      </div>


      <input
        type="file"
        ref={frontInputRef}
        onChange={handleFrontChange}
        accept=".jpg,.jpeg,.png,.webp,image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={backInputRef}
        onChange={handleBackChange}
        accept=".jpg,.jpeg,.png,.webp,image/*"
        className="hidden"
      />

      {activeCamera && (
        <div className="fixed inset-0 bg-black/70 flex flex-col items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-lg bg-slate-950 rounded-xl overflow-hidden shadow-2xl flex flex-col items-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full aspect-[4/3] object-cover bg-black"
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex gap-4 my-4">
              <button
                onClick={takePhoto}
                className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2 rounded-lg cursor-pointer transition-colors"
              >
                📸 Take Photo
              </button>
              <button
                onClick={stopCamera}
                className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-2 rounded-lg cursor-pointer transition-colors"
              >
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8 w-full">
        <NIDCard
          label="Front Side"
          image={frontImage}
          error={frontError}
          onRemove={removeFrontImage}
          onBrowse={handleFrontBrowse}
          onCapture={() => startCamera("front")}
        />

        <NIDCard
          label="Back Side"
          image={backImage}
          error={backError}
          onRemove={removeBackImage}
          onBrowse={handleBackBrowse}
          onCapture={() => startCamera("back")}
        />
      </div>

      <div className="w-full flex flex-col sm:flex-row justify-end gap-4 border-t border-slate-200/60 mt-10 pt-6 pb-24">
        <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
          <button
            disabled={!canProceed}
            onClick={handleSubmit}
            className={`px-10 py-3 rounded text-white font-semibold transition-all ${
              canProceed
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md cursor-pointer active:scale-[0.98]"
                : "bg-gray-200 text-gray-400 shadow-none cursor-not-allowed"
            }`}
          >
            {isSubmitting ? "Uploading NID..." : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const displayImage = image?.startsWith("/uploads") 
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL ? process.env.NEXT_PUBLIC_API_BASE_URL.replace('/api/v1', '') : 'http://localhost:5000'}${image}`
    : image;

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

      <div className="h-40 flex items-center justify-center mb-4 relative">
        {image ? (
          <div className="relative h-full">
            <img
              src={displayImage || ""}
              className="h-full object-contain rounded"
              alt={label}
            />
            <button
              type="button"
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

      {!image && !error && (
        <p className="text-xs text-gray-400 mt-3">
          JPG · JPEG · PNG · WEBP · max 10MB
        </p>
      )}
    </div>
  );
}