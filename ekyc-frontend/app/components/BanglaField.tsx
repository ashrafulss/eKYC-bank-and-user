"use client";

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

interface BanglaKeyboardProps {
    value: string;
    onChange: (val: string) => void;
    onClose: () => void;
    anchorRef: React.RefObject<HTMLDivElement | null>;
    inputRef: React.RefObject<HTMLInputElement | null>;
}

function BanglaKeyboard({
    value,
    onChange,
    onClose,
    anchorRef,
    inputRef,
}: BanglaKeyboardProps) {
    const [shiftState, setShiftState] = useState<0 | 1 | 2>(0);

    // Positioning and Dragging states
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });

    // Dynamic Sizing states (Default set to absolute minimum bounds)
    const [dimensions, setDimensions] = useState({ width: 340, height: 260 });
    const [isResizing, setIsResizing] = useState(false);
    const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (anchorRef.current) {
            const rect = anchorRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + window.scrollY + 8,
                left: Math.max(16, rect.left + window.scrollX + (rect.width - 340) / 2),
            });
        }
    }, [anchorRef]);

    const restoreFocus = () => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const handleKey = (char: string) => {
        onChange(value + char);
        if (shiftState === 1) setShiftState(0);
        restoreFocus();
    };

    const handleBackspace = () => {
        onChange(value.slice(0, -1));
        restoreFocus();
    };

    const handleSpace = () => {
        onChange(value + " ");
        restoreFocus();
    };

    const handleClear = () => {
        onChange("");
        restoreFocus();
    };

    const handleShiftToggle = () => {
        if (shiftState === 0) setShiftState(1);
        else if (shiftState === 1) setShiftState(2);
        else setShiftState(0);
        restoreFocus();
    };

    const onDragMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest("button")) return;
        setIsDragging(true);
        dragStart.current = { x: e.clientX - position.left, y: e.clientY - position.top };
        e.preventDefault();
    };

    const onResizeMouseDown = (e: React.MouseEvent) => {
        setIsResizing(true);
        resizeStart.current = {
            x: e.clientX,
            y: e.clientY,
            w: dimensions.width,
            h: dimensions.height,
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
                position: "absolute",
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
                                <span
                                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${shiftState === 2 ? "bg-amber-400" : "bg-cyan-400"
                                        }`}
                                ></span>
                            )}
                            <span
                                className={`relative inline-flex rounded-full h-2 w-2 ${shiftState === 2 ? "bg-amber-500" : isShiftActive ? "bg-cyan-500" : "bg-slate-600"
                                    }`}
                            ></span>
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                            {shiftState === 2
                                ? "বাংলা কিবোর্ড (LOCKED)"
                                : shiftState === 1
                                    ? "বাংলা কিবোর্ড (SHIFT ON)"
                                    : "বাংলা কিবোর্ড (Drag/Resize)"}
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
                                    onMouseDown={(e) => e.preventDefault()}
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
                        onMouseDown={(e) => e.preventDefault()}
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
                        onMouseDown={(e) => e.preventDefault()}
                        className="col-span-4 h-full bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 font-medium text-xs border-b-2 border-slate-900 rounded transition-all flex items-center justify-center tracking-widest cursor-pointer"
                    >
                        SPACE
                    </button>


                    <button
                        type="button"
                        onClick={handleClear}
                        onMouseDown={(e) => e.preventDefault()}
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
                    <svg
                        className="w-2.5 h-2.5 text-slate-600 group-hover:text-cyan-400 transition-colors"
                        viewBox="0 0 10 10"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                    >
                        <line x1="7" y1="3" x2="3" y2="7" />
                        <line x1="9" y1="5" x2="5" y2="9" />
                    </svg>
                </div>
            </div>
        </div>,
        document.body
    );
}

// ── EXPORTED REUSABLE BANGLAFIELD COMPONENT ─────────────────────────────────
interface BanglaFieldProps {
    label: string;
    value: string;
    onChange: (val: string) => void;
    required?: boolean;
    inputStyles?: string;
}

export default function BanglaField({
    label,
    value,
    onChange,
    required = false,
    inputStyles = "",
}: BanglaFieldProps) {
    const [showKeyboard, setShowKeyboard] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputWrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

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
        // Blocks English letters (a-z, A-Z) and English digits (0-9)
        const englishFiltered = inputValue.replace(/[a-zA-Z0-9]/g, "");
        onChange(englishFiltered);
    };

    return (
        <div ref={containerRef} className="grid grid-cols-1 sm:grid-cols-3 items-start gap-2">
            <label className="text-sm font-medium text-gray-500 pt-2">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div ref={inputWrapperRef} className="w-full sm:col-span-2 relative">
                <div className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={value}
                        onChange={(e) => handleInputChange(e.target.value)}
                        className={`${inputStyles} pr-20`}
                        placeholder="শুধুমাত্র বাংলায় লিখুন"
                    />
                    <button
                        type="button"
                        onClick={() => {
                            setShowKeyboard((p) => !p);
                            setTimeout(() => inputRef.current?.focus(), 0);
                        }}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs font-bold rounded bg-cyan-600 text-white hover:bg-cyan-700 px-2.5 py-1 transition-all cursor-pointer"
                    >
                        কীবোর্ড
                    </button>
                </div>
                {showKeyboard && (
                    <BanglaKeyboard
                        value={value}
                        onChange={handleInputChange}
                        onClose={() => setShowKeyboard(false)}
                        anchorRef={inputWrapperRef}
                        inputRef={inputRef}
                    />
                )}
            </div>
        </div>
    );
}