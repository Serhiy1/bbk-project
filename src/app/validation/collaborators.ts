import { body, param } from "express-validator";
import mongoose from "mongoose";

export const AddCollaborator = [
  body("tenantID")
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("tenantID must be a valid ID"),
  body("friendlyName").not().isEmpty().trim().escape().withMessage("Friendly Name is required"),
];

export const collaberatorIDParam = [
  param("collaberatorID")
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Collaborator must be a valid ID"),
];
