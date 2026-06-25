import { Router } from "express";
import { confirmSelfieStep, verifySelfie } from "./selfie.controller.js";
import { userAuth } from "../../../middlewares/auth.middleware.js";
 
const router = Router();
 
router.post("/auth/verify-selfie", userAuth, verifySelfie);
router.post("/auth/confirm-selfie-step", userAuth, confirmSelfieStep);
 
export default router;