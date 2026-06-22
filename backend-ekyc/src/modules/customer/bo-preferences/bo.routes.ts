import { Router } from "express";
import { userAuth } from "../../../middlewares/auth.middleware.js";
import { saveBoPreferences } from "./bo.controller.js";

const router = Router();

router.post("/auth/bo-preferences", userAuth, saveBoPreferences);

export default router;