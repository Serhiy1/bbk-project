import { body } from "express-validator";

export const signup = [
  body("email", "Invalid email format").isEmail().normalizeEmail(),
  body(
    "password",
    "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)."
  ).isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 }),
  body("username", "Username is required").not().isEmpty().trim().escape(),
];

export const login = [
  body("email", "Invalid email format").isEmail().normalizeEmail(),
  body("password", "Password is required").not().isEmpty(),
];
