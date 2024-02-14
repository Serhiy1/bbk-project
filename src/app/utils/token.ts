import { Request } from "express";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";

import { JWTSignKey } from "../../config/config";
import { UserTokenInfo } from "../models/database/user";

type tokenInfo = {
  email: string;
  username: string;
  id: Types.ObjectId;
  tenancy: Types.ObjectId;
};

export function NewToken(user: UserTokenInfo) {
  const info: tokenInfo = {
    email: user.email,
    username: user.userName,
    id: user._id,
    tenancy: user.tenancyId,
  };

  const token = jwt.sign(info, JWTSignKey, { expiresIn: "1 hour" });
  return token;
}

/* Warning This Function assumes that you have used the AuthReequired Middleware */
export function DecodeToken(token: string): UserTokenInfo {
  const decoded = jwt.verify(token, JWTSignKey) as tokenInfo;

  const userTokenInfo: UserTokenInfo = {
    email: decoded.email,
    userName: decoded.username,
    _id: decoded.id,
    tenancyId: decoded.tenancy,
  };

  return userTokenInfo;
}

/* Warning This Function assumes that you have used the AuthReequired Middleware */
export function DecodeTokenFromHeader(req: Request): UserTokenInfo {
  const authHeader = req.headers.authorization as string;
  const token = authHeader.split(" ")[1];
  return DecodeToken(token);
}
