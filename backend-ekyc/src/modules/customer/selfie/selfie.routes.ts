import { Router } from "express";
import { verifySelfie } from "./selfie.controller.js";
import { userAuth } from "../../../middlewares/auth.middleware.js";
 
const router = Router();
 
router.post("/auth/verify-selfie", userAuth, verifySelfie);
 
export default router;