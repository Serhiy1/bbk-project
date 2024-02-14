import mongoose, { model, Schema } from "mongoose";

import { ProjectResponse } from "../types/projects";
import { Project } from "./project";

interface ITenancy {
  _id: mongoose.Types.ObjectId;
  projects: mongoose.Types.ObjectId[];
}

const TenancySchema = new Schema<ITenancy>({
  _id: { type: Schema.Types.ObjectId, required: true },
  projects: [{ type: Schema.Types.ObjectId, ref: Project }],
});

export const Tenancy = model<ITenancy>("Tenancy", TenancySchema);

export function newTenancy(userInfo: ITenancy) {
  return new Tenancy(userInfo);
}

export async function ListProjectsOnTenancy(tenancyId: mongoose.Types.ObjectId): Promise<ProjectResponse[]> {
  const projectIDs = await Tenancy.findById(tenancyId).select("projects");
  if (!projectIDs) {
    return [];
  }

  // call toObject to convert the Mongoose Document to a plain JS object
  const projects = await Project.find({ _id: { $in: projectIDs.projects } });
  const projectResponses: ProjectResponse[] = [];

  for (const project of projects) {
    projectResponses.push(project.toObject());
  }

  return projectResponses;
}

async function listProjectsIdsinTenancy(tenancyId: mongoose.Types.ObjectId): Promise<mongoose.Types.ObjectId[]> {
  const tenancy = await Tenancy.findById(tenancyId).select("projects");

  if (!tenancy) {
    return [];
  } else {
    return tenancy.projects;
  }
}

export async function AssertProjectInTenancy(
  tenancyId: mongoose.Types.ObjectId,
  projectId: mongoose.Types.ObjectId
): Promise<boolean> {
  const projects = await listProjectsIdsinTenancy(tenancyId);
  return projects.includes(projectId);
}
