import express, { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";

import { NotFoundError, NotImplimentedError, ServerError } from "../errors/errors";
import { AuthRequired } from "../middleware/authentication";
import { Event } from "../models/database/event";
import { Project, ProjectDocument } from "../models/database/project";
import { Tenancy, TenancyDocument } from "../models/database/tenancy";
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
import { DecodeTokenFromHeader } from "../utils/token";
import { createEvent, eventIDParam } from "../validation/events";
import { createProject, projectIDParam, updateProject } from "../validation/projects";
import { validate } from "../validation/validate";

export const ProjectRouter = express.Router();

ProjectRouter.post(
  "/Projects",
  AuthRequired,
  validate(createProject),
  async (req: Request<never, ProjectResponse, ProjectRequest>, res: Response<ProjectResponse>, next: NextFunction) => {
    try {
      const token = DecodeTokenFromHeader(req);
      const tenancy = await Tenancy.findById(token.tenancyId);

      if (tenancy === null) {
        return next(new ServerError("Tenancy is Not found"));
      }

      const project = await Project.NewProjectFromRequest(req.body, tenancy._id);
      tenancy.projects.push(project._id);
      Promise.all([project.save(), tenancy.save()]);
      res.status(201).send(project.ToProjectResponse());
    } catch (error) {
      return next(new ServerError((error as Error).message));
    }
  }
);

ProjectRouter.get(
  "/Projects",
  AuthRequired,
  async (req: Request<never>, res: Response<ProjectResponse[]>, next: NextFunction) => {
    try {
      const token = DecodeTokenFromHeader(req);
      const tenancy = await Tenancy.findById(token.tenancyId);

      if (tenancy === null) {
        return next(new ServerError("Tenancy is Not found"));
      }

      const projects = await tenancy.ListProjects();
      res.status(200).send(projects);
    } catch (error) {
      return next(new ServerError((error as Error).message));
    }
  }
);

ProjectRouter.get(
  "/Projects/:projectId",
  AuthRequired,
  validate(projectIDParam),
  async (req: Request<projectId>, res: Response<ProjectResponse>, next: NextFunction) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [project, _] = await FetchProjectFromRequestSafe(req);
      res.status(200).send(project.ToProjectResponse());
    } catch (error) {
      return next(new ServerError((error as Error).message));
    }
  }
);

ProjectRouter.patch(
  "/Projects/:projectId",
  AuthRequired,
  validate(projectIDParam),
  validate(updateProject),
  async (
    req: Request<projectId, ProjectDiffResponse, ProjectDiffRequest>,
    res: Response<ProjectDiffResponse>,
    next: NextFunction
  ) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [project, _] = await FetchProjectFromRequestSafe(req);
      const diff = project.createDiffResponse(req.body);
      project.diffs.push(diff);
      await project.save();
      res.status(200).send(diff);
    } catch (error) {
      return next(new ServerError((error as Error).message));
    }
  }
);

// Added routes for events
ProjectRouter.get(
  "/Projects/:projectId/events",
  AuthRequired,
  validate(projectIDParam),
  async (req: Request<projectId>, res: Response<EventResponse[]>, next: NextFunction) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [project, _] = await FetchProjectFromRequestSafe(req);
      const events = await project.ListallEvents();
      res.status(200).send(events);
    } catch (error) {
      return next(new ServerError((error as Error).message));
    }
  }
);

ProjectRouter.post(
  "/Projects/:projectId/events",
  AuthRequired,
  validate(projectIDParam),
  async (req: Request<projectId, EventResponse, EventRequest>, res: Response<EventResponse>, next: NextFunction) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [project, _] = await FetchProjectFromRequestSafe(req);
      const event = await Event.NewEventFromRequest(req.body);
      project.events.push(event._id);
      Promise.all([event.save(), project.save()]);
    } catch (error) {
      return next(error as Error);
    }
  }
);

ProjectRouter.get(
  "/Projects/:projectId/events/:eventId",
  AuthRequired,
  validate([...projectIDParam, ...eventIDParam, ...createEvent]),
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
  validate(projectIDParam),
  (req: Request<projectId, undefined, { collaborator: string }>, res: Response, next) => {
    next(new NotImplimentedError("adding collaborators to a project is not implemented"));
  }
);

ProjectRouter.delete(
  "/projects/:projectID/Collaborators/:collaboratorTenantId",
  AuthRequired,
  validate(projectIDParam),
  (req: Request<{ projectId: string; collaboratorTenantId: string }>, res: Response, next) => {
    next(new NotImplimentedError("removing collaborators to a project is not implemented"));
  }
);

async function FetchProjectFromRequestSafe(req: Request): Promise<[ProjectDocument, TenancyDocument]> {
  const token = DecodeTokenFromHeader(req);
  const tenancy = await Tenancy.findById(token.tenancyId);

  if (tenancy === null) {
    throw new ServerError("Tenancy is Not found");
  }

  const presentInTenancy = await tenancy.AssertProjectInTenancy(new mongoose.Types.ObjectId(req.params.projectId));
  if (!presentInTenancy) {
    throw new NotFoundError("Project not found");
  }

  const project = await Project.findById(req.params.projectId);
  if (project === null) {
    throw new ServerError("Project Reference Found in tenancy record but not found in the project collection");
  }

  return [project, tenancy];
}
