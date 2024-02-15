import mongoose, { HydratedDocument, Model, model, Schema } from "mongoose";

import { ProjectResponse } from "../types/projects";
import { Project } from "./project";

// Declare the attributes of the model
interface ITenancy {
  _id: mongoose.Types.ObjectId;
  projects: mongoose.Types.ObjectId[];
}

// declare the methods of the model
interface ITenancyMethods {
  ListProjects: () => Promise<ProjectResponse[]>;
  AssertProjectInTenancy: (projectId: mongoose.Types.ObjectId) => Promise<boolean>;
}

// Declare the byEmail Query helper
interface ITenancyQueryHelpers {
  // Keep Empty for now https://mongoosejs.com/docs/typescript/query-helpers.html
}

export type TenancyDocument = HydratedDocument<ITenancy, ITenancyMethods>;

// declare the Full Model along with any static methods
export interface ITenancyModel extends Model<ITenancy, ITenancyQueryHelpers, ITenancyMethods> {
  NewTenancy: () => Promise<HydratedDocument<ITenancy, ITenancyMethods>>;
}

// Create the schema
const TenancySchema = new Schema<ITenancy, ITenancyModel, ITenancyMethods>({
  _id: { type: Schema.Types.ObjectId, required: true },
  projects: [{ type: Schema.Types.ObjectId, ref: Project, required: true }],
});

TenancySchema.static("NewTenancy", async function NewTenancy(): Promise<HydratedDocument<ITenancy, ITenancyMethods>> {
  return this.create({
    _id: new mongoose.Types.ObjectId(),
    projects: [],
  });
});

TenancySchema.method("ListProjects", async function ListProjects(): Promise<ProjectResponse[]> {
  const projectIDs = this.projects;

  // call toObject to convert the Mongoose Document to a plain JS object
  const projects = await Project.find({ _id: { $in: projectIDs } });
  const projectResponses: ProjectResponse[] = [];

  for (const project of projects) {
    projectResponses.push(project.ToProjectResponse());
  }

  return projectResponses;
});

TenancySchema.method(
  "AssertProjectInTenancy",
  async function AssertProjectInTenancy(projectId: mongoose.Types.ObjectId): Promise<boolean> {
    return this.projects.includes(projectId);
  }
);

export const Tenancy = model<ITenancy, ITenancyModel>("Tenancy", TenancySchema);
