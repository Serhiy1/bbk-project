// mongoose project schema

import mongoose, { HydratedDocument, Model, model, Schema } from "mongoose";

import {
  EventResponse,
  ProjectDiffRequest,
  ProjectDiffResponse,
  ProjectRequest,
  ProjectResponse,
} from "../types/projects";
import { Event } from "./event";

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
}

// Declare the attributes of the model
interface IProject extends IProjectArgs {
  _id: mongoose.Types.ObjectId;
}

// Declare the methods of the model
interface IProjectMethods {
  ListallEvents: () => Promise<EventResponse[]>;
  ToProjectResponse: () => ProjectResponse;
  IsPartOfTenancy: (tenancyId: mongoose.Types.ObjectId) => boolean;
  createDiffResponse: (updateRequest: ProjectDiffRequest) => ProjectDiffResponse;
  applyDiff: (updateRequest: ProjectDiffRequest, diff: ProjectDiffResponse) => void;
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
      });
    }
    );
    
    ProjectSchema.method("ListallEvents", async function ListallEvents(): Promise<EventResponse[]> {
      const eventIds = this.events;
      const events = await Event.find({ _id: { $in: eventIds } });
      return events.map((event) => event.ToEventResponse());
    });
    
    ProjectSchema.method("ToProjectResponse", function ToProjectResponse(): ProjectResponse {
      const obj: ProjectResponse = {
        projectId: this._id.toString(),
        projectName: this.projectName,
        startedDate: this.startedDate.toString(),
        customMetaData: this.customMetaData,
        projectDescription: this.projectDescription,
        projectStatus: this.projectStatus,
      };
      return obj;
    });
    
    ProjectSchema.method("IsPartOfTenancy", function IsPartOfTenancy(tenancyId: mongoose.Types.ObjectId): boolean {
      return this.Ownertenancy.equals(tenancyId);
    });
    
    ProjectSchema.method(
      "createDiffResponse",
      function createDiffResponse(updateRequest: ProjectDiffRequest): ProjectDiffResponse {
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
    
    return diff;
  }
  );
  
  ProjectSchema.method("applyDiff", function applyDiff(updateRequest: ProjectDiffRequest, diff: ProjectDiffResponse) {
    if (updateRequest.projectName) {
      this.projectName = updateRequest.projectName;
    }
    
    if (updateRequest.projectDescription) {
      this.projectDescription = updateRequest.projectDescription;
    }
    
    if (updateRequest.projectStatus) {
      this.projectStatus = updateRequest.projectStatus;
    }
    
    if (updateRequest.customMetaData) {
      this.customMetaData = updateRequest.customMetaData as { [key: string]: string };
    }
    
    this.diffs.push(diff);
  });
  
  export const Project = model<IProject, IProjectModel>("Project", ProjectSchema);