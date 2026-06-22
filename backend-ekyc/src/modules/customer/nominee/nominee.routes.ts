import { Router } from "express";
import { saveNominees, verifyNomineeNIDCard } from "./nominee.controller.js";
import { userAuth } from "../../../middlewares/auth.middleware.js";

const router = Router();


router.post("/auth/verify-nominee-nid", userAuth, verifyNomineeNIDCard);

router.post("/auth/verify-nominee", userAuth, saveNominees);

export default router;