import { body, param } from "express-validator";

export const addCollaborator = [
  param("projectID").isUUID().withMessage("Project ID must be a valid UUID"),
  body("collaborator").isUUID().withMessage("Collaborator must be a valid UUID"),
];
