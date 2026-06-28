import multer from "multer";
import { Router } from "express";
import { confirmSelfieStep, verifyLiveness } from "./selfie.controller.js";
import { userAuth } from "../../../middlewares/auth.middleware.js";
 
const router = Router();

const upload  = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "video/mp4" || file.mimetype === "video/webm") {
      cb(null, true);
    } else {
      cb(new Error("Only mp4/webm video files are allowed."));
    }
  },
});
 
router.post("/auth/verify-liveness", userAuth,upload.single("video"), verifyLiveness);
router.post("/auth/confirm-selfie-step", userAuth, confirmSelfieStep);
 
export default router;