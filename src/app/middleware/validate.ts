import { NextFunction, Request, Response } from "express";
import { ValidationChain, validationResult } from "express-validator";

import { UserInputError } from "../errors/errors";

export function validate(validations: ValidationChain[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    return next(
      new UserInputError(
        errors
          .formatWith((error) => error.msg)
          .array()
          .join("\n")
      )
    );
  };
}
