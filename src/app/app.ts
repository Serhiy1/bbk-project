import type { ErrorRequestHandler, NextFunction } from "express";
import express, { Request, Response } from "express";
import morgan from "morgan";

import { HttpError, NotFoundError } from "./errors/errors";
import { authenticationRouter } from "./routes/AuthenticationRouter";
import { ProjectEventRouter } from "./routes/ProjectsEventsRouter";

export const app = express();

app.use(morgan("dev"));
app.use(express.json());

app.use("/user", authenticationRouter);
app.use("/projects", ProjectEventRouter);

// handle requests for all unknown routes
app.use((req, res, next) => {
  const error = new NotFoundError(`unknown path ${req.path}`);
  next(error);
});

// generic error handler
const errorHandler: ErrorRequestHandler = (err: HttpError | Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof HttpError) {
    res.statusCode = err.statuscode;
    return res.json({
      message: err.message,
    });
  } else {
    res.statusCode = 500;
    return res.json({
      message: `Internal Server Error ${err.message}`,
    });
  }
  return next();
};

app.use(errorHandler);
