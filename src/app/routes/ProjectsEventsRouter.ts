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
      const session = await mongoose.startSession();
      const token = DecodeTokenFromHeader(req);
      const tenancy = await Tenancy.findById(token.tenancyId);

      if (tenancy === null) {
        return next(new ServerError("Tenancy is Not found"));
      }

      const project = await Project.NewProjectFromRequest(req.body, tenancy._id);
      tenancy.projects.push(project._id);
      session.startTransaction();
      Promise.all([project.save(), tenancy.save()]);
      await session.commitTransaction();
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [project, _] = await FetchProjectFromRequestSafe(req, { ignoreActive: true });

      // check if the project is active, if project is not active and the request is not to activate it, return error
      if (!project.IsActive() && req.body.projectStatus !== "ACTIVE") {
        return next(new UserInputError("Project is not active"));
      }

      const diff = project.applyDiff(req.body);
      await project.save();
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
      const events = await project.ListallEvents();
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
      const session = await mongoose.startSession();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [project, _] = await FetchProjectFromRequestSafe(req);
      const event = await Event.NewEventFromRequest(req.body, project._id);
      project.events.push(event._id);

      session.startTransaction();
      Promise.all([event.save(), project.save()]);
      await session.commitTransaction();

      return res.status(201).send(event.ToEventResponse());
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
      const [project, _] = await FetchProjectFromRequestSafe(req);
      const event = await Event.findById(req.params.eventId);
      if (event === null) {
        return next(new NotFoundError("Event not found"));
      }
      if (event.IspartOfProject(project._id)) {
        return res.status(200).send(event.ToEventResponse());
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

  const presentInTenancy = await tenancy.AssertProjectInTenancy(new mongoose.Types.ObjectId(req.params.projectId));
  if (!presentInTenancy) {
    throw new NotFoundError("Project not found");
  }

  const project = await Project.findById(req.params.projectId);
  if (project === null) {
    throw new ServerError("Project Reference Found in tenancy record but not found in the project collection");
  }

  if (!project.IsActive() && !opts.ignoreActive) {
    throw new UserInputError("Project is not active");
  }

  return [project, tenancy];
}
