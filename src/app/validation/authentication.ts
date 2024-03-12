import { body } from "express-validator";
import mongoose from "mongoose";
import validator from "validator";

export const signup = [
  body("email", "Invalid email format").isEmail(),
  body(
    "password",
    "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)."
  ).isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 }),
  body("companyName", "CompanyName is required").not().isEmpty().trim().escape(),
];

export const login = [
  // email can be either an email or an UUID

  body("email")
    .not()
    .isEmpty()
    .withMessage("Email/UUID is required")
    .custom((value) => {
      // check if its a valid UUID
      if (mongoose.Types.UUID.isValid(value)) {
        return true;
      }
      // if not a valid UUID then check if its a valid email
      if (validator.isEmail(value)) {
        return true;
      }
      // If neither, throw an error
      throw new Error("Invalid email/UUID format");
    }),

  body("password", "Password is required").not().isEmpty(),
];
