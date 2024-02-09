import express, { Request, Response } from "express";

import { LoginRequest, LoginResponse, SignupRequest, SignupResponse, UserResponse } from "../models/types/authentications";

export const authenticationRouter = express.Router();

authenticationRouter.post(
  "/signup",
  (req: Request<never, SignupResponse, SignupRequest>, res: Response<LoginResponse>) => {
    req.body;

    res.send();
  }
);

authenticationRouter.post("/login", (req: Request<never, LoginResponse, LoginRequest>, res: Response<LoginResponse>) => {
  req.body;

  res.send();
});

authenticationRouter.get("/whoami", (req: Request<never, UserResponse>, res: Response<UserResponse>) => {
  req.body;

  res.send();
});
