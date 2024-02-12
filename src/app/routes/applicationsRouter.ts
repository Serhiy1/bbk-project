import express, { Request, Response } from "express";

import { ApplicationID, ApplicationResponse } from "../models/types/applications";

export const ApplicationRouter = express.Router();

ApplicationRouter.get(
  "/app",

  (req: Request<never>, res: Response<ApplicationResponse>) => {
    req.body;

    res.send();
  }
);

ApplicationRouter.get(
  "/app/:appID/newSecret",

  (req: Request<ApplicationID>, res: Response<ApplicationResponse>) => {
    req.params.appID;
    res.send();
  }
);

ApplicationRouter.delete("/app/:appID", (req: Request<ApplicationID>, res: Response) => {
  req.params.appID;
  res.send();
});
