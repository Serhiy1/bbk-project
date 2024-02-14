import express, { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";

import { NotFoundError, NotImplimentedError, ServerError } from "../errors/errors";
import { AuthRequired } from "../middleware/authentication";
import { createDiff, ListallEventsOnProject, newProjectFromRequest, Project, updateProjectFromDiff } from "../models/database/project";
import { AssertProjectInTenancy, ListProjectsOnTenancy, Tenancy } from "../models/database/tenancy";
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
        return next(new ServerError("Tenancy for user not found"));
      }

      const newProject = await newProjectFromRequest(req.body, tenancy._id).save();
      await newProject.save();

      const projectResponse: ProjectResponse = newProject.toObject();

      return res.status(201).send(projectResponse);
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
        return next(new ServerError("Tenancy for user not found"));
      }

      const projects = await ListProjectsOnTenancy(tenancy._id);
      return res.status(200).send(projects);
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
      const token = DecodeTokenFromHeader(req);
      const tenancy = await Tenancy.findById(token.tenancyId);

      if (tenancy === null) {
        return next(new ServerError("Tenancy for user not found"));
      }

      const exists = await AssertProjectInTenancy(tenancy._id, new mongoose.Types.ObjectId(req.params.projectId));

      if (!exists) {
        return next(new NotFoundError("Project not found"));
      }

      const project = await Project.findById(req.params.projectId);

      if (project === null) {
        return next(
          new ServerError("Project Reference Found in tenancy record but not found in the project collection")
        );
      }

      const projectResponse: ProjectResponse = project.toObject();

      return res.status(200).send(projectResponse);
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
      const [tenancy, project] = await FetchProjectFromRequestSafe(req);
      
      // Given the try-catch block, if an error is thrown above, the lines below won't execute unless both tenancy and project are valid.
      const diff = createDiff(project, req.body);
      updateProjectFromDiff(project, req.body); // Ensure this function is defined and correctly updates the project.
      project.diffs.push(diff);

      await project.save();

      return res.status(200).send(diff);
      // Create the diff object
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
      const [tenancy, project] = await FetchProjectFromRequestSafe(req);
      
      if (tenancy instanceof Error || project instanceof Error || project === null) {
        return next(tenancy || project);  
      }
      
      const events = await ListallEventsOnProject(project._id);
      return res.status(200).send(events);
      
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
      const [tenancy, project] = await FetchProjectFromRequestSafe(req);
      
  
      if (tenancy instanceof Error || project instanceof Error || project === null) {
        return next(tenancy || project);  
      }
      
  
      
    
      
    } catch (error) {
      return next((error as Error));
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


async function FetchProjectFromRequestSafe(req: Request) : Promise<[typeof Tenancy | null, typeof Project | null]> {
  const token = DecodeTokenFromHeader(req);
  const tenancy = await Tenancy.findById(token.tenancyId);

  if (tenancy === null) {
    throw new ServerError("Tenancy is Not found");
  }

  const exists = await AssertProjectInTenancy(tenancy._id, new mongoose.Types.ObjectId(req.params.projectId));
  if (!exists) {
    throw new NotFoundError("Project not found");
  }

  const project = await Project.findById(req.params.projectId);
  if (project === null) {
    throw new ServerError("Project Reference Found in tenancy record but not found in the project collection");
  }
  
  return [tenancy, project];
}