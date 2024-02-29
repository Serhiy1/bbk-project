import bcrypt from "bcrypt";
import express, { NextFunction, Request, Response } from "express";

import { NotFoundError, ResourceInUseError, ServerError, UnAuthenticatedError } from "../errors/errors";
import { AuthRequired } from "../middleware/authentication";
import { Tenancy } from "../models/database/tenancy";
import { User } from "../models/database/user";
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
    try {
      const email = req.body.email;
      const companyName = req.body.companyName;
      const password = req.body.password;

      if (await User.AlreadyExists(email)) {
        return next(new ResourceInUseError("Email already in use"));
      }

      const passwordHash = bcrypt.hashSync(password, 10);
      const tenancy = await Tenancy.NewTenancy(companyName);
      const user = await User.NewUser({ email, passwordHash, tenancyId: tenancy._id });

      await tenancy.save();
      await user.save();

      const token = NewToken(user.toTokenInfo());
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

      const token = NewToken(existingUser.toTokenInfo());

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
      const user = await User.findById(decodedInfo.UserId);

      if (user == null) {
        next(new NotFoundError("user not found"));
      } else {
        res.status(200).send(user.toUserResponse());
      }
    } catch (error) {
      next(new ServerError((error as Error).message));
    }
  }
);
