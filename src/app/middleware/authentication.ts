import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { JWTSignKey } from "../../config/config";
import { UnAuthenticatedError } from "../errors/errors";
import { UserTokenInfo } from "../models/database/user";

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

export function NewToken(user: UserTokenInfo) {
  const token = jwt.sign(
    {
      email: user.email,
      username: user.userName,
      id: user._id,
      tenancy: user.tenancyId,
    },
    JWTSignKey,
    { expiresIn: "1 hour" }
  );
  return token;
}

export function DecodeToken(token: string): UserTokenInfo | null {
  try {
    const decoded = jwt.verify(token, JWTSignKey) as UserTokenInfo;

    const userTokenInfo: UserTokenInfo = {
      email: decoded.email,
      userName: decoded.userName,
      _id: decoded._id,
      tenancyId: decoded.tenancyId,
    };

    return userTokenInfo;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null; // or handle the error as you see fit
  }
}
