import { Router } from "express";
import { getBasicInfoProfile, saveBasicInfoProfile } from "./basic-info.controller.js";
import { userAuth } from "../../../middlewares/auth.middleware.js";

const router = Router();


router.get(
  "/basic-info", 
  userAuth,                  
  getBasicInfoProfile        
);

router.put(
  "/basic-info",
  userAuth,
  saveBasicInfoProfile
);

export default router;