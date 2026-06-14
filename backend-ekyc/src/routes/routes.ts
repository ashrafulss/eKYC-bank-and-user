import type { Express, Request, Response } from "express";

const initiateRoutes = (app: Express): void => {
  const apiV1Initials = "/api/v1";

  // Using template literals to safely prefix your health-check endpoint
  app.get(`${apiV1Initials}/health-check`, (req: Request, res: Response) => {
    res.status(200).send("Server is running...............");
  });
};

export default initiateRoutes;
