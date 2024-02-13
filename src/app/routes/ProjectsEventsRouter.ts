import express, { Request, Response } from "express";

import { NotImplimentedError } from "../errors/errors";
import { AuthRequired } from "../middleware/authentication";
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
import { createEvent, eventIDParam } from "../validation/events";
import { createProject, projectIDParam, updateProject } from "../validation/projects";
import { validate } from "../validation/validate";

export const ProjectRouter = express.Router();

ProjectRouter.get("/Projects", AuthRequired, (req: Request<never>, res: Response<[ProjectResponse]>) => {
  console.log("Fetching all projects");
  res.status(200).send();
});

ProjectRouter.post(
  "/Projects",
  AuthRequired,
  validate(createProject()),
  (req: Request<never, ProjectResponse, ProjectRequest>, res: Response<ProjectResponse>) => {
    console.log("Creating a project");
    res.status(201).send();
  }
);

ProjectRouter.get(
  "/Projects/:projectId",
  AuthRequired,
  validate(projectIDParam()),
  (req: Request<projectId>, res: Response<ProjectResponse>) => {
    console.log("Fetching project with ID:", req.params.projectId);
    res.status(200).send();
  }
);

ProjectRouter.patch(
  "/Projects/:projectId",
  AuthRequired,
  validate(projectIDParam()),
  validate(updateProject()),
  (req: Request<projectId, ProjectDiffResponse, ProjectDiffRequest>, res: Response<ProjectDiffResponse>) => {
    console.log("Updating project with ID:", req.params.projectId);
    res.status(200).send();
  }
);

// Added routes for events
ProjectRouter.get(
  "/Projects/:projectId/events",
  AuthRequired,
  validate(projectIDParam()),
  (req: Request<projectId>, res: Response<EventResponse[]>) => {
    console.log("Viewing all events for project ID:", req.params.projectId);
    res.status(200).send();
  }
);

ProjectRouter.post(
  "/Projects/:projectId/events",
  AuthRequired,
  validate(projectIDParam()),
  (req: Request<projectId, EventResponse, EventRequest>, res: Response<EventResponse>) => {
    console.log("Creating an event for project ID:", req.params.projectId);
    res.status(201).send();
  }
);

ProjectRouter.get(
  "/Projects/:projectId/events/:eventId",
  AuthRequired,
  validate(projectIDParam()),
  validate(eventIDParam()),
  validate(createEvent()),
  (req: Request<{ projectId: string; eventId: string }>, res: Response<EventResponse>) => {
    console.log("Viewing single event with ID:", req.params.eventId, "for project ID:", req.params.projectId);
    res.status(200).send();
  }
);

// Added routes for collaborators
ProjectRouter.get(
  "/projects/:projectID/Collaborators",
  AuthRequired,
  (req: Request<projectId>, res: Response<CollaboratorsResponse[]>, next) => {
    next(new NotImplimentedError("Viewing current collaborators for project is not implemented"));
  }
);

ProjectRouter.post(
  "/projects/:projectID/Collaborators",
  AuthRequired,
  validate(projectIDParam()),
  (req: Request<projectId, undefined, { collaborator: string }>, res: Response, next) => {
    next(new NotImplimentedError("adding collaborators to a project is not implemented"));
  }
);

ProjectRouter.delete(
  "/projects/:projectID/Collaborators/:collaboratorTenantId",
  AuthRequired,
  validate(projectIDParam()),
  (req: Request<{ projectId: string; collaboratorTenantId: string }>, res: Response, next) => {
    next(new NotImplimentedError("removing collaborators to a project is not implemented"));
  }
);
