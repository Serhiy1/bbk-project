import express, { Request, Response } from "express";
import * as applicationValidator from "openapi-validator-middleware";

import { ApplicationID, ApplicationResponse } from "../models/types/applications";

applicationValidator.init("../../../openapi/applications.yaml");

export const ApplicationRouter = express.Router();

ApplicationRouter.get(
  "/app",
  applicationValidator.validate,
  (req: Request<never>, res: Response<ApplicationResponse>) => {
    req.body;

    res.send();
  }
);

ApplicationRouter.get(
  "/app/:appID/newSecret",
  applicationValidator.validate,
  (req: Request<ApplicationID>, res: Response<ApplicationResponse>) => {
    req.params.appID;
    res.send();
  }
);

ApplicationRouter.delete("/app/:appID", applicationValidator.validate, (req: Request<ApplicationID>, res: Response) => {
  req.params.appID;
  res.send();
});
