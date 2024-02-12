import { NextFunction, Request, Response } from "express";
import { body } from "express-validator";
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

export const signup = () => [
  body("email", "Invalid email format").isEmail().normalizeEmail(),
  body(
    "password",
    "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)."
  ).isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 }),
  body("username", "Username is required").not().isEmpty().trim().escape(),
];

export const login = () => [
  body("email", "Invalid email format").isEmail().normalizeEmail(),
  body("password", "Password is required").not().isEmpty(),
];
