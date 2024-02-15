import { Request } from "express";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import mongoose from "mongoose";

import { JWTSignKey } from "../../config/config";

interface tokenContents {
  email: string;
  username: string;
  id: Types.ObjectId;
  tenancy: Types.ObjectId;
};

export interface UserTokenInfo {
  UserId: mongoose.Types.ObjectId;
  userName: string;
  email: string;
  tenancyId: mongoose.Types.ObjectId;
}


export function NewToken(user: UserTokenInfo) {
  const info: tokenContents = {
    email: user.email,
    username: user.userName,
    id: user.UserId,
    tenancy: user.tenancyId,
  };

  const token = jwt.sign(info, JWTSignKey, { expiresIn: "1 hour" });
  return token;
}

/* Warning This Function assumes that you have used the AuthReequired Middleware */
export function DecodeToken(token: string): UserTokenInfo {
  const decoded = jwt.verify(token, JWTSignKey) as tokenContents;

  const userTokenInfo: UserTokenInfo = {
    email: decoded.email,
    userName: decoded.username,
    UserId: decoded.id,
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
