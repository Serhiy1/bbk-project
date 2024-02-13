import { body, param } from "express-validator";

export const createProject = () => [
  body("projectName", "Project Name is required").not().isEmpty().trim().escape(),
  body("projectDescription", "Project Description is required").not().isEmpty().trim().escape(),
  body("projectStatus", "Project Status is required").not().isEmpty().trim().escape(),
  body("customMetaData", "Custom Meta should be a string to string map")
    .optional()
    .isObject()
    .custom((value) => {
      for (const key in value) {
        if (typeof value[key] !== "string") {
          throw new Error("Custom Meta should be a string to string map");
        }
      }
      return true;
    }),
];

export const projectIDParam = () => [
  param("projectId", "Project ID is required").not().isEmpty().isUUID().trim().escape(),
];

export const updateProject = () => [
  body("projectName", "Project Name is required").optional().trim().escape(),
  body("projectDescription", "Project Description is required").optional().trim().escape(),
  body("projectStatus", "Project Status is required").optional().trim().escape(),
  body("customMetaData", "Custom Meta should be a string to string map")
    .optional()
    .isObject()
    .custom((value) => {
      for (const key in value) {
        if (typeof value[key] !== "string") {
          throw new Error("Custom Meta should be a string to string map");
        }
      }
      return true;
    }),
];
