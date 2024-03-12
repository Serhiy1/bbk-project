// mongoose project schema

import mongoose, { HydratedDocument, Model, model, Schema } from "mongoose";

import { ServerError } from "../../errors/errors";
import {
  EventResponse,
  ProjectCollaborator,
  ProjectDiffRequest,
  ProjectDiffResponse,
  ProjectRequest,
  ProjectResponse,
} from "../types/projects";
import { Event } from "./event";
import { Tenancy, TenancyDocument } from "./tenancy";

// declare initialisation arguments
interface IProjectArgs {
  projectName: string;
  startedDate: Date;
  customMetaData: { [key: string]: string };
  projectDescription: string;
  projectStatus: "ACTIVE" | "INACTIVE";
  events: mongoose.Types.ObjectId[];
  OwnerTenancy: mongoose.Types.ObjectId;
  colaboratorTenancy: mongoose.Types.ObjectId;
  diffs: ProjectDiffResponse[];
  collaborators: mongoose.Types.ObjectId[];
}

// Declare the attributes of the model
interface IProject extends IProjectArgs {
  _id: mongoose.Types.ObjectId;
  ProjectId: mongoose.Types.ObjectId;
}

// Declare the methods of the model
interface IProjectMethods {
  ListallEvents: () => Promise<EventResponse[]>;
  ToProjectResponse: () => Promise<ProjectResponse>;
  ListProjectCollaborators: () => Promise<ProjectCollaborator[]>;
  IsOwner: (tenancy: TenancyDocument) => boolean;
  createDiff: (updateRequest: ProjectDiffRequest, tenancy: TenancyDocument) => Promise<ProjectDiffResponse>;
  applyDiff: (diff: ProjectDiffRequest, tenancy: TenancyDocument) => Promise<void>;
  CreateCopiesForCollaborators: (collaborators: mongoose.Types.ObjectId[]) => Promise<void>;
  IsActive: (collaborator: TenancyDocument) => boolean;
}

// Declare the Query helper
interface IProjectQueryHelpers {
  // Keep Empty for now https://mongoosejs.com/docs/typescript/query-helpers.html
}

export type ProjectDocument = HydratedDocument<IProject, IProjectMethods>;

// Declare the full model along with any static methods
interface IProjectModel extends Model<IProject, IProjectQueryHelpers, IProjectMethods> {
  NewProjectFromRequest: (projectInfo: ProjectRequest, tenancy: TenancyDocument) => Promise<ProjectDocument>;
  FindByProjectId: (projectId: mongoose.Types.ObjectId, tenancy: TenancyDocument) => Promise<ProjectDocument | null>;
  CreateCopyForCollaborator: (project: ProjectDocument, collaborator: TenancyDocument) => Promise<ProjectDocument>;
}

const ProjectSchema = new Schema<IProject, IProjectModel, IProjectMethods, IProjectQueryHelpers>({
  // Internal ID
  _id: { type: Schema.Types.ObjectId, required: true },
  // ID visible to the User
  ProjectId: { type: Schema.Types.ObjectId, required: true },
  OwnerTenancy: { type: Schema.Types.ObjectId, ref: "Tenancy", required: true },
  colaboratorTenancy: { type: Schema.Types.ObjectId, ref: "Tenancy" },
  projectName: { type: String, required: true },
  startedDate: { type: Date, required: true },
  customMetaData: { type: Map, of: String },
  projectDescription: { type: String, required: true },
  projectStatus: { type: String, required: true },
  events: [{ type: Schema.Types.ObjectId, ref: "Event" }],
  diffs: [{ type: Schema.Types.Mixed, required: true }],
  collaborators: [{ type: Schema.Types.ObjectId, ref: "diffCollaborators" }],
});

