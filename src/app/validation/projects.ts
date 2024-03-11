import { body, param } from "express-validator";
import mongoose from "mongoose";

import { UserInputError } from "../errors/errors";

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
    .custom((value) => {
      return mongoose.Types.ObjectId.isValid(value);
    }),
];

export const updateProject = [
  body("projectName", "Project Name is required").optional().trim().escape(),
  body("projectDescription", "Project Description is required").optional().trim().escape(),
  body("projectStatus", "Needs to ACTIVE or INACTIVE").optional().isIn(["ACTIVE", "INACTIVE"]).trim().escape(),
  // collaborators is an array of valld mongoose objectIds
  // check with mongoose.Types.ObjectId.isValid(value)
  body("collaborators", "Collaborators should be an array of valid objectIds")
    .optional()
    .isArray()
    .custom((value) => {
      for (const id of value) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          throw new UserInputError("Collaborators should be an array of valid objectIds");
        }
      }
      return true;
    }),

  body("customMetaData", "Custom Meta should be a string to string map")
    .optional()
    .isObject()
    .custom((value) => {
      for (const key in value) {
        // if key or value is not a string, throw an error
        if (typeof value[key] !== "string" || typeof key !== "string") {
          throw new UserInputError("Custom Meta should be a string to string map");
        }
      }
      return true;
    }),
];
