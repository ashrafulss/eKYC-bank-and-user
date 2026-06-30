// review.routes.ts
import { Router } from "express";
import { userAuth } from "../../../middlewares/auth.middleware.js";
import {
  getApplicationReviewSummary,
  saveBasicInfoProfile,
  submitApplication,
  updateNominees,
  updateBoAccount,
} from "./review.controller.js";

const router = Router();
router.get("/review-summary", userAuth, getApplicationReviewSummary);
router.post("/submit", userAuth, submitApplication);
router.put("/update-basic-info", userAuth, saveBasicInfoProfile);
router.put("/nominees/update-all", userAuth, updateNominees);
router.put("/bo-account/save", userAuth, updateBoAccount);

export default router;