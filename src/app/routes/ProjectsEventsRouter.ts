import express, { Request, Response } from "express";

import {
  CollaboratorsResponse,
  EventRequest,
  EventResponse,
  ProjectDiffRequest,
  ProjectDiffResponse,
  projectId,
  ProjectRequest,
  ProjectResponse,
} from "../models/types/projects";

export const ProjectRouter = express.Router();

ProjectRouter.get("/Projects", (req: Request<never>, res: Response<[ProjectResponse]>) => {
  console.log("Fetching all projects");
  res.status(200).send();
});

ProjectRouter.post(
  "/Projects",
  (req: Request<never, ProjectResponse, ProjectRequest>, res: Response<ProjectResponse>) => {
    console.log("Creating a project");
    res.status(201).send();
  }
);

ProjectRouter.get("/Projects/:projectId", (req: Request<projectId>, res: Response<ProjectResponse>) => {
  console.log("Fetching project with ID:", req.params.projectId);
  res.status(200).send();
});

ProjectRouter.patch(
  "/Projects/:projectId",
  (req: Request<projectId, ProjectDiffResponse, ProjectDiffRequest>, res: Response<ProjectDiffResponse>) => {
    console.log("Updating project with ID:", req.params.projectId);
    res.status(200).send();
  }
);

// Added routes for collaborators
ProjectRouter.get(
  "/projects/:projectID/Collaborators",
  (req: Request<projectId>, res: Response<CollaboratorsResponse[]>) => {
    console.log("Viewing current collaborators for project ID:", req.params.projectId);
    res.status(200).send();
  }
);

ProjectRouter.post(
  "/projects/:projectID/Collaborators",
  (req: Request<projectId, undefined, { collaborator: string }>, res: Response) => {
    console.log("Adding a collaborator to project ID:", req.params.projectId);
    res.status(201).send();
  }
);

ProjectRouter.delete(
  "/projects/:projectID/Collaborators/:collaboratorTenantId",
  (req: Request<{ projectId: string; collaboratorTenantId: string }>, res: Response) => {
    console.log("Removing a collaborator from project ID:", req.params.projectId);
    res.status(200).send();
  }
);

// Added routes for events
ProjectRouter.get("/Projects/:projectId/events", (req: Request<projectId>, res: Response<EventResponse[]>) => {
  console.log("Viewing all events for project ID:", req.params.projectId);
  res.status(200).send();
});

ProjectRouter.post(
  "/Projects/:projectId/events",
  (req: Request<projectId, EventResponse, EventRequest>, res: Response<EventResponse>) => {
    console.log("Creating an event for project ID:", req.params.projectId);
    res.status(201).send();
  }
);

ProjectRouter.get(
  "/Projects/:projectId/events/:eventId",
  (req: Request<{ projectId: string; eventId: string }>, res: Response<EventResponse>) => {
    console.log("Viewing single event with ID:", req.params.eventId, "for project ID:", req.params.projectId);
    res.status(200).send();
  }
);
