import { Router } from "express";
import { sendOTP, verifyOTP } from "./auth.controller.js";

const router = Router();

// Onboarding & Identity routes
router.post("/auth/send-otp", sendOTP);
router.post("/auth/verify-otp", verifyOTP);

export default router;
