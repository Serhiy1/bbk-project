import express, { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";

import {
  MethodNotAllowedError,
  NotFoundError,
  NotImplimentedError,
  ServerError,
  UserInputError,
} from "../errors/errors";
import { AuthRequired } from "../middleware/authentication";
import { Event } from "../models/database/event";
import { Project, ProjectDocument } from "../models/database/project";
import { Tenancy, TenancyDocument } from "../models/database/tenancy";
import { collaboratorsResponse } from "../models/types/collaborators";
import {
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

export const ProjectEventRouter = express.Router();

ProjectEventRouter.post(
  "",
  AuthRequired,
  validate(createProject),
  async (req: Request<never, ProjectResponse, ProjectRequest>, res: Response<ProjectResponse>, next: NextFunction) => {
    try {
      const token = DecodeTokenFromHeader(req);
      const tenancy = await Tenancy.findById(token.tenancyId);

      if (tenancy === null) {
        return next(new ServerError("Tenancy is Not found"));
      }
      const project = await Project.NewProjectFromRequest(req.body, tenancy);
      res.status(201).send(await project.ToProjectResponse());
    } catch (error) {
      return next(error as Error);
    }
  }
);

ProjectEventRouter.get(
  "",
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
      return next(error as Error);
    }
  }
);

ProjectEventRouter.get(
  "/:projectId",
  AuthRequired,
  validate(projectIDParam),
  async (req: Request<projectId>, res: Response<ProjectResponse>, next: NextFunction) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [project, _] = await FetchProjectFromRequestSafe(req, { ignoreActive: true });
      res.status(200).send(await project.ToProjectResponse());
    } catch (error) {
      return next(error as Error);
    }
  }
);

ProjectEventRouter.patch(
  "/:projectId",
  AuthRequired,
  validate(projectIDParam),
  validate(updateProject),
  async (
    req: Request<projectId, ProjectDiffResponse, ProjectDiffRequest>,
    res: Response<ProjectDiffResponse>,
    next: NextFunction
  ) => {
    try {
      const [project, tenancy] = await FetchProjectFromRequestSafe(req, { ignoreActive: true });

      // check if the project is active, if project is not active and the request is not to activate it, return error
      if (!project.IsActive(tenancy) && req.body.projectStatus !== "ACTIVE") {
        return next(new UserInputError("Project is not active or you are no longer an active collaborator"));
      }

      if (!project.IsOwner(tenancy)) {
        return next(new UserInputError("Only the Owner can update the project details"));
      }

      const diff = await project.createDiff(req.body, tenancy);
      res.status(200).send(diff);
    } catch (error) {
      return next(error as Error);
    }
  }
);

// Added routes for events
ProjectEventRouter.get(
  "/:projectId/events",
  AuthRequired,
  validate(projectIDParam),
  async (req: Request<projectId>, res: Response<EventResponse[]>, next: NextFunction) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [project, _] = await FetchProjectFromRequestSafe(req, { ignoreActive: true });
      const events = await project.ListAllEvents();
      res.status(200).send(events);
    } catch (error) {
      return next(error as Error);
    }
  }
);

ProjectEventRouter.post(
  "/:projectId/events",
  AuthRequired,
  validate(projectIDParam),
  validate(createEvent),
  async (req: Request<projectId, EventResponse, EventRequest>, res: Response<EventResponse>, next: NextFunction) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [project, tenant] = await FetchProjectFromRequestSafe(req);
      const event = await Event.NewEventFromRequest(req.body, project, tenant);

      return res.status(201).send(await event.ToEventResponse());
    } catch (error) {
      return next(error as Error);
    }
  }
);

// Add 405 error for deleting projects
ProjectEventRouter.delete(
  "/:projectId",
  AuthRequired,
  validate(projectIDParam),
  (req: Request<projectId>, res: Response, next: NextFunction) =>
    next(new MethodNotAllowedError("Deleting a project Not allowed"))
);

// Add 405 error for deleting events
ProjectEventRouter.delete(
  "/:projectId/events/:eventId",
  AuthRequired,
  validate(projectIDParam),
  validate(eventIDParam),
  (req: Request<{ projectId: string; eventId: string }>, res: Response, next: NextFunction) =>
    next(new MethodNotAllowedError("Deleting an event Not allowed"))
);

ProjectEventRouter.get(
  "/:projectId/events/:eventId",
  AuthRequired,
  validate(projectIDParam),
  validate(eventIDParam),
  async (req: Request<{ projectId: string; eventId: string }>, res: Response<EventResponse>, next: NextFunction) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [project, _] = await FetchProjectFromRequestSafe(req, { ignoreActive: true });
      const event = await Event.findById(req.params.eventId);

      if (event === null) {
        return next(new NotFoundError("Event not found"));
      }

      if (await event.IsPartOfProject(project)) {
        return res.status(200).send(await event.ToEventResponse());
      } else {
        return next(new NotFoundError("Event not found"));
      }
    } catch (error) {
      next(error);
    }
  }
);

// Added routes for collaborators
ProjectEventRouter.get(
  "/:projectID/Collaborators",
  AuthRequired,
  (req: Request<projectId>, res: Response<collaboratorsResponse[]>, next) => {
    next(new NotImplimentedError("Viewing current collaborators for project is not implemented"));
  }
);

type safeFetchOpts = {
  ignoreActive: boolean;
};

async function FetchProjectFromRequestSafe(
  req: Request,
  opts: safeFetchOpts = { ignoreActive: false }
): Promise<[ProjectDocument, TenancyDocument]> {
  const token = DecodeTokenFromHeader(req);
  const tenancy = await Tenancy.findById(token.tenancyId);

  if (tenancy === null) {
    throw new ServerError("Tenancy is Not found");
  }

  const project = await Project.FindByProjectId(new mongoose.Types.ObjectId(req.params.projectId), tenancy);
  if (project === null) {
    throw new NotFoundError("Project not found");
  }

  if (!project.IsActive(tenancy) && !opts.ignoreActive) {
    throw new UserInputError("Project is not active or you are no longer an active collaborator");
  }

  return [project, tenancy];
}