ProjectSchema.static(
  "NewProjectFromRequest",
  async function NewProjectFromRequest(
    projectInfo: ProjectRequest,
    tenancy: TenancyDocument
  ): Promise<ProjectDocument> {
    const customMetaData = (projectInfo?.customMetaData as { [key: string]: string }) || {};
    const collaborators = projectInfo.collaborators?.map((id) => new mongoose.Types.ObjectId(id)) || [];

    const projectObj: IProject = {
      _id: new mongoose.Types.ObjectId(),
      ProjectId: new mongoose.Types.ObjectId(),
      projectName: projectInfo.projectName,
      startedDate: new Date(),
      customMetaData: customMetaData,
      projectDescription: projectInfo.projectDescription,
      projectStatus: "ACTIVE",
      events: [],
      OwnerTenancy: tenancy._id,
      colaboratorTenancy: tenancy._id,
      diffs: [],

      // technically the owner shares the project with themselves, makes it easier to apply diffs and push events
      collaborators: [tenancy._id, ...collaborators],
    };

    const project = await this.create(projectObj);
    // add project to owner's project list
    tenancy.projects.push(project.ProjectId);
    const ownerSave = tenancy.save();
    const copyPromises = project.CreateCopiesForCollaborators(collaborators);

    await Promise.all([ownerSave, copyPromises]);

    return project;
  }
);

ProjectSchema.static(
  "CreateCopyForCollaborator",
  async function CreateCopyForCollaborator(
    project: ProjectDocument,
    collaborator: TenancyDocument
  ): Promise<ProjectDocument> {
    // Collaborator should see the latest version of the project but its history or previous
    // Events

    const projectObj: IProject = {
      _id: new mongoose.Types.ObjectId(),
      ProjectId: project.ProjectId,
      projectName: project.projectName,
      startedDate: project.startedDate,
      customMetaData: project.customMetaData,
      projectDescription: project.projectDescription,
      projectStatus: project.projectStatus,
      events: [],
      OwnerTenancy: project.OwnerTenancy,
      colaboratorTenancy: collaborator._id,
      diffs: [],
      collaborators: project.collaborators,
    };

    // push the project to the collaborator's project list
    collaborator.projects.push(projectObj.ProjectId);

    const collaberatorProject = await this.create(projectObj);
    Promise.all([collaberatorProject.save(), collaborator.save()]);
    return collaberatorProject;
  }
);

ProjectSchema.static(
  "FindByProjectId",
  async function FindByProjectId(
    projectId: mongoose.Types.ObjectId,
    tenancy: TenancyDocument
  ): Promise<ProjectDocument | null> {
    //  Find a project with the same project ID and collaborator tenancy
    const project = await this.findOne({ ProjectId: projectId, colaboratorTenancy: tenancy._id });
    return project;
  }
);

ProjectSchema.method("ListallEvents", async function ListallEvents(): Promise<EventResponse[]> {
  const eventIds = this.events;
  const events = await Event.find({ _id: { $in: eventIds } });
  const eventResp = events.map(async (event) => await event.ToEventResponse());
  return Promise.all(eventResp);
});

ProjectSchema.method("ToProjectResponse", async function ToProjectResponse(): Promise<ProjectResponse> {
  const obj: ProjectResponse = {
    projectId: this.ProjectId.toString(),
    projectName: this.projectName,
    startedDate: this.startedDate.toString(),
    customMetaData: this.customMetaData,
    projectDescription: this.projectDescription,
    projectStatus: this.projectStatus,
    ProjectCollaborators: await this.ListProjectCollaborators(),
  };
  return obj;
});

ProjectSchema.method("ListProjectCollaborators", async function ListProjectCollaborators(): Promise<
  ProjectCollaborator[]
> {
  // Filter out owner from the collaborators
  const collaborators = this.collaborators.filter((id) => !id.equals(this.OwnerTenancy));

  // Map each collaborator ID to a promise of fetching the collaborator
  const collaboratorPromises = collaborators.map((collaboratorID) => Tenancy.findById(collaboratorID));

  // Wait for all fetches to complete
  const fetchedCollaborators = await Promise.all(collaboratorPromises);

  // Filter out any null results and transform to ProjectCollaborator response
  const ProjectCollaborators = fetchedCollaborators
    .filter((collaborator) => collaborator !== null)
    .map((collaborator) => (collaborator as TenancyDocument).toProjectCollaboratorResponse());

  return ProjectCollaborators;
});

