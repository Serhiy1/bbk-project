import express, { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";

import { ServerError } from "../errors/errors";
import { AuthRequired } from "../middleware/authentication";
import { Tenancy } from "../models/database/tenancy";
import { collaboratorsRequest, collaboratorsResponse } from "../models/types/collaborators";
import { DecodeTokenFromHeader } from "../utils/token";
import { AddCollaborator, collaberatorIDParam } from "../validation/collaborators";
import { validate } from "../validation/validate";

export const collaboratorsRouter = express.Router();

// Viewing all collaborators
collaboratorsRouter.get(
  "/",
  AuthRequired,
  async (req: Request, res: Response<collaboratorsResponse[]>, next: NextFunction) => {
    try {
      const token = DecodeTokenFromHeader(req);
      const tenancy = await Tenancy.findById(token.tenancyId);

      if (tenancy === null) {
        return next(new ServerError("Tenancy is Not found"));
      }

      const collaberatorResp = await tenancy.listActiveCollaborators();

      return res.status(200).send(collaberatorResp);
    } catch (error) {
      return next(error as Error);
    }
  }
);

// Adding a collaborator
collaboratorsRouter.post(
  "/",
  AuthRequired,
  validate(AddCollaborator),
  async (
    req: Request<never, collaboratorsResponse, collaboratorsRequest>,
    res: Response<collaboratorsResponse>,
    next: NextFunction
  ) => {
    try {
      const token = DecodeTokenFromHeader(req);
      const tenancy = await Tenancy.findById(token.tenancyId);

      if (tenancy === null) {
        return next(new ServerError("Tenancy is Not found"));
      }

      const collaberatorResp = await tenancy.AddCollaborator(req.body);
      res.status(201).send(collaberatorResp);
    } catch (error) {
      return next(error as Error);
    }
  }
);

// open invites
collaboratorsRouter.get(
  "/open",
  AuthRequired,
  async (req: Request, res: Response<collaboratorsResponse[]>, next: NextFunction) => {
    try {
      const token = DecodeTokenFromHeader(req);
      const tenancy = await Tenancy.findById(token.tenancyId);

      if (tenancy === null) {
        return next(new ServerError("Tenancy is Not found"));
      }

      const collaberatorResp = await tenancy.ListOpenInvites();
      res.status(200).send(collaberatorResp);
    } catch (error) {
      return next(error as Error);
    }
  }
);

// pending invites
collaboratorsRouter.get(
  "/pending",
  AuthRequired,
  async (req: Request, res: Response<collaboratorsResponse[]>, next: NextFunction) => {
    try {
      const token = DecodeTokenFromHeader(req);
      const tenancy = await Tenancy.findById(token.tenancyId);

      if (tenancy === null) {
        return next(new ServerError("Tenancy is Not found"));
      }

      const collaberatorResp = await tenancy.ListPendingInvites();
      res.status(200).send(collaberatorResp);
    } catch (error) {
      return next(error as Error);
    }
  }
);

// Viewing a single collaborator
collaboratorsRouter.get(
  "/:collaberatorID",
  AuthRequired,
  validate(collaberatorIDParam),
  async (req: Request<{ collaberatorID: string }>, res: Response<collaboratorsResponse>, next: NextFunction) => {
    try {
      const token = DecodeTokenFromHeader(req);
      const tenancy = await Tenancy.findById(token.tenancyId);

      if (tenancy === null) {
        return next(new ServerError("Tenancy is Not found"));
      }

      const collaberator = await tenancy.findCollaborator(new mongoose.Types.ObjectId(req.params.collaberatorID));
      res.status(200).send(collaberator);
    } catch (error) {
      return next(error as Error);
    }
  }
);

// Removing a collaborator
collaboratorsRouter.delete(
  "/:collaberatorID",
  validate(collaberatorIDParam),

  AuthRequired,
  async (req: Request<{ collaberatorID: string }>, res: Response, next: NextFunction) => {
    try {
      const token = DecodeTokenFromHeader(req);
      const tenancy = await Tenancy.findById(token.tenancyId);

      if (tenancy === null) {
        return next(new ServerError("Tenancy is Not found"));
      }

      await tenancy.removeCollaborator(new mongoose.Types.ObjectId(req.params.collaberatorID));
      res.status(200).send();
    } catch (error) {
      return next(error as Error);
    }
  }
);
