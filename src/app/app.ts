import type { ErrorRequestHandler, NextFunction } from "express";
import express, { Request, Response } from "express";
import morgan from "morgan";

import { HttpError, NotFoundError } from "./errors/errors";
import { authenticationRouter } from "./routes/AuthenticationRouter";

export const app = express();

app.use(morgan("dev"));
app.use(express.json());

app.use("/user", authenticationRouter);

// handle requests for all unknown routes
app.use((req, res, next) => {
  const error = new NotFoundError(`unknown path ${req.path}`);
  next(error);
});

// generic error handler
const errorHandler: ErrorRequestHandler = (err: HttpError, req: Request, res: Response, next: NextFunction) => {
  res.statusCode = err.statuscode;
  return res.json({
    message: err.message,
  });
  next();
};

app.use(errorHandler);
