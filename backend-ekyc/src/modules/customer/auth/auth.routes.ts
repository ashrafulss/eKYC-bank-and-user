import { Router } from "express";
import { getMe, logout, refreshToken, sendOTP, verifyOTP } from "./auth.controller.js";
import { userAuth } from "../../../middlewares/auth.middleware.js";

const router = Router();

// Onboarding & Identity routes
router.post("/auth/send-otp", sendOTP);
router.post("/auth/verify-otp", verifyOTP);
router.post("/auth/refresh", refreshToken);
router.post("/auth/logout", logout);
router.get("/auth/me", userAuth, getMe);

export default router;
