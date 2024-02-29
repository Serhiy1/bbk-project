import { faker } from "@faker-js/faker";
import { expect, test } from "@jest/globals";
import mongoose from "mongoose";

import { Event } from "../../app/models/database/event";
import { Project, ProjectDocument } from "../../app/models/database/project";
import { CreateRandomDiff, CreateRandomEvent, CreateRandomProject } from "../utils/utils";

test("test NewProjectFromRequest Static Function", async () => {
  const projectinfo = CreateRandomProject();
  const tenancyId = new mongoose.Types.ObjectId();
  const project = await Project.NewProjectFromRequest(projectinfo, tenancyId);
  await project.save();

  // get the project from the database via id
  const projectFromDB = await Project.findById(project._id);

  // check that the project has the correct properties
  expect(projectFromDB).toHaveProperty("projectName", projectinfo.projectName);
  expect(projectFromDB).toHaveProperty("startedDate");
  expect(projectFromDB).toHaveProperty("customMetaData");
  expect(projectFromDB).toHaveProperty("projectDescription", projectinfo.projectDescription);
  expect(projectFromDB).toHaveProperty("projectStatus", "ACTIVE");
  expect(projectFromDB).toHaveProperty("events", []);
  expect(projectFromDB).toHaveProperty("Ownertenancy", tenancyId);
  expect(projectFromDB).toHaveProperty("diffs", []);
});

test("test ListallEvents Method", async () => {
  const projectinfo = CreateRandomProject();
  const tenancyId = new mongoose.Types.ObjectId();
  const RandomEvents = [CreateRandomEvent(), CreateRandomEvent(), CreateRandomEvent()];

  // Add project to database
  const project = await Project.NewProjectFromRequest(projectinfo, tenancyId);
  await project.save();

  // Create events and add them to the project
  for (const event of RandomEvents) {
    const newEvent = await Event.NewEventFromRequest(event, project._id);
    await newEvent.save();
    project.events.push(newEvent._id);
  }
  await project.save();

  // get project from database
  const projectFromDB = await Project.findById(project._id);

  expect(projectFromDB).not.toBeNull();

  // get the events from the project
  const eventsFromDB = await (projectFromDB as ProjectDocument).ListallEvents();

  // check that the events have the correct properties
  for (const event of eventsFromDB) {
    expect(event).toHaveProperty("eventId");
    expect(event).toHaveProperty("eventDate");
    expect(event).toHaveProperty("eventName");
    expect(event).toHaveProperty("eventType");
    expect(event).toHaveProperty("customMetaData");
  }
});

test("test ToProjectResponse Method", async () => {
  const projectinfo = CreateRandomProject();
  const tenancyId = new mongoose.Types.ObjectId();

  // Add project to database
  const project = await Project.NewProjectFromRequest(projectinfo, tenancyId);
  await project.save();

  // get project from database
  const projectFromDB = await Project.findById(project._id);

  expect(projectFromDB).not.toBeNull();

  // get the project response
  const projectResponse = (projectFromDB as ProjectDocument).ToProjectResponse();

  // check that the project response has the correct properties
  expect(projectResponse).toHaveProperty("projectId");
  expect(projectResponse).toHaveProperty("projectName");
  expect(projectResponse).toHaveProperty("startedDate");
  expect(projectResponse).toHaveProperty("customMetaData");
  expect(projectResponse).toHaveProperty("projectDescription");
  expect(projectResponse).toHaveProperty("projectStatus");
});

test("test IsPartOfTenancy Method", async () => {
  const projectinfo = CreateRandomProject();
  const tenancyId = new mongoose.Types.ObjectId();

  // Add project to database
  const project = await Project.NewProjectFromRequest(projectinfo, tenancyId);
  await project.save();

  // get project from database
  const projectFromDB = await Project.findById(project._id);

  expect(projectFromDB).not.toBeNull();

  // check if the project is part of the tenancy
  const isPartOfTenancy = (projectFromDB as ProjectDocument).IsPartOfTenancy(tenancyId);
  expect(isPartOfTenancy).toBe(true);
});

test("test applyDiff Method", async () => {
  const projectinfo = CreateRandomProject();
  const tenancyId = new mongoose.Types.ObjectId();

  // Add project to database
  const project = await Project.NewProjectFromRequest(projectinfo, tenancyId);
  await project.save();

  // Create a random diff
  const diff = CreateRandomDiff();
  const diffresp = project.applyDiff(diff);

  // check that the diff response has the correct properties
  expect(diffresp).toHaveProperty("projectName");
  expect(diffresp.projectName?.old).toBe(projectinfo.projectName);
  expect(diffresp.projectName?.new).toBe(diff.projectName);
  expect(diffresp).toHaveProperty("projectDescription");
  expect(diffresp.projectDescription?.old).toBe(projectinfo.projectDescription);
  expect(diffresp.projectDescription?.new).toBe(diff.projectDescription);
});

test("project IsActive Method", async () => {
  // create random project
  const projectinfo = CreateRandomProject();
  const tenancyId = new mongoose.Types.ObjectId();
  const project = await Project.NewProjectFromRequest(projectinfo, tenancyId);
  await project.save();

  // update the project status to inactive
  project.applyDiff({ projectStatus: "INACTIVE" });
  await project.save();

  // check that the project is inactive
  expect(project.IsActive()).toBe(false);
});

test("project Update CustomMetaData via diff", async () => {
  // create random project
  const projectinfo = CreateRandomProject();
  const tenancyId = new mongoose.Types.ObjectId();

  const project = await Project.NewProjectFromRequest(projectinfo, tenancyId);
  await project.save();

  // create diff that only updates the customMetaData
  // loop over the existing customMetaData and update the values
  const UpdatedCustomMetaData: Record<string, string> = {};
  for (const key in projectinfo.customMetaData) {
    UpdatedCustomMetaData[key] = faker.lorem.word();
  }

  const diff = { customMetaData: UpdatedCustomMetaData };
  const diffresp = project.applyDiff(diff);

  // check that the diff response has the correct properties
  expect(diffresp).toHaveProperty("customMetaData");
  project.save();

  const projectFromDB = await Project.findById(project._id);
  const customMetaDataFromDB = (projectFromDB as ProjectDocument).ToProjectResponse().customMetaData;

  // check that the customMetaData has been updated
  expect(JSON.stringify(customMetaDataFromDB)).toEqual(JSON.stringify(UpdatedCustomMetaData));
});
