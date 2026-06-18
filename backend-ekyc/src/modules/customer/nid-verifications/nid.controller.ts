// Example: nid.controller.ts (when you build it)
import type { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { requireStep, advanceToStep, setStepCookie } from "../../../utils/stepGuard.js";

export const uploadNidDocument = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.customer!.id;

  // 🌟 STEP 1 — Verify the REAL database step before doing anything
  await requireStep(userId, "phone_number_verified");

  // ... process NID upload, OCR, save to user_documents table ...

  // 🌟 STEP 2 — Only after genuine success, advance the REAL step
  await advanceToStep(userId, "nid_verified");

  // 🌟 STEP 3 — Update the cookie for middleware UX routing
  setStepCookie(res, "nid_verified");

  ApiResponse.ok(res, { currentStep: "nid_verified" }, "NID verified successfully");
});