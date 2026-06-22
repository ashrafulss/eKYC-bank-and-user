import type { Express, Request, Response } from "express";
import authRoutes from "../modules/customer/auth/auth.routes.js";
import nidRoutes from "../modules/customer/nid-verifications/nid.routes.js";
import selfieRoutes from "../modules/customer/selfie/selfie.routes.js";

const initiateRoutes = (app: Express): void => {
  const apiV1Initials = "/api/v1";

  app.use(apiV1Initials, authRoutes);
  app.use(apiV1Initials, nidRoutes);
  app.use(apiV1Initials, selfieRoutes);


  app.get(`${apiV1Initials}/health-check`, (req: Request, res: Response) => {
    res.status(200).send("Server is running...............");
  });
};

export default initiateRoutes;
