// mongoose project schema

import mongoose, { model, Schema } from "mongoose";

interface IProject {
  projectName: string;
  projectId: mongoose.Types.ObjectId;
  startedDate: Date;
  customMetaData: { [key: string]: string };
  projectDescription: string;
  projectStatus: "ACTIVE" | "INACTIVE";
  events: mongoose.Types.ObjectId[];
  tenancy: mongoose.Types.ObjectId;
}

const ProjectSchema = new Schema<IProject>({
  projectName: { type: String, required: true },
  projectId: { type: Schema.Types.ObjectId, required: true },
  startedDate: { type: Date, required: true },
  customMetaData: { type: Map, of: String },
  projectDescription: { type: String, required: true },
  projectStatus: { type: String, required: true },
  events: [{ type: Schema.Types.ObjectId, ref: "Event" }],
  tenancy: { type: Schema.Types.ObjectId, ref: "Tenancy", required: true },
});

export const Project = model<IProject>("Project", ProjectSchema);

export function newProject(projectInfo: IProject) {
  return new Project(projectInfo);
}

export function findProjectById(projectId: mongoose.Types.ObjectId) {
  return Project.findById(projectId);
}

export function ListEventIds(projectId: mongoose.Types.ObjectId) {
    return Project.findById(projectId).select("events");
}