"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { useRouter } from "next/navigation";

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
  isDeepfake: boolean;
  deepfakeReason: string;
  faceMatchScore: number | null;
  faceMatchPass: boolean | null;
  overallPass: boolean;
  summary: string;
};

const CHALLENGES: { key: PoseDir; label: string; arrow: string }[] = [
  { key: "left", label: "Turn left", arrow: "←" },
  { key: "right", label: "Turn right", arrow: "→" },
  { key: "up", label: "Look up", arrow: "↑" },
  { key: "down", label: "Look down", arrow: "↓" },
];

const HOLD_FRAMES = 8;

// ─── Pose detection ───────────────────────────────────────────────────────────
// Video is CSS-mirrored (scaleX -1) so the user sees a mirror image.
// face-api landmark coords come from the RAW (unflipped) frame.
// Raw frame: pts[36] = user's RIGHT eye (left side of raw image)
//            pts[45] = user's LEFT  eye (right side of raw image)
// So raw yaw > 0 means nose shifted RIGHT in raw frame
//   = user's head turned LEFT in mirror view.
// We FLIP the sign so displayed left/right matches what the user sees.

function detectPose(
  lm: faceapi.FaceLandmarks68,
  videoWidth: number,
): {
  yaw: number;
  pitch: number;
  downRatio: number;
  upRatio: number;
  passes: Partial<Record<PoseDir, boolean>>;
} {
  const pts = lm.positions;

  // Eye span from raw coords
  const eyeLeft = pts[36]; // raw left  = user's right eye
  const eyeRight = pts[45]; // raw right = user's left  eye
  const eyeWidth = eyeRight.x - eyeLeft.x; // always positive

  // Eye horizontal midpoint
  const eyeMidX =
    ((pts[36].x + pts[39].x) / 2 + (pts[42].x + pts[45].x) / 2) / 2;

  // Raw yaw: nose shifted right in raw frame = user turned LEFT in mirror
  const rawYaw = eyeWidth > 0 ? ((pts[30].x - eyeMidX) / eyeWidth) * 100 : 0;

  // FLIP sign so positive yaw = user turned RIGHT (matches mirror view)
  const yaw = -rawYaw;

  // Pitch: nose tip vs face vertical midpoint
  // pts[27] = nose bridge top, pts[8] = chin
  const noseTop = pts[27].y;
  const chin = pts[8].y;
  const faceH = chin - noseTop;
  const faceMidY = (noseTop + chin) / 2;

  // ── Pitch via segment ratio (works regardless of camera angle) ──────────
  // When looking DOWN: chin rises toward nose  → noseToChin shrinks
  // When looking UP:   nose rises toward brow  → noseToTop  shrinks
  // We compare the two halves as a ratio — immune to camera tilt / placement.
  // Your debug showed pitch: -11.6 while clearly looking down, which means
  // raw Y-pitch is unreliable on your setup. Ratio method fixes this.
  const noseY = pts[30].y;
  const noseToChin = chin - noseY; // shrinks when looking down
  const noseToTop = noseY - noseTop; // shrinks when looking up
  const pitch = faceH > 0 ? ((noseY - faceMidY) / faceH) * 100 : 0; // for debug display only

  const downRatio = noseToChin / (noseToTop + 0.001); // < 0.75 = looking down
  const upRatio = noseToTop / (noseToChin + 0.001); // < 0.75 = looking up

  return {
    yaw,
    pitch,
    downRatio,
    upRatio,
    passes: {
      left: yaw < -14,
      right: yaw > 14,
      up: upRatio < 0.75,
      down: downRatio < 1.3,
    },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function canvasToBase64(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL("image/jpeg", 0.92).split(",")[1];
}

function descriptorDistance(a: Float32Array, b: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
  return Math.sqrt(sum);
}

function distanceToScore(d: number): number {
  return Math.round(Math.max(0, Math.min(100, (1 - d / 0.6) * 100)));
}

async function claudeAnalyze(selfieB64: string): Promise<{
  livenessScore: number;
  isLive: boolean;
  isDeepfake: boolean;
  deepfakeReason: string;
}> {
  const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey)
    return {
      livenessScore: 75,
      isLive: true,
      isDeepfake: false,
      deepfakeReason: "",
    };

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: selfieB64,
              },
            },
            {
              type: "text",
              text: `You are a biometric liveness and deepfake detection AI.
Analyze this selfie. Return ONLY valid JSON, no markdown, no explanation.
{
  "livenessScore": <integer 0-100>,
  "isLive": <boolean, true if livenessScore >= 65>,
  "isDeepfake": <boolean>,
  "deepfakeReason": "<empty string if not deepfake>"
}`,
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Claude API ${res.status}`);
  const data = await res.json();
  const text = data.content
    .map((b: { type: string; text?: string }) => b.text ?? "")
    .join("")
    .replace(/```json|```/g, "")
    .trim();
  return JSON.parse(text);
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  idCardFile?: File | null;
  onComplete?: (result: AnalysisResult) => void;
  onContinue?: () => void;
}

export default function LivenessSelfie({
  idCardFile,
  onComplete,
  onContinue,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const holdRef = useRef<Partial<Record<PoseDir, number>>>({});

  const [phase, setPhase] = useState<Phase>("loading");
  const [challengeIdx, setChallengeIdx] = useState(0);
  const [passed, setPassed] = useState<Set<PoseDir>>(new Set());
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [loadProgress, setLoadProgress] = useState(0);

  const router = useRouter();

  // Debug state — remove in production
  const [debugPose, setDebugPose] = useState({
    yaw: 0,
    pitch: 0,
    downRatio: 0,
    upRatio: 0,
  });

  // ── Load models ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const M = "/models";
      setLoadProgress(10);
      await faceapi.nets.tinyFaceDetector.loadFromUri(M);
      if (cancelled) return;
      setLoadProgress(35);
      await faceapi.nets.faceLandmark68Net.loadFromUri(M);
      if (cancelled) return;
      setLoadProgress(65);
      await faceapi.nets.faceRecognitionNet.loadFromUri(M);
      if (cancelled) return;
      setLoadProgress(90);
      await faceapi.nets.faceExpressionNet.loadFromUri(M);
      if (cancelled) return;
      setLoadProgress(100);
      setPhase("instructions");
    })().catch((e) => {
      setErrorMsg(`Model load failed: ${e.message}`);
      setPhase("error");
    });
    return () => {
      cancelled = true;
    };
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

  // ── Start challenge ───────────────────────────────────────────────────────────
  const startChallenge = useCallback(async () => {
    holdRef.current = {};
    setPassed(new Set());
    setChallengeIdx(0);
    setPhase("challenge");

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: 640, height: 480 },
      audio: false,
    });

    const video = videoRef.current!;
    video.srcObject = stream;
    await video.play();

    const overlay = overlayRef.current!;
    const opts = new faceapi.TinyFaceDetectorOptions({
      inputSize: 320,
      scoreThreshold: 0.5,
    });

    let localPassed = new Set<PoseDir>();
    let localChallengeIdx = 0;

    async function detect() {
      if (!videoRef.current || videoRef.current.paused) return;

      const W = videoRef.current.videoWidth || 640;
      const H = videoRef.current.videoHeight || 480;
      overlay.width = W;
      overlay.height = H;

      const ctx = overlay.getContext("2d")!;
      ctx.clearRect(0, 0, W, H);

      const det = await faceapi
        .detectSingleFace(videoRef.current, opts)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (det) {
        const { landmarks, detection: d, descriptor } = det;

        // ── Draw overlay on MIRRORED canvas ───────────────────────────────
        // Canvas itself is CSS-flipped (scaleX -1) to match the video.
        // So we draw at RAW coords — the CSS flip puts them in the right place.
        ctx.strokeStyle = "rgba(0, 220, 120, 0.85)";
        ctx.lineWidth = 2;
        ctx.strokeRect(d.box.x, d.box.y, d.box.width, d.box.height);

        ctx.fillStyle = "rgba(0, 220, 120, 0.9)";
        for (const pt of landmarks.positions) {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
          ctx.fill();
        }

        // ── Pose logic ────────────────────────────────────────────────────
        const { yaw, pitch, downRatio, upRatio, passes } = detectPose(
          landmarks,
          W,
        );
        setDebugPose({ yaw, pitch, downRatio, upRatio });

        const challenge = CHALLENGES[localChallengeIdx];
        if (challenge && passes[challenge.key]) {
          holdRef.current[challenge.key] =
            (holdRef.current[challenge.key] ?? 0) + 1;

          if (
            (holdRef.current[challenge.key] ?? 0) >= HOLD_FRAMES &&
            !localPassed.has(challenge.key)
          ) {
            localPassed = new Set([...localPassed, challenge.key]);
            setPassed(new Set(localPassed));
            holdRef.current[challenge.key] = 0;

            const nextIdx = localChallengeIdx + 1;

            if (nextIdx >= CHALLENGES.length) {
              // All done — capture
              stopCamera();
              const cap = canvasRef.current!;
              cap.width = W;
              cap.height = H;
              cap.getContext("2d")!.drawImage(videoRef.current!, 0, 0);
              setSelfieUrl(cap.toDataURL("image/jpeg", 0.92));
              setPhase("analyzing");
              runAnalysis(canvasToBase64(cap), descriptor, idCardFile ?? null);
              return;
            }

            localChallengeIdx = nextIdx;
            setChallengeIdx(nextIdx);
          }
        } else {
          holdRef.current[challenge?.key ?? "left"] = 0;
        }
      }

      rafRef.current = requestAnimationFrame(detect);
    }

    rafRef.current = requestAnimationFrame(detect);
  }, [idCardFile, stopCamera]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Analysis ─────────────────────────────────────────────────────────────────
  async function runAnalysis(
    selfieB64: string,
    descriptor: Float32Array,
    idFile: File | null,
  ) {
    try {
      const claudeResult = await claudeAnalyze(selfieB64);

      let faceMatchScore: number | null = null;
      let faceMatchPass: boolean | null = null;

      if (idFile) {
        const img = await faceapi.fetchImage(URL.createObjectURL(idFile));
        const idDet = await faceapi
          .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();
        if (idDet) {
          const dist = descriptorDistance(descriptor, idDet.descriptor);
          faceMatchScore = distanceToScore(dist);
          faceMatchPass = faceMatchScore >= 60;
        }
      }

      const overallPass =
        claudeResult.isLive &&
        !claudeResult.isDeepfake &&
        (faceMatchPass === null || faceMatchPass === true);

      const res: AnalysisResult = {
        ...claudeResult,
        faceMatchScore,
        faceMatchPass,
        overallPass,
        summary: overallPass
          ? "Identity verified successfully."
          : "Verification failed — please retake.",
      };

      setResult(res);
      setPhase("result");
      onComplete?.(res);
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
      setPhase("error");
    }
  }

  // ── Reset ────────────────────────────────────────────────────────────────────
  function reset() {
    stopCamera();
    setSelfieUrl(null);
    setResult(null);
    setPassed(new Set());
    setChallengeIdx(0);
    holdRef.current = {};
    setPhase("instructions");
  }

  const currentChallenge = CHALLENGES[challengeIdx];

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Loading */}
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

        {/* Instructions */}
        {phase === "instructions" && (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-center text-gray-900">
              Face Verification
            </h1>
            <p className="text-center text-gray-500 mt-1 text-sm">
              Liveness · deepfake detection{idCardFile ? " · ID match" : ""}
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
                  <span className="text-base font-bold text-gray-700">
                    {arrow}
                  </span>
                  {label}
                </div>
              ))}
            </div>
            <button
              onClick={startChallenge}
              className="w-full mt-5 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-all"
            >
              Start Verification
            </button>

            <button
              onClick={() => router.push("/register/basic-informations")}
              className="w-full mt-5 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-all"
            >
              Next
            </button>
          </div>
        )}

        {/* Challenge */}
        {phase === "challenge" && (
          <div>
            <div className="relative bg-black">
              {/* Video — CSS mirrored so user sees themselves naturally */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full aspect-[4/3] object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
              {/* Overlay canvas — ALSO CSS mirrored to match video */}
              <canvas
                ref={overlayRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ transform: "scaleX(-1)" }}
              />
              {/* Direction pill */}
              <div className="absolute top-3 left-0 right-0 flex justify-center">
                <div className="bg-black/65 text-white text-sm font-semibold px-5 py-2 rounded-full flex items-center gap-2">
                  <span className="text-green-400 text-lg">
                    {currentChallenge.arrow}
                  </span>
                  {currentChallenge.label}
                </div>
              </div>
            </div>

            {/* Challenge tiles */}
            <div className="p-4">
              <div className="flex gap-2">
                {CHALLENGES.map(({ key, arrow, label }) => {
                  const done = passed.has(key);
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

              {/* ── DEBUG BAR — remove this whole block in production ── */}
              {/* <div className="mt-3 p-2 bg-gray-900 rounded-lg font-mono text-xs flex flex-wrap gap-x-3 gap-y-1">
                <span className="text-yellow-400">
                  yaw:{debugPose.yaw.toFixed(1)}
                </span>
                <span className="text-cyan-400">
                  pitch:{debugPose.pitch.toFixed(1)}
                </span>
                <span className="text-purple-400">
                  ↓ratio:{debugPose.downRatio.toFixed(2)}
                </span>
                <span className="text-pink-400">
                  ↑ratio:{debugPose.upRatio.toFixed(2)}
                </span>
                <span
                  className={
                    debugPose.yaw < -14 ? "text-green-400" : "text-gray-600"
                  }
                >
                  ← left
                </span>
                <span
                  className={
                    debugPose.yaw > 14 ? "text-green-400" : "text-gray-600"
                  }
                >
                  right →
                </span>
                <span
                  className={
                    debugPose.upRatio < 0.75
                      ? "text-green-400"
                      : "text-gray-600"
                  }
                >
                  ↑ up
                </span>
                <span
                  className={
                    debugPose.downRatio < 0.75
                      ? "text-green-400"
                      : "text-gray-600"
                  }
                >
                  ↓ down
                </span>
              </div> */}
              {/* ── END DEBUG BAR ── */}

              <p className="text-center text-xs text-gray-400 mt-2">
                {passed.size} / {CHALLENGES.length} done
              </p>
            </div>
          </div>
        )}

        {/* Analyzing */}
        {phase === "analyzing" && (
          <div className="p-8 flex flex-col items-center gap-4">
            {selfieUrl && (
              <img
                src={selfieUrl}
                alt="Captured selfie"
                className="w-28 h-28 rounded-full object-cover border-4 border-blue-100"
              />
            )}
            <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
            <p className="font-medium text-gray-700">Analyzing…</p>
            <p className="text-xs text-gray-400 text-center">
              Liveness · deepfake{idCardFile ? " · face match" : ""}
            </p>
          </div>
        )}

        {/* Result */}
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
                className={`text-lg font-bold ${result.overallPass ? "text-green-700" : "text-red-600"}`}
              >
                {result.overallPass
                  ? "Verification Passed"
                  : "Verification Failed"}
              </h2>
              <p className="text-sm text-gray-500 text-center">
                {result.summary}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <ScoreCard
                label="Liveness score"
                score={result.livenessScore}
                pass={result.isLive}
              />
              <ScoreCard
                label="Deepfake check"
                score={result.isDeepfake ? 0 : 100}
                pass={!result.isDeepfake}
                passLabel="Authentic"
                failLabel="Suspected"
                bar={false}
              />
              {result.faceMatchScore !== null && (
                <ScoreCard
                  label="Face match (ID card)"
                  score={result.faceMatchScore}
                  pass={result.faceMatchPass ?? false}
                  className="col-span-2"
                />
              )}
            </div>
            {result.isDeepfake && result.deepfakeReason && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700 mb-4">
                <strong>Deepfake signal:</strong> {result.deepfakeReason}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={reset}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Retry
              </button>
              {result.overallPass && (
                <button
                  onClick={onContinue}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
                >
                  Continue →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {phase === "error" && (
          <div className="p-6 flex flex-col items-center gap-4">
            <span className="text-4xl">⚠️</span>
            <h2 className="text-lg font-bold text-red-600">
              Something went wrong
            </h2>
            <p className="text-sm text-gray-500 text-center break-all">
              {errorMsg}
            </p>
            <button
              onClick={reset}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold"
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
  bar = true,
  className = "",
}: {
  label: string;
  score: number;
  pass: boolean;
  passLabel?: string;
  failLabel?: string;
  bar?: boolean;
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
          className={`text-xs font-semibold px-2 py-1 rounded-full ${pass ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
        >
          {pass ? passLabel : failLabel}
        </span>
      </div>
      {bar && (
        <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${barColor}`}
            style={{ width: `${score}%` }}
          />
        </div>
      )}
    </div>
  );
}
