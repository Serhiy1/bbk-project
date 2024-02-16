import { body, param } from "express-validator";
import mongoose from "mongoose";

export const createProject = [
  body("projectName", "Project Name is required").not().isEmpty().trim().escape(),
  body("projectDescription", "Project Description is required").not().isEmpty().trim().escape(),
  body("projectStatus", "S").optional().isIn(["ACTIVE", "INACTIVE"]).trim().escape(),
  body("customMetaData", "Custom Meta should be a string to string map")
    .optional()
    .isObject()
    .custom((value) => {
      for (const key in value) {
        // if key or value is not a string, throw an error
        if (typeof value[key] !== "string" || typeof key !== "string") {
          throw new Error("Custom Meta should be a string to string map");
        }
      }
      return true;
    }),
];

export const projectIDParam = [
  param("projectId", "A valid project ID is required")
    .not()
    .isEmpty()
    .trim()
    .escape()
    .custom((value) => {
      return mongoose.Types.ObjectId.isValid(value);
    }),
];

export const updateProject = [
  body("projectName", "Project Name is required").optional().trim().escape(),
  body("projectDescription", "Project Description is required").optional().trim().escape(),
  body("projectStatus", "Needs to ACTIVE or INACTIVE").optional().isIn(["ACTIVE", "INACTIVE"]).trim().escape(),
  body("customMetaData", "Custom Meta should be a string to string map")
    .optional()
    .isObject()
    .custom((value) => {
      for (const key in value) {
        // if key or value is not a string, throw an error
        if (typeof value[key] !== "string" || typeof key !== "string") {
          throw new Error("Custom Meta should be a string to string map");
        }
      }
      return true;
    }),
];
