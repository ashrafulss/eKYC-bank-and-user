import { Router } from "express";
import { uploadNID } from "./nid.controller.js";
import { userAuth } from "../../../middlewares/auth.middleware.js";

const router = Router();

router.post("/auth/verify-nid", userAuth, uploadNID);

export default router;