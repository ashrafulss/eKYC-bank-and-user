import type { Express, Request, Response } from "express";
import authRoutes from "../modules/customer/auth/auth.routes.js";
import nidRoutes from "../modules/customer/nid-verifications/nid.routes.js";
import selfieRoutes from "../modules/customer/selfie/selfie.routes.js";
import nomineeRoutes from "../modules/customer/nominee/nominee.routes.js";
import boRoutes from "../modules/customer/bo-preferences/bo.routes.js";

const initiateRoutes = (app: Express): void => {
  const apiV1Initials = "/api/v1";

  app.use(apiV1Initials, authRoutes);
  app.use(apiV1Initials, nidRoutes);
  app.use(apiV1Initials, selfieRoutes);
  app.use(apiV1Initials, nomineeRoutes);
  app.use(apiV1Initials, boRoutes);


  app.get(`${apiV1Initials}/health-check`, (req: Request, res: Response) => {
    res.status(200).send("Server is running...............");
  });
};

export default initiateRoutes;
