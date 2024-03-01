// mongoose project schema

import mongoose, { HydratedDocument, Model, model, Schema } from "mongoose";

import {
  EventResponse,
  Projectcollaborator,
  ProjectDiffRequest,
  ProjectDiffResponse,
  ProjectRequest,
  ProjectResponse,
} from "../types/projects";
import { Event } from "./event";
import { RelationshipManager } from "./relationshipManager";

// declare initialisation arguments
interface IProjectArgs {
  projectName: string;
  startedDate: Date;
  customMetaData: { [key: string]: string };
  projectDescription: string;
  projectStatus: "ACTIVE" | "INACTIVE";
  events: mongoose.Types.ObjectId[];
  Ownertenancy: mongoose.Types.ObjectId;
  diffs: ProjectDiffResponse[];
  collaborators: mongoose.Types.ObjectId[];
}

// Declare the attributes of the model
interface IProject extends IProjectArgs {
  _id: mongoose.Types.ObjectId;
}

// Declare the methods of the model
interface IProjectMethods {
  ListallEvents: () => Promise<EventResponse[]>;
  ToProjectResponse: () => Promise<ProjectResponse>;
  IsPartOfTenancy: (tenancyId: mongoose.Types.ObjectId) => boolean;
  applyDiff: (updateRequest: ProjectDiffRequest) => ProjectDiffResponse;
  ListProjectCollaborators: () => Promise<Projectcollaborator[]>;
  IsActive: () => boolean;
}

// Declare the Query helper
interface IProjectQueryHelpers {
  // Keep Empty for now https://mongoosejs.com/docs/typescript/query-helpers.html
}

export type ProjectDocument = HydratedDocument<IProject, IProjectMethods>;

// Declare the full model along with any static methods
interface IProjectModel extends Model<IProject, IProjectQueryHelpers, IProjectMethods> {
  NewProjectFromRequest: (projectInfo: ProjectRequest, tenantId: mongoose.Types.ObjectId) => Promise<ProjectDocument>;
}

const ProjectSchema = new Schema<IProject, IProjectModel, IProjectMethods, IProjectQueryHelpers>({
  _id: { type: Schema.Types.ObjectId, required: true },
  projectName: { type: String, required: true },
  startedDate: { type: Date, required: true },
  customMetaData: { type: Map, of: String },
  projectDescription: { type: String, required: true },
  projectStatus: { type: String, required: true },
  events: [{ type: Schema.Types.ObjectId, ref: "Event" }],
  Ownertenancy: { type: Schema.Types.ObjectId, ref: "Tenancy", required: true },
  diffs: [{ type: Schema.Types.Mixed, required: true }],
  collaborators: [{ type: Schema.Types.ObjectId, ref: "Collaborator" }],
});

ProjectSchema.static(
  "NewProjectFromRequest",
  async function NewProjectFromRequest(
    projectInfo: ProjectRequest,
    tenantId: mongoose.Types.ObjectId
  ): Promise<ProjectDocument> {
    const customMetaData = (projectInfo?.customMetaData as { [key: string]: string }) || {};

    return this.create({
      _id: new mongoose.Types.ObjectId(),
      projectName: projectInfo.projectName,
      startedDate: new Date(),
      customMetaData: customMetaData,
      projectDescription: projectInfo.projectDescription,
      projectStatus: "ACTIVE",
      events: [],
      Ownertenancy: tenantId,
      diffs: [],
      collaborators: projectInfo.collaborators,
    });
  }
);

ProjectSchema.method("ListallEvents", async function ListallEvents(): Promise<EventResponse[]> {
  const eventIds = this.events;
  const events = await Event.find({ _id: { $in: eventIds } });
  return events.map((event) => event.ToEventResponse());
});

ProjectSchema.method("ToProjectResponse", async function ToProjectResponse(): Promise<ProjectResponse> {
  const obj: ProjectResponse = {
    projectId: this._id.toString(),
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
  Projectcollaborator[]
> {
  // Get RelationshipManager object from the database

  const ProjectCollaborators: Projectcollaborator[] = [];

  for (const collaboratorID of this.collaborators) {
    const relationship = await RelationshipManager.findByCollaborators(this.Ownertenancy, collaboratorID);
    if (relationship == null) {
      continue;
    }
    const info = relationship.collaberatorsInfo.get(this.Ownertenancy);

    if (info == null) {
      continue;
    }

    const collaborator: Projectcollaborator = {
      tenantID: collaboratorID.toString(),
      friendlyName: info.friendlyName,
    };

    ProjectCollaborators.push(collaborator);
  }

  return ProjectCollaborators;
});

ProjectSchema.method("IsPartOfTenancy", function IsPartOfTenancy(tenancyId: mongoose.Types.ObjectId): boolean {
  return this.Ownertenancy.equals(tenancyId);
});

ProjectSchema.method("applyDiff", function applyDiff(updateRequest: ProjectDiffRequest): ProjectDiffResponse {
  const diff: ProjectDiffResponse = {};

  if (updateRequest.projectName) {
    diff.projectName = {
      old: this.projectName,
      new: updateRequest.projectName,
    };
    this.projectName = updateRequest.projectName;
  }

  if (updateRequest.projectDescription) {
    diff.projectDescription = {
      old: this.projectDescription,
      new: updateRequest.projectDescription,
    };
    this.projectDescription = updateRequest.projectDescription;
  }

  if (updateRequest.projectStatus) {
    diff.projectStatus = {
      old: this.projectStatus,
      new: updateRequest.projectStatus,
    };
    this.projectStatus = updateRequest.projectStatus;
  }

  if (updateRequest.customMetaData) {
    diff.customMetaData = {
      old: this.customMetaData,
      new: updateRequest.customMetaData,
    };
    this.customMetaData = updateRequest.customMetaData as { [key: string]: string };
  }

  if (updateRequest.collaborators) {
    diff.ProjectCollaborators = {
      old: this.collaborators.map((id) => id.toString()),
      new: updateRequest.collaborators,
    };
    this.collaborators = updateRequest.collaborators.map((id) => new mongoose.Types.ObjectId(id));
  }

  this.diffs.push(diff);

  return diff;
});

ProjectSchema.method("IsActive", function IsActive(): boolean {
  return this.projectStatus === "ACTIVE";
});

export const Project = model<IProject, IProjectModel>("Project", ProjectSchema);
