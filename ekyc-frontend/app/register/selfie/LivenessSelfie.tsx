"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { useRouter } from "next/navigation";
import { selfieApiService } from "@/app/services/selfie.service";
import { useAuth } from "@/app/context/auth-context";

// ─── Types ────────────────────────────────────────────────────────────────────

type PoseDir = "left" | "right" | "up" | "down";

type Phase =
  | "loading"
  | "instructions"
  | "challenge"
  | "analyzing"
  | "result"
  | "error";

export type AnalysisResult = {
  livenessScore: number;
  isLive: boolean;
  faceMatchScore: number | null;
  faceMatchPass: boolean | null;
  overallPass: boolean;
  summary: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const CHALLENGES: { key: PoseDir; label: string; arrow: string }[] = [
  { key: "left",  label: "Turn left",  arrow: "←" },
  { key: "right", label: "Turn right", arrow: "→" },
  { key: "up",    label: "Look up",    arrow: "↑" },
  { key: "down",  label: "Look down",  arrow: "↓" },
];

const HOLD_FRAMES = 8;

// ─── Pose detection ───────────────────────────────────────────────────────────
function detectPose(lm: faceapi.FaceLandmarks68): {
  yaw: number;
  pitch: number;
  downRatio: number;
  upRatio: number;
  passes: Partial<Record<PoseDir, boolean>>;
} {
  const pts = lm.positions;

  const eyeLeft  = pts[36];
  const eyeRight = pts[45];
  const eyeWidth = eyeRight.x - eyeLeft.x;

  const eyeMidX =
    ((pts[36].x + pts[39].x) / 2 + (pts[42].x + pts[45].x) / 2) / 2;

  const rawYaw = eyeWidth > 0 ? ((pts[30].x - eyeMidX) / eyeWidth) * 100 : 0;
  const yaw = -rawYaw;

  const noseTop  = pts[27].y;
  const chin     = pts[8].y;
  const faceH    = chin - noseTop;
  const faceMidY = (noseTop + chin) / 2;

  const noseY      = pts[30].y;
  const noseToChin = chin - noseY;
  const noseToTop  = noseY - noseTop;
  const pitch      = faceH > 0 ? ((noseY - faceMidY) / faceH) * 100 : 0;

  const downRatio = noseToChin / (noseToTop  + 0.001);
  const upRatio   = noseToTop  / (noseToChin + 0.001);

  return {
    yaw,
    pitch,
    downRatio,
    upRatio,
    passes: {
      left:  yaw < -14,
      right: yaw > 14,
      up:    upRatio   < 0.75,
      down:  downRatio < 1.3,
    },
  };
}

// ─── Canvas drawing helpers ───────────────────────────────────────────────────

function drawGuideCircle(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const midX   = W / 2;
  const midY   = H / 2;
  const guideR = Math.min(W, H) * 0.38;

  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.30)";
  ctx.lineWidth   = 1.5;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.arc(midX, midY, guideR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawFaceCircle(
  ctx: CanvasRenderingContext2D,
  box: faceapi.Box,
  passed: boolean,
) {
  const cx = box.x + box.width  / 2;
  const cy = box.y + box.height / 2;
  const r  = Math.max(box.width, box.height) * 0.62;

  const color = passed
    ? "rgba(74, 222, 128, 0.95)"   
    : "rgba(0, 200, 120, 0.90)";   

  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 16, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = color;
  ctx.lineWidth   = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "rgba(0, 200, 120, 0.07)";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawLandmarks(
  ctx: CanvasRenderingContext2D,
  positions: faceapi.Point[],
) {
  ctx.fillStyle = "rgba(0, 220, 120, 0.75)";
  for (const pt of positions) {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  onComplete?: (result: AnalysisResult) => void;
  onContinue?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LivenessSelfie({ onComplete, onContinue }: Props) {
  const { user } = useAuth();
  const videoRef   = useRef<HTMLVideoElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const rafRef     = useRef<number>(0);
  const holdRef    = useRef<Partial<Record<PoseDir, number>>>({});

  const mediaRecorderRef  = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const isProcessingRef   = useRef<boolean>(false);

  const [phase,        setPhase]        = useState<Phase>("loading");
  const [challengeIdx, setChallengeIdx] = useState(0);
  const [passed,       setPassed]       = useState<Set<PoseDir>>(new Set());
  const [selfieUrl,    setSelfieUrl]    = useState<string | null>(null);
  const [result,       setResult]       = useState<AnalysisResult | null>(null);
  const [errorMsg,     setErrorMsg]     = useState("");
  const [loadProgress, setLoadProgress] = useState(0);

  const router = useRouter();

  // ── Load models ──────────────────────────────────────────────────────────────
// ── Change This Section in your useEffect ───────────────────
// ── Update your model loader to look in the subfolders ───
useEffect(() => {
  let cancelled = false;
  (async () => {
    // 1. Tiny Face Detector is in the root /models folder
    await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
    if (cancelled) return;
    setLoadProgress(40);
    
    // 2. Point specifically to the nested subfolder where the tiny landmarks live 🌟
    await faceapi.nets.faceLandmark68TinyNet.loadFromUri("/models/face_landmark_68_tiny");
    if (cancelled) return;
    setLoadProgress(80);
    
    // 3. Expression net manifest is located in the root /models folder
    await faceapi.nets.faceExpressionNet.loadFromUri("/models");
    if (cancelled) return;
    setLoadProgress(100);
    setPhase("instructions");
  })().catch((e) => {
    setErrorMsg(`Model load failed: ${e.message}`);
    setPhase("error");
  });
  return () => { cancelled = true; };
}, []);

  // ── Stop camera ──────────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const v = videoRef.current;
    if (v?.srcObject) {
      (v.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      v.srcObject = null;
    }
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // ── Live Video Evaluation Pipeline ───────────────────────────────────────────
  const runVerificationPipeline = useCallback(async (videoBlob: Blob, fallbackStillData: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    
    setPhase("analyzing");

    try {
      const requestId = `${user?.id}_${Date.now()}`;
      const mobileNumber = user?.mobile || "";
      
      const response = await selfieApiService.verifyLiveness(
        videoBlob,
        requestId, 
        mobileNumber, 
        CHALLENGES.map((c) => c.key.toUpperCase())
      );

      const parsedAnalysis: AnalysisResult = {
        livenessScore: response.livenessScore,
        isLive: response.livenessPass,
        faceMatchScore: response.faceMatchScore,
        faceMatchPass: response.faceMatchPass,
        overallPass: response.overallPass,
        summary: response.overallPass
          ? "Identity and liveness verified successfully."
          : "Liveness verification failed. Please try again.",
      };

      if (response.capturedImage) {
        setSelfieUrl(`data:image/jpeg;base64,${response.capturedImage}`);
      }

      setResult(parsedAnalysis);
      onComplete?.(parsedAnalysis);
      setPhase("result");
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "An error occurred during secure pipeline inspection.");
      setPhase("error");
    } finally {
      isProcessingRef.current = false;
    }
  }, [onComplete, user?.mobile]);

  // ── Start challenge ───────────────────────────────────────────────────────────
  const startChallenge = useCallback(async () => {
    holdRef.current = {};
    setPassed(new Set());
    setChallengeIdx(0);
    recordedChunksRef.current = [];
    isProcessingRef.current = false;
    setPhase("challenge");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      });

      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();

      const mimeType = MediaRecorder.isTypeSupported("video/mp4") ? "video/mp4" : "video/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.start(100); 
      mediaRecorderRef.current = recorder;

      const overlay = overlayRef.current!;
      overlay.width = video.videoWidth || 640;
      overlay.height = video.videoHeight || 480;
      const ctx = overlay.getContext("2d")!;

      let localChallengeIdx = 0;
      let localPassed = new Set<PoseDir>();

      const trackFrameLoop = async () => {
        if (video.paused || video.ended || isProcessingRef.current) return;

        ctx.clearRect(0, 0, overlay.width, overlay.height);
        drawGuideCircle(ctx, overlay.width, overlay.height);

        const detection = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.4 }))
          .withFaceLandmarks(true);

        if (detection) {
          const currentTarget = CHALLENGES[localChallengeIdx];
          
          // 🌟 FIX: Separately resolve raw landmark positions and computed pass triggers
          const { positions } = detection.landmarks;
          const { passes } = detectPose(detection.landmarks);
          
          drawLandmarks(ctx, positions);

          const isMatchingPose = !!passes[currentTarget.key];
          if (isMatchingPose) {
            holdRef.current[currentTarget.key] = (holdRef.current[currentTarget.key] || 0) + 1;
          } else {
            holdRef.current[currentTarget.key] = 0;
          }

          const hasHeldLongEnough = (holdRef.current[currentTarget.key] || 0) >= HOLD_FRAMES;
          drawFaceCircle(ctx, detection.detection.box, hasHeldLongEnough);

          if (hasHeldLongEnough && !localPassed.has(currentTarget.key)) {
            localPassed.add(currentTarget.key);
            setPassed(new Set(localPassed));

            if (localChallengeIdx + 1 < CHALLENGES.length) {
              localChallengeIdx += 1;
              setChallengeIdx(localChallengeIdx);
            } else {
              stopCamera();

              if (recorder && recorder.state !== "inactive") {
                recorder.stop();
              }

              const canvas = canvasRef.current!;
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx2 = canvas.getContext("2d")!;
              ctx2.drawImage(video, 0, 0);
              const fallbackStillData = canvas.toDataURL("image/jpeg", 0.85);
              setSelfieUrl(fallbackStillData);

              await new Promise<void>((resolve) => {
                if (!recorder || recorder.state === "inactive") { resolve(); return; }
                recorder.onstop = () => resolve();
              });

              const videoBlob = new Blob(recordedChunksRef.current, { type: "video/mp4" });
              await runVerificationPipeline(videoBlob, fallbackStillData);
              return;
            }
          }
        }

        rafRef.current = requestAnimationFrame(trackFrameLoop);
      };

      rafRef.current = requestAnimationFrame(trackFrameLoop);
    } catch (err: any) {
      setErrorMsg(`Camera initiation block failure: ${err.message}`);
      setPhase("error");
    }
  }, [stopCamera, runVerificationPipeline]);

  // ── Reset ────────────────────────────────────────────────────────────────────
  function reset() {
    stopCamera();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    recordedChunksRef.current = [];
    isProcessingRef.current = false;
    setSelfieUrl(null);
    setResult(null);
    setPassed(new Set());
    setChallengeIdx(0);
    holdRef.current = {};
    setPhase("instructions");
  }

  const currentChallenge = CHALLENGES[challengeIdx];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* ── Loading ── */}
        {phase === "loading" && (
          <div className="p-8 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
            <p className="font-medium text-gray-700">Loading face models…</p>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400">{loadProgress}%</p>
          </div>
        )}

        {/* ── Instructions ── */}
        {phase === "instructions" && (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-center text-gray-900">
              Face Verification
            </h1>
            <p className="text-center text-gray-500 mt-1 text-sm">
              Liveness check · ID face match
            </p>
            <div className="mt-5 space-y-2.5">
              {[
                "Good even lighting on your face",
                "Remove glasses or mask",
                "Hold device at eye level",
                "You will turn your head in 4 directions",
              ].map((tip) => (
                <div key={tip} className="flex gap-2.5 text-sm text-gray-700">
                  <span className="text-green-500 font-bold shrink-0">✓</span>
                  {tip}
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              {CHALLENGES.map(({ key, arrow, label }) => (
                <div
                  key={key}
                  className="flex-1 bg-gray-50 rounded-xl py-2 flex flex-col items-center text-xs text-gray-500 gap-1"
                >
                  <span className="text-base font-bold text-gray-700">{arrow}</span>
                  {label}
                </div>
              ))}
            </div>
            <button
              onClick={startChallenge}
              className="w-full mt-5 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-all cursor-pointer"
            >
              Start Verification
            </button>
          </div>
        )}

        {/* ── Challenge ── */}
        {phase === "challenge" && (
          <div>
            <div className="relative bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full aspect-[4/3] object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
              <canvas
                ref={overlayRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ transform: "scaleX(-1)" }}
              />
              <div className="absolute top-3 left-0 right-0 flex justify-center">
                <div className="bg-black/65 text-white text-sm font-semibold px-5 py-2 rounded-full flex items-center gap-2">
                  <span className="text-green-400 text-lg">
                    {currentChallenge.arrow}
                  </span>
                  {currentChallenge.label}
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="flex gap-2">
                {CHALLENGES.map(({ key, arrow, label }) => {
                  const done   = passed.has(key);
                  const active = !done && key === currentChallenge.key;
                  return (
                    <div
                      key={key}
                      className={`flex-1 rounded-xl py-2.5 flex flex-col items-center gap-1 text-xs font-medium transition-all ${
                        done
                          ? "bg-green-100 text-green-700"
                          : active
                            ? "bg-blue-100 text-blue-700 ring-1 ring-blue-400"
                            : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      <span className="text-base">{done ? "✅" : arrow}</span>
                      {label}
                    </div>
                  );
                })}
              </div>
              <p className="text-center text-xs text-gray-400 mt-2">
                {passed.size} / {CHALLENGES.length} completed
              </p>
            </div>
          </div>
        )}

        {/* ── Analyzing ── */}
        {phase === "analyzing" && (
          <div className="p-8 flex flex-col items-center gap-4">
            {selfieUrl && (
              <img
                src={selfieUrl}
                alt="Captured selfie"
                className="w-28 h-28 rounded-full object-cover border-4 border-blue-100 animate-pulse"
              />
            )}
            <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
            <p className="font-medium text-gray-700">Verifying identity via API…</p>
            <p className="text-xs text-gray-400 text-center">
              Evaluating liveness & face match verification models
            </p>
          </div>
        )}

        {/* ── Result ── */}
        {phase === "result" && result && (
          <div className="p-6">
            <div className="flex flex-col items-center gap-2 mb-5">
              {selfieUrl && (
                <div className="relative">
                  <img
                    src={selfieUrl}
                    alt="Selfie"
                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
                  />
                  <span className="absolute -bottom-1 -right-1 text-2xl">
                    {result.overallPass ? "✅" : "❌"}
                  </span>
                </div>
              )}
              <h2
                className={`text-lg font-bold ${
                  result.overallPass ? "text-green-700" : "text-red-600"
                }`}
              >
                {result.overallPass ? "Verification Passed" : "Verification Failed"}
              </h2>
              <p className="text-sm text-gray-500 text-center">{result.summary}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <ScoreCard
                label="Liveness score"
                score={result.livenessScore}
                pass={result.isLive}
              />
              {result.faceMatchScore !== null && (
                <ScoreCard
                  label="Face match (NID)"
                  score={result.faceMatchScore}
                  pass={result.faceMatchPass ?? false}
                />
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={reset}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Retry
              </button>
              {result.overallPass && (
                <button
                  onClick={onContinue}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors cursor-pointer"
                >
                  Continue →
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {phase === "error" && (
          <div className="p-6 flex flex-col items-center gap-4">
            <span className="text-4xl">⚠️</span>
            <h2 className="text-lg font-bold text-red-600">Something went wrong</h2>
            <p className="text-sm text-gray-500 text-center break-all">{errorMsg}</p>
            <button
              onClick={reset}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}

// ─── ScoreCard ────────────────────────────────────────────────────────────────

function ScoreCard({
  label,
  score,
  pass,
  passLabel = "Pass",
  failLabel = "Fail",
  className = "",
}: {
  label: string;
  score: number;
  pass: boolean;
  passLabel?: string;
  failLabel?: string;
  className?: string;
}) {
  const barColor =
    score >= 80 ? "bg-green-400" : score >= 60 ? "bg-yellow-400" : "bg-red-400";

  return (
    <div className={`bg-gray-50 rounded-xl p-3 ${className}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <div className="flex items-center justify-between">
        <span className="text-2xl font-bold text-gray-800">{score}</span>
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-full ${
            pass
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {pass ? passLabel : failLabel}
        </span>
      </div>
      <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}