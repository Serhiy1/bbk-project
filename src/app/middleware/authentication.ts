import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { JWTSignKey } from "../../config/config";
import { UnAuthenticatedError } from "../errors/errors";

export const AuthRequired = (req: Request, res: Response, next: NextFunction) => {
  if (req.headers.authorization === undefined) {
    return next(new UnAuthenticatedError("token is missing"));
  }

  const token = req.headers.authorization.split(" ")[1];

  try {
    jwt.verify(token, JWTSignKey, { complete: true });
  } catch (error) {
    return next(new UnAuthenticatedError((error as Error).message));
  } finally {
    next();
  }
};
