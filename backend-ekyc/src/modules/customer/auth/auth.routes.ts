import { Router } from "express";
import { refreshToken, sendOTP, verifyOTP } from "./auth.controller.js";

const router = Router();

// Onboarding & Identity routes
router.post("/auth/send-otp", sendOTP);
router.post("/auth/verify-otp", verifyOTP);
router.post("/auth/refresh", refreshToken);

export default router;
