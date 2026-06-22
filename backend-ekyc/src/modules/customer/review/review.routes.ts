// review.routes.ts
import { Router } from "express";
import { getApplicationReviewSummary } from "./review.controller.js";
import { userAuth } from "../../../middlewares/auth.middleware.js";

const router = Router();
router.get("/review-summary", userAuth, getApplicationReviewSummary);

export default router;