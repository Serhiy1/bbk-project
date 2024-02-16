import { body, param } from "express-validator";

export const addCollaborator = [
  param("projectID").withMessage("Project ID must be a valid UUID"),
  body("collaborator").withMessage("Collaborator must be a valid UUID"),
];
