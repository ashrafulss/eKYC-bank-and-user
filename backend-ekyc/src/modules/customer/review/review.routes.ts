// review.routes.ts
import { Router } from "express";
import { getApplicationReviewSummary, submitApplication } from "./review.controller.js";
import { userAuth } from "../../../middlewares/auth.middleware.js";

const router = Router();
router.get("/review-summary", userAuth, getApplicationReviewSummary);
router.post("/submit", userAuth, submitApplication);

export default router;