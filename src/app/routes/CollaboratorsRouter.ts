import express, { Request, Response } from "express";

import { AuthRequired } from "../middleware/authentication";
import { collaboratorsRequest, collaboratorsResponse } from "../models/types/collaborators";

export const collaboratorsRouter = express.Router();

// Viewing all collaborators
collaboratorsRouter.get("/collaborators", AuthRequired, (req: Request, res: Response<collaboratorsResponse[]>) => {
  console.log("Fetching all collaborators");
  res.status(200).send();
});

// Adding a collaborator
collaboratorsRouter.post(
  "/collaborators",
  AuthRequired,
  (req: Request<never, collaboratorsResponse, collaboratorsRequest>, res: Response<collaboratorsResponse>) => {
    console.log("Adding a collaborator");
    res.status(201).send(); // Assuming you'd replace this with actual collaborator addition logic and response
  }
);

// Viewing a single collaborator
collaboratorsRouter.get(
  "/collaborators/:collaboratorTenantUuid",
  AuthRequired,
  (req: Request<{ collaboratorTenantUuid: string }>, res: Response<collaboratorsResponse>) => {
    console.log("Fetching collaborator with UUID:", req.params.collaboratorTenantUuid);
    res.status(200).send();
  }
);

// Removing a collaborator
collaboratorsRouter.delete(
  "/collaborators/:collaboratorTenantUuid",
  AuthRequired,
  (req: Request<{ collaboratorTenantUuid: string }>, res: Response) => {
    console.log("Removing collaborator with UUID:", req.params.collaboratorTenantUuid);
    res.status(200).send();
  }
);
