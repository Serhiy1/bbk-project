import bcrypt from "bcrypt";
import express, { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";

import { NotFoundError, ResourceInUseError, ServerError, UnAuthenticatedError } from "../errors/errors";
import { AuthRequired } from "../middleware/authentication";
import { newTenancy } from "../models/database/tenancy";
import { newUser, User } from "../models/database/user";
import {
  LoginRequest,
  LoginResponse,
  SignupRequest,
  SignupResponse,
  UserResponse,
} from "../models/types/authentications";
import { DecodeTokenFromHeader, NewToken } from "../utils/token";
import { login, signup } from "../validation/authentication";
import { validate } from "../validation/validate";

export const authenticationRouter = express.Router();

authenticationRouter.post(
  "/signup",
  validate(signup),
  async (req: Request<never, SignupResponse, SignupRequest>, res: Response<SignupResponse>, next: NextFunction) => {
    console.debug(`processing signup request ${req.body}`);
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
        projects: [],
      });

      const user = newUser({
        _id: new mongoose.Types.ObjectId(),
        email: email,
        userName: userName,
        passwordHash: passwordHash,
        tenancyId: tenancy.id,
      });

      await tenancy.save();
      await user.save();

      const token = NewToken({ email: email, _id: user.id, userName: userName, tenancyId: user.tenancyId });
      res.status(201).send({ token: token, tenantID: tenancy.id });
    } catch (error) {
      next(new ServerError((error as Error).message));
    }
  }
);

authenticationRouter.post(
  "/login",
  validate(login),
  async (req: Request<never, LoginResponse, LoginRequest>, res: Response<LoginResponse>, next: NextFunction) => {
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

      res.status(200).send({ token: token });
    } catch (error) {
      next(new ServerError((error as Error).message));
    }
  }
);

authenticationRouter.get(
  "/whoami",
  AuthRequired,
  async (req: Request<never, UserResponse>, res: Response<UserResponse>, next: NextFunction) => {
    try {
      const decodedInfo = DecodeTokenFromHeader(req);
      const user = await User.findOne({ _id: decodedInfo._id });

      if (user == null) {
        next(new NotFoundError("user not found"));
      } else {
        res.status(200).send({
          email: user.email,
          tenantID: `${user.tenancyId}`,
          username: user.userName,
        });
      }
    } catch (error) {
      next(new ServerError((error as Error).message));
    }
  }
);