ProjectSchema.method("IsOwner", function IsOwner(tenancy: TenancyDocument): boolean {
  return this.OwnerTenancy.equals(tenancy._id);
});

ProjectSchema.method(
  "createDiff",
  async function createDiff(updateRequest: ProjectDiffRequest, tenancy: TenancyDocument): Promise<ProjectDiffResponse> {
    const diff: ProjectDiffResponse = {};

    if (updateRequest.projectName) {
      diff.projectName = {
        old: this.projectName,
        new: updateRequest.projectName,
      };
    }

    if (updateRequest.projectDescription) {
      diff.projectDescription = {
        old: this.projectDescription,
        new: updateRequest.projectDescription,
      };
    }

    if (updateRequest.projectStatus) {
      diff.projectStatus = {
        old: this.projectStatus,
        new: updateRequest.projectStatus,
      };
    }

    if (updateRequest.customMetaData) {
      diff.customMetaData = {
        old: this.customMetaData,
        new: updateRequest.customMetaData,
      };
    }

    if (updateRequest.collaborators) {
      diff.ProjectCollaborators = {
        old: this.collaborators.map((id) => id.toString()),
        new: updateRequest.collaborators,
      };
    }

    await this.applyDiff(updateRequest, tenancy);

    return diff;
  }
);

ProjectSchema.method(
  "CreateCopiesForCollaborators",
  async function CreateCopiesForCollaborators(collaborators: mongoose.Types.ObjectId[]) {
    // Create a copy of the project for each new collaborator, while also checking
    const ProjectCopyPromises = collaborators.map(async (tenancyId) => {
      const tenancy = await Tenancy.findById(tenancyId);

      if (tenancy === null) {
        throw new ServerError(`Tenancy ${tenancyId} not found`);
      }

      return await Project.CreateCopyForCollaborator(this, tenancy);
    });

    await Promise.all(ProjectCopyPromises);
  }
);

ProjectSchema.method("applyDiff", async function applyDiff(diff: ProjectDiffRequest, tenancy: TenancyDocument) {
  // 1. Newly added collaborators should see the diff in which they were added
  // 2. Removed collaborators should see the diff in which they were removed
  // 3. The owner must always be in the collaborators list

  const diffCollaborators = diff.collaborators?.map((id) => new mongoose.Types.ObjectId(id)) || [];

  // The new collaborators value that will be set
  const Collaborators = [...new Set([this.OwnerTenancy, ...diffCollaborators])];

  // Get the new collaborators that were added and create a copy of the project for them
  const newCollaborators = diffCollaborators.filter((id) => !this.collaborators.includes(id));
  await tenancy.CheckCollaboratorsAreActive(newCollaborators);
  await this.CreateCopiesForCollaborators(newCollaborators);

  // get the sum current + removed + owner and remove duplicates, and apply the diff to each
  const UpdateCollaborators = [...new Set([...this.collaborators, ...diffCollaborators, this.OwnerTenancy])];

  const updatePromises = UpdateCollaborators.map(async (tenancyId) => {
    const tenancy = await Tenancy.findById(tenancyId);
    if (tenancy === null) {
      return;
    }

    const project = await Project.FindByProjectId(this.ProjectId, tenancy);
    if (project === null) {
      return;
    }

    if (diff.projectName) {
      project.projectName = diff.projectName;
    }

    if (diff.projectDescription) {
      project.projectDescription = diff.projectDescription;
    }

    if (diff.projectStatus) {
      project.projectStatus = diff.projectStatus;
    }

    if (diff.customMetaData) {
      project.customMetaData = diff.customMetaData as { [key: string]: string };
    }

    if (diff.collaborators) {
      project.collaborators = Collaborators;
    }

    return await project.save();
  });

  await Promise.all(updatePromises);
});

ProjectSchema.method("IsActive", function IsActive(collaborator: TenancyDocument): boolean {
  // status should be active and collaborator should be in project
  return this.projectStatus === "ACTIVE" && this.collaborators.includes(collaborator._id);
});

export const Project = model<IProject, IProjectModel>("Project", ProjectSchema);
