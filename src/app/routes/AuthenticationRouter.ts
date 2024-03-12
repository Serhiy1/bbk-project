import bcrypt from "bcrypt";
import express, { NextFunction, Request, Response } from "express";

import { NotFoundError, ResourceInUseError, ServerError, UnAuthenticatedError } from "../errors/errors";
import { AuthRequired } from "../middleware/authentication";
import { Application } from "../models/database/application";
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

      // need to decide if the user is an application or a user
      const [existingUser, application] = await Promise.all([User.FindByEmail(email), Application.findByAppId(email)]);

      // if both exist then we have a problem, throw an error
      if (existingUser != null && application != null) {
        return next(new ServerError("Email exists as both a user and an application"));
      }

      const LoginSubject = existingUser || application;

      if (!LoginSubject) {
        return next(new NotFoundError(`Could not find user email ${email}`));
      }

      // If the user exists check if the password has matches
      if (!bcrypt.compareSync(password, LoginSubject.passwordHash)) {
        return next(new UnAuthenticatedError("Auth Failed - Password does not match"));
      }

      const token = NewToken(LoginSubject.toTokenInfo());

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
