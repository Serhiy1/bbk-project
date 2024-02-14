// mongoose project schema

import mongoose, { model, Schema } from "mongoose";

import {
  EventResponse,
  ProjectDiffRequest,
  ProjectDiffResponse,
  ProjectRequest,
  ProjectResponse,
} from "../types/projects";
import { Event } from "./event";

interface IProject {
  projectName: string;
  projectId: mongoose.Types.ObjectId;
  startedDate: Date;
  customMetaData: { [key: string]: string };
  projectDescription: string;
  projectStatus: "ACTIVE" | "INACTIVE";
  events: mongoose.Types.ObjectId[];
  tenancy: mongoose.Types.ObjectId;
  diffs: ProjectDiffResponse[];
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
  diffs: [{ type: Schema.Types.Mixed, required: true }],
});

export const Project = model<IProject>("Project", ProjectSchema);

function newProject(projectInfo: IProject) {
  return new Project(projectInfo);
}

ProjectSchema.set("toObject", {
  transform(doc, ret) {
    const obj: ProjectResponse = {
      projectName: ret.projectName,
      projectId: ret.projectId,
      startedDate: ret.startedDate,
      customMetaData: ret.customMetaData,
      projectDescription: ret.projectDescription,
      projectStatus: ret.projectStatus,
    };

    return obj;
  },
});

export function newProjectFromRequest(projectInfo: ProjectRequest, tenantId: mongoose.Types.ObjectId) {
  const customMetaData = (projectInfo?.customMetaData as { [key: string]: string }) || {};

  return newProject({
    projectName: projectInfo.projectName,
    projectId: new mongoose.Types.ObjectId(),
    startedDate: new Date(),
    customMetaData: customMetaData,
    projectDescription: projectInfo.projectDescription,
    projectStatus: projectInfo.projectStatus || "ACTIVE",
    events: [],
    tenancy: tenantId,
    diffs: [],
  });
}

// project arg is an instance of Project
export function createDiff(project: IProject, updateRequest: ProjectDiffRequest): ProjectDiffResponse {
  const diff: ProjectDiffResponse = {};

  // go through the keys in the update request and generate the old / new sub objects
  // then add them to the diff object

  if (updateRequest.projectName) {
    diff.projectName = {
      old: project.projectName,
      new: updateRequest.projectName,
    };
  }

  if (updateRequest.projectDescription) {
    diff.projectDescription = {
      old: project.projectDescription,
      new: updateRequest.projectDescription,
    };
  }

  if (updateRequest.projectStatus) {
    diff.projectStatus = {
      old: project.projectStatus,
      new: updateRequest.projectStatus,
    };
  }

  if (updateRequest.customMetaData) {
    diff.customMetaData = {
      old: project.customMetaData,
      new: updateRequest.customMetaData,
    };
  }

  return diff;
}

export function updateProjectFromDiff(project: IProject, updateRequest: ProjectDiffRequest) {
  if (updateRequest.projectName) {
    project.projectName = updateRequest.projectName;
  }

  if (updateRequest.projectDescription) {
    project.projectDescription = updateRequest.projectDescription;
  }

  if (updateRequest.projectStatus) {
    project.projectStatus = updateRequest.projectStatus;
  }

  if (updateRequest.customMetaData) {
    project.customMetaData = updateRequest.customMetaData as { [key: string]: string };
  }
}

export async function ListallEventsOnProject(projectId: mongoose.Types.ObjectId): Promise<EventResponse[]> {
  const project = await Project.findById(projectId).populate("events");

  if (project === null) {
    return [];
  }

  const eventIds = project.events;
  const events = await Event.find({ _id: { $in: eventIds } });
  return events.map((event) => event.toObject());
}
