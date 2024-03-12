import { param } from "express-validator";

export const AppIDparam = [param("appID", "A valid application ID is required").notEmpty().isUUID()];
