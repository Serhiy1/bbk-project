import { body, param } from "express-validator";
import mongoose from "mongoose";

export const createEvent = [
  body("eventName", "Event Name is required").not().isEmpty().trim().escape(),
  body("eventType", "Event Type is required").not().isEmpty().trim().escape(),
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
  body("attachments", "Attachments should be an array of AttachmentRequest").optional().isArray(),
];

export const eventIDParam = [
  param("eventId", "A valid event ID is required")
    .not()
    .isEmpty()
    .trim()
    .escape()
    .custom((value) => {
      return mongoose.Types.ObjectId.isValid(value);
    }),
];
