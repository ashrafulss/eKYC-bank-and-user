import { Router } from "express";
import { getBasicInfoProfile } from "./basic-info.controller.js";
import { userAuth } from "../../../middlewares/auth.middleware.js";

const router = Router();


router.get(
  "/basic-info", 
  userAuth,                  
  getBasicInfoProfile        
);

export default router;