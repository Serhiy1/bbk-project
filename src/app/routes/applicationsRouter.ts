import express, { NextFunction, Request, Response } from "express";

import { NotFoundError, UnAuthenticatedError } from "../errors/errors";
import { Application } from "../models/database/application";
import { Tenancy } from "../models/database/tenancy";
import { User, UserDocument } from "../models/database/user";
import { ApplicationID, ApplicationResponse } from "../models/types/applications";
import { DecodeTokenFromHeader } from "../utils/token";
import { AppIDparam } from "../validation/applications";
import { validate } from "../validation/validate";

export const ApplicationRouter = express.Router();

ApplicationRouter.get("", async (req: Request<never>, res: Response<ApplicationResponse>, next: NextFunction) => {
  try {
    const user = await FetchUserSafe(req);
    const app = await Application.NewApplication(user);
    res.status(201).send(app.toResponse());
  } catch (error) {
    return next(error as Error);
  }
});

ApplicationRouter.get(
  "/:appID/newSecret",
  validate(AppIDparam),
  async (req: Request<ApplicationID>, res: Response<ApplicationResponse>, next: NextFunction) => {
    try {
      const user = await FetchUserSafe(req);
      const app = await Application.findByAppId(req.params.appID);

      if (app === null) {
        return next(new NotFoundError("Application not found"));
      }

      if (!app.isOwner(user)) {
        return next(new UnAuthenticatedError("You do not own this application, cannot roll its secret"));
      }

      const UpdatedResp = await app.rollSecret();

      res.status(201).send(UpdatedResp);
    } catch (error) {
      return next(error as Error);
    }
  }
);

ApplicationRouter.delete(
  "/:appID",
  validate(AppIDparam),
  async (req: Request<ApplicationID>, res: Response, next: NextFunction) => {
    try {
      const user = await FetchUserSafe(req);
      const app = await Application.findByAppId(req.params.appID);

      if (app === null) {
        return next(new NotFoundError("Application not found"));
      }

      if (!app.isOwner(user)) {
        return next(new UnAuthenticatedError("You do not own this application, cannot roll its secret"));
      }

      app.delete();
      res.status(200).send();
    } catch (error) {
      return next(error as Error);
    }
  }
);

async function FetchUserSafe(req: Request): Promise<UserDocument> {
  const token = DecodeTokenFromHeader(req);
  const tenancy = await Tenancy.findById(token.tenancyId);
  const user = await User.FindByEmail(token.email);

  if (tenancy === null || user === null) {
    throw new UnAuthenticatedError("User or Tenancy not found");
  }

  return user;
}
