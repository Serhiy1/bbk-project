import bcrypt from "bcrypt";
import express, { Request, Response } from "express";
import mongoose from "mongoose";
import * as AuthenticationValidator from "openapi-validator-middleware";

import { NotFoundError, ResourceInUseError, ServerError, UnAuthenticatedError } from "../errors/errors";
import { AuthRequired, DecodeToken, NewToken } from "../middleware/authentication";
import { newTenancy } from "../models/database/tenancy";
import { newUser, User } from "../models/database/user";
import {
  LoginRequest,
  LoginResponse,
  SignupRequest,
  SignupResponse,
  UserResponse,
} from "../models/types/authentications";

AuthenticationValidator.init("../../../openapi/authentication.yaml");
export const authenticationRouter = express.Router();

authenticationRouter.post(
  "/signup",
  AuthenticationValidator.validate,
  async (req: Request<never, SignupResponse, SignupRequest>, res: Response<LoginResponse>, next) => {
    try {
      const email = req.body.email;
      const userName = req.body.username;
      const password = req.body.password;

      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return next(new ResourceInUseError("Email already in use"));
      }

      const passwordHash = bcrypt.hashSync(password, 10);

      const tenancy = newTenancy({
        _id: new mongoose.Types.ObjectId(),
      });

      tenancy.save();

      const user = newUser({
        _id: new mongoose.Types.ObjectId(),
        email: email,
        userName: userName,
        passwordHash: passwordHash,
        tenancyId: tenancy.id,
      });

      user.save();

      const token = NewToken({ email: email, _id: user.id, userName: userName, tenancyId: user.tenancyId });
      res.status(201).send({ token: token });
    } catch (error) {
      next(new ServerError((error as Error).message));
    }
  }
);

authenticationRouter.post(
  "/login",
  AuthenticationValidator.validate,
  async (req: Request<never, LoginResponse, LoginRequest>, res: Response<LoginResponse>, next) => {
    try {
      const email = req.body.email;
      const password = req.body.password;

      // check if the user exists
      const existingUser = await User.findOne({ email: email });
      if (!existingUser) {
        return next(new NotFoundError("Could not find user email"));
      }

      // If the user exists check if the password has matches
      if (!bcrypt.compareSync(password, existingUser.passwordHash)) {
        return next(new UnAuthenticatedError("Auth Failed - Password does not match"));
      }

      const token = NewToken({
        email: email,
        _id: existingUser.id,
        userName: existingUser.userName,
        tenancyId: existingUser.tenancyId,
      });

      res.status(201).send({ token: token });
    } catch (error) {
      next(new ServerError((error as Error).message));
    }
  }
);

authenticationRouter.get(
  "/whoami",
  AuthenticationValidator.validate,
  AuthRequired,
  async (req: Request<never, UserResponse>, res: Response<UserResponse>, next) => {
    const authHeader = req.headers.authorization as string;
    const token = authHeader.split(" ")[1];

    const decodedInfo = DecodeToken(token);
    if (decodedInfo == null) {
      next(new ServerError("error when decoding JWT"));
    } else {
      res.send({
        email: decodedInfo.email,
        tenantID: decodedInfo.tenancyId.toString(),
        username: decodedInfo.userName,
      });
    }
  }
);
