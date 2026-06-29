"use client";

import {
  BasicInformationsData,
  basicInformationService,
} from "@/app/services/basic.information.service";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// ── REAL WORLD LAYOUT MATRIX ────────────────────────────────────────────────
const KEYS_NORMAL = [
  ["া", "ি", "ী", "ু", "ূ", "ে", "ৈ", "ো", "ৌ", "ৃ"],
  ["ক", "গ", "চ", "জ", "ট", "ড", "ত", "দ", "প", "ব"],
  ["ন", "ম", "য", "র", "ল", "শ", "স", "হ", "য়", "ৎ"],
  ["ং", "ঃ", "ঁ", "্", ",", ".", "।", "-", "?", "!"],
];

const KEYS_SHIFT = [
  ["অ", "আ", "ই", "ঈ", "উ", "ঊ", "এ", "ঐ", "ও", "ঔ"],
  ["খ", "ঘ", "ছ", "ঝ", "ঠ", "ঢ", "থ", "ধ", "ফ", "ভ"],
  ["ঙ", "ঞ", "ণ", "ষ", "ড়", "ঢ়", "ক্ষ", "জ্ঞ", "র্", "ত্র"],
  ["১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯", "০"],
];

// ── PORTALED DRAGGABLE & RESIZABLE KEYBOARD COMPONENT ───────────────────────
function BanglaKeyboard({
  value,
  onChange,
  onClose,
  anchorRef,
}: {
  field: string;
  value: string;
  onChange: (val: string) => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [shiftState, setShiftState] = useState<0 | 1 | 2>(0);

  // Positioning and Dragging states
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Dynamic Sizing states (Default width: 448px, height: 260px)
  const [dimensions, setDimensions] = useState({ width: 448, height: 260 });
  const [isResizing, setIsResizing] = useState(false);
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const [mounted, setMounted] = useState(false);

  // Set initial position underneath the active form input wrapper
  useEffect(() => {
    setMounted(true);
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 8,
        left: Math.max(16, rect.left + window.scrollX + (rect.width - 448) / 2),
      });
    }
  }, [anchorRef]);

  const handleKey = (char: string) => {
    onChange(value + char);
    if (shiftState === 1) setShiftState(0);
  };

  const handleBackspace = () => onChange(value.slice(0, -1));
  const handleSpace = () => onChange(value + " ");
  const handleClear = () => onChange("");

  const handleShiftToggle = () => {
    if (shiftState === 0) setShiftState(1);
    else if (shiftState === 1) setShiftState(2);
    else setShiftState(0);
  };

  // ── Drag Logic (Header Bar Interaction) ──
  const onDragMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.left, y: e.clientY - position.top };
    e.preventDefault();
  };

  // ── Resize Logic (Bottom Right Handle Corner Interaction) ──
  const onResizeMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      w: dimensions.width,
      h: dimensions.height
    };
    e.preventDefault();
    e.stopPropagation();
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          left: e.clientX - dragStart.current.x,
          top: e.clientY - dragStart.current.y,
        });
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStart.current.x;
        const deltaY = e.clientY - resizeStart.current.y;

        setDimensions({
          width: Math.max(340, Math.min(800, resizeStart.current.w + deltaX)),
          height: Math.max(260, Math.min(500, resizeStart.current.h + deltaY)),
        });
      }
    };

    const onMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging, isResizing]);

  const isShiftActive = shiftState > 0;
  const currentLayout = isShiftActive ? KEYS_SHIFT : KEYS_NORMAL;

  if (!mounted) return null;

  return createPortal(
    <div
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        position: "absolute"
      }}
      className={`p-3 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-[99999] flex flex-col select-none ${isDragging ? "cursor-grabbing" : ""
        }`}
    >
      {/* Draggable Drag Header Handle Bar */}
      <div
        onMouseDown={onDragMouseDown}
        className="flex justify-between items-center mb-2 px-1 cursor-grab active:cursor-grabbing bg-slate-950/40 p-1.5 rounded-lg border border-slate-800/60 shrink-0"
      >
        <div className="flex items-center gap-2">
          <div className="grid grid-cols-2 gap-0.5 opacity-40">
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              {isShiftActive && (
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${shiftState === 2 ? "bg-amber-400" : "bg-cyan-400"}`}></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${shiftState === 2 ? "bg-amber-500" : isShiftActive ? "bg-cyan-500" : "bg-slate-600"}`}></span>
            </span>
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              {shiftState === 2 ? "বাংলা কিবোর্ড (LOCKED)" : shiftState === 1 ? "বাংলা কিবোর্ড (SHIFT ON)" : "বাংলা কিবোর্ড (Drag/Resize)"}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-[10px] text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded border border-slate-700 transition-all cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* Grid Keys Layout Container */}
      <div className="flex-1 min-h-0 flex flex-col justify-between bg-slate-950 p-2 rounded-lg border border-slate-850 relative">
        <div className="space-y-1 flex-1 flex flex-col justify-center">
          {currentLayout.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-10 gap-1 flex-1">
              {row.map((char) => (
                <button
                  key={char}
                  type="button"
                  onClick={() => handleKey(char)}
                  className="w-full h-full flex items-center justify-center bg-slate-800 hover:bg-cyan-600 active:bg-cyan-700 text-slate-100 hover:text-white rounded text-xs sm:text-sm font-semibold transition-colors shadow-sm cursor-pointer min-h-[32px]"
                >
                  {char}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Action Bottom Utility Rows */}
        <div className="grid grid-cols-10 gap-1 pt-1 shrink-0 h-10 mt-1">
          <button
            type="button"
            onClick={handleShiftToggle}
            className={`col-span-2 h-full text-[11px] font-bold uppercase rounded transition-all cursor-pointer flex items-center justify-center border-b-2 gap-0.5 ${shiftState === 2
              ? "bg-amber-600 border-amber-800 text-slate-950 font-extrabold"
              : shiftState === 1
                ? "bg-cyan-600 border-cyan-800 text-white"
                : "bg-slate-700 border-slate-900 text-slate-200 hover:bg-slate-600"
              }`}
          >
            {shiftState === 2 ? "🔒 SHIFT" : "⇧ SHIFT"}
          </button>

          <button
            type="button"
            onClick={handleSpace}
            className="col-span-4 h-full bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 font-medium text-xs border-b-2 border-slate-900 rounded transition-all flex items-center justify-center tracking-widest cursor-pointer"
          >
            SPACE
          </button>

          <button
            type="button"
            onClick={handleBackspace}
            className="col-span-2 h-full bg-red-600/90 hover:bg-red-600 text-white font-bold text-xs border-b-2 border-red-800 rounded transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            ⌫ DEL
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="col-span-2 h-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-500 hover:text-slate-400 font-medium text-[10px] uppercase rounded transition-all flex items-center justify-center cursor-pointer"
          >
            CLEAR
          </button>
        </div>

        {/* Dynamic Resize Handle Corner Grip UI */}
        <div
          onMouseDown={onResizeMouseDown}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-end justify-end p-0.5 z-50 group"
        >
          <svg className="w-2.5 h-2.5 text-slate-600 group-hover:text-cyan-400 transition-colors" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="7" y1="3" x2="3" y2="7" />
            <line x1="9" y1="5" x2="5" y2="9" />
          </svg>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── BANGLA INPUT FIELD ──────────────────────────────────────────────────────
function BanglaField({
  label,
  fieldKey,
  value,
  onChange,
  required = false,
  inputStyles,
}: {
  label: string;
  fieldKey: string;
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  inputStyles: string;
}) {
  const [showKeyboard, setShowKeyboard] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if ((event.target as HTMLElement).closest(".z-\\[99999\\]")) return;
        setShowKeyboard(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (inputValue: string) => {
    const banglaOnlyFiltered = inputValue.replace(/[^ \u0980-\u09ff]/g, "");
    onChange(banglaOnlyFiltered);
  };

  return (
    <div ref={containerRef} className="grid grid-cols-1 sm:grid-cols-3 items-start gap-2">
      <label className="text-sm font-medium text-gray-500 pt-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div ref={inputWrapperRef} className="w-full sm:col-span-2 relative">
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            // REMOVED onFocus triggers entirely so standard text focus is untouched
            className={`${inputStyles} pr-20`}
            placeholder="শুধুমাত্র বাংলায় লিখুন"
          />
          <button
            type="button"
            onClick={() => setShowKeyboard((p) => !p)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs font-bold rounded bg-cyan-600 text-white hover:bg-cyan-700 px-2.5 py-1 transition-all cursor-pointer"
          >
            কীবোর্ড
          </button>
        </div>
        {showKeyboard && (
          <BanglaKeyboard
            field={fieldKey}
            value={value}
            onChange={handleInputChange}
            onClose={() => setShowKeyboard(false)}
            anchorRef={inputWrapperRef}
          />
        )}
      </div>
    </div>
  );
}

// ── MAIN BASE FORM COMPONENT ──────────────────────────────────────────────────
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

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setErrorMessage(null);
        const data = await basicInformationService.getBasicInformations();
        if (data.dob) {
          const d = new Date(data.dob);
          if (!isNaN(d.getTime())) data.dob = d.toISOString().split("T")[0];
        }
        setFormData((prev) => ({ ...prev, ...data }));
      } catch (error: any) {
        setErrorMessage(error.message || "Could not retrieve identity details.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (field: keyof typeof formData, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  const isFormValid = () =>
    formData.fullNameEnglish.trim() !== "" &&
    formData.fullNameBangla.trim() !== "" &&
    formData.fatherNameBangla.trim() !== "" &&
    formData.motherNameBangla.trim() !== "" &&
    isValidEmail(formData.email) &&
    formData.nidNumber.trim() !== "" &&
    formData.dob.trim() !== "" &&
    formData.mobile.trim() !== "";

  const handleNextStep = async () => {
    if (!isFormValid() || submitting) return;
    try {
      setSubmitting(true);
      setErrorMessage(null);
      await basicInformationService.updateBasicInformations(formData);
      router.push("/register/nominee");
    } catch (error: any) {
      setErrorMessage(error.message || "Something went wrong while saving.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 font-medium">Fetching verified identity records...</p>
        </div>
      </div>
    );
  }

  const inputStyles =
    "w-full sm:col-span-2 px-3 py-2 bg-slate-50 border border-gray-200 rounded-md text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white";
  const readOnlyStyles =
    "w-full sm:col-span-2 px-3 py-2 bg-slate-100 border border-gray-200 rounded-md text-sm text-gray-500 cursor-not-allowed select-none";

  return (
    <div className="w-full min-h-screen bg-slate-50 overflow-y-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">

        {errorMessage && (
          <div className="w-full p-4 mb-6 bg-red-50 border-l-4 border-red-500 rounded-r-md text-sm text-red-700">
            <strong>Action Blocked:</strong> {errorMessage}
          </div>
        )}

        <div className="w-full mb-6">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Verify your primary information
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review and complete your personal details below.
          </p>
        </div>

        <form
          onSubmit={(e) => e.preventDefault()}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start"
        >
          {/* ── LEFT: Personal Information ── */}
          <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 md:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h2 className="text-xs font-bold tracking-wider text-cyan-700 uppercase">
                Personal Information
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <label className="text-sm font-medium text-gray-500">
                Full Name (English) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.fullNameEnglish}
                onChange={(e) => handleChange("fullNameEnglish", e.target.value)}
                className={inputStyles}
              />
            </div>

            <BanglaField
              label="Full Name (Bangla)"
              fieldKey="fullNameBangla"
              value={formData.fullNameBangla}
              onChange={(v) => handleChange("fullNameBangla", v)}
              required
              inputStyles={inputStyles}
            />

            <BanglaField
              label="Father's Name (Bangla)"
              fieldKey="fatherNameBangla"
              value={formData.fatherNameBangla}
              onChange={(v) => handleChange("fatherNameBangla", v)}
              required
              inputStyles={inputStyles}
            />

            <BanglaField
              label="Mother's Name (Bangla)"
              fieldKey="motherNameBangla"
              value={formData.motherNameBangla}
              onChange={(v) => handleChange("motherNameBangla", v)}
              required
              inputStyles={inputStyles}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <label className="text-sm font-medium text-gray-500">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => handleChange("dob", e.target.value)}
                className={inputStyles}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <label className="text-sm font-medium text-gray-500">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => handleChange("gender", e.target.value)}
                className={inputStyles}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <label className="text-sm font-medium text-gray-500">
                NID Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nidNumber}
                onChange={(e) => handleChange("nidNumber", e.target.value)}
                className={`${inputStyles} font-mono tracking-wide`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <label className="text-sm font-medium text-gray-500">
                Mobile Number
                <span className="text-[10px] ml-1 text-emerald-600 font-semibold">(Verified)</span>
              </label>
              <input
                type="tel"
                value={formData.mobile}
                readOnly
                className={readOnlyStyles}
              />
            </div>
          </div>

          {/* ── RIGHT: Contact & Employment ── */}
          <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 md:p-8 space-y-4">
            <h2 className="text-xs font-bold tracking-wider text-cyan-700 uppercase border-b border-gray-100 pb-2">
              Contact & Employment
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <label className="text-sm font-medium text-gray-500">Present Address</label>
              <input
                type="text"
                value={formData.presentAddress}
                onChange={(e) => handleChange("presentAddress", e.target.value)}
                className={inputStyles}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-2">
              <label className="text-sm font-medium text-gray-500 mt-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="w-full sm:col-span-2 space-y-1">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-md text-sm text-gray-800 focus:outline-none focus:ring-2 focus:bg-white ${formData.email && !isValidEmail(formData.email)
                    ? "border-red-400 focus:ring-red-400"
                    : "border-gray-200 focus:ring-blue-500"
                    }`}
                />
                {formData.email && !isValidEmail(formData.email) && (
                  <p className="text-xs text-red-500">Please enter a valid email address</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <label className="text-sm font-medium text-gray-500">Occupation</label>
              <input
                type="text"
                value={formData.occupation}
                onChange={(e) => handleChange("occupation", e.target.value)}
                className={inputStyles}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <label className="text-sm font-medium text-gray-500">Employer Name</label>
              <input
                type="text"
                value={formData.employer}
                onChange={(e) => handleChange("employer", e.target.value)}
                className={inputStyles}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <label className="text-sm font-medium text-gray-500">Monthly Income</label>
              <select
                value={formData.monthlyIncome}
                onChange={(e) => handleChange("monthlyIncome", e.target.value)}
                className={inputStyles}
              >
                <option value="Below BDT 50,000">Below BDT 50,000</option>
                <option value="BDT 50,000 - 100,000">BDT 50,000 - 100,000</option>
                <option value="BDT 100,000 - 500,000">BDT 100,000 - 500,000</option>
                <option value="BDT 500,000 - 1,000,000 / month">BDT 500,000 - 1,000,000 / month</option>
                <option value="Above BDT 1,000,000">Above BDT 1,000,000</option>
              </select>
            </div>

          </div>
        </form>

        {/* ── Footer ── */}
        <div className="w-full mt-8 flex justify-end border-t border-gray-200 pt-6">
          <button
            disabled={!isFormValid() || submitting}
            onClick={handleNextStep}
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
            ) : "Next"}
          </button>
        </div>

      </div>
    </div>
  );
}