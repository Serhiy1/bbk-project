import type { ErrorRequestHandler } from "express";
import express from "express";

import { HttpError,NotFoundError } from "./errors/errors";



export const app = express();

// handle requests for all unknown routes
app.use((req, res, next) => {
    const error = new NotFoundError(`unknown path ${req.path}`);
    next(error);
  });
  
  
// generic error handler
const errorHandler: ErrorRequestHandler = (err: HttpError, req, res) => {
    res.statusCode = err.statuscode;
    res.json({
      message: err.message,
    });
  };
  
app.use(errorHandler);
