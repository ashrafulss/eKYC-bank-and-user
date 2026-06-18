import { ForbiddenError } from "./AppError.js";
import pool from "../config/db.js";


export const STEP_ORDER = [
  "phone_number_verified",
  "nid_verified",
  "selfie_verified",
  "basic_info_done",
  "nominee_done",
  "review_done",
  "submitted",
] as const;

export type Step = (typeof STEP_ORDER)[number];

function getStepIndex(step: string | null | undefined): number {
  if (!step) return -1;
  return STEP_ORDER.indexOf(step as Step);
}


export async function requireStep(userId: string, requiredStep: Step): Promise<void> {
  const result = await pool.query(
    "SELECT current_step FROM users WHERE id = $1",
    [userId],
  );

  const dbStep = result.rows[0]?.current_step;
  const dbIndex = getStepIndex(dbStep);
  const requiredIndex = getStepIndex(requiredStep);

  if (dbIndex < requiredIndex) {
    throw new ForbiddenError(
      `Step '${requiredStep}' requires completing previous steps first. Current step: ${dbStep ?? "none"}.`,
      "STEP_NOT_COMPLETED",
    );
  }
}


export async function advanceToStep(userId: string, newStep: Step): Promise<void> {
  await pool.query(
    "UPDATE users SET current_step = $1, updated_at = NOW() WHERE id = $2",
    [newStep, userId],
  );
}

export function setStepCookie(res: import("express").Response, step: Step): void {
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("reg_step", step, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 30 * 60 * 1000,
    path: "/",
  });
}