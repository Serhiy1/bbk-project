import express, { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";

import { NotFoundError } from "../errors/errors";
import { Event } from "../models/database/event";
import { Project, ProjectDocument } from "../models/database/project";
import { Tenancy } from "../models/database/tenancy";
import { EventResponse, projectId, ProjectResponse } from "../models/types/projects";
import { eventIDParam } from "../validation/events";
import { projectIDParam } from "../validation/projects";
import { validate } from "../validation/validate";

export const PublicProjectsRouter = express.Router();

PublicProjectsRouter.get("", async (req: Request<never>, res: Response<ProjectResponse[]>, next: NextFunction) => {
  try {
    const publicTenant = await Tenancy.getPublicTenant();
    return res.status(200).send(await publicTenant.ListProjects());
  } catch (error) {
    return next(error as Error);
  }
});

PublicProjectsRouter.get(
  "/:projectId",
  validate(projectIDParam),
  async (req: Request<projectId>, res: Response<ProjectResponse>, next: NextFunction) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const project = await FetchPublicProject(req);
      res.status(200).send(await project.ToProjectResponse());
    } catch (error) {
      return next(error as Error);
    }
  }
);

// Added routes for events
PublicProjectsRouter.get(
  "/:projectId/events",
  validate(projectIDParam),
  async (req: Request<projectId>, res: Response<EventResponse[]>, next: NextFunction) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const project = await FetchPublicProject(req);
      const events = await project.ListAllEvents();
      res.status(200).send(events);
    } catch (error) {
      return next(error as Error);
    }
  }
);

PublicProjectsRouter.get(
  "/:projectId/events/:eventId",
  validate(projectIDParam),
  validate(eventIDParam),
  async (req: Request<{ projectId: string; eventId: string }>, res: Response<EventResponse>, next: NextFunction) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const project = await FetchPublicProject(req);
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

async function FetchPublicProject(
  req: Request,
): Promise<ProjectDocument> {
  const tenancy = await Tenancy.getPublicTenant();
  const project = await Project.FindByProjectId(new mongoose.Types.ObjectId(req.params.projectId), tenancy);

  if (project === null) {
    throw new NotFoundError("Project not found");
  }

  return project;
}
