import { faker } from "@faker-js/faker";
import { expect, test } from "@jest/globals";

import { Event } from "../../app/models/database/event";
import { Project, ProjectDocument } from "../../app/models/database/project";
import { Tenancy, TenancyDocument } from "../../app/models/database/tenancy";
import { ProjectCollaborator } from "../../app/models/types/projects";
import {
  CreateRandomDiffRequest,
  CreateRandomEventRequest,
  CreateRandomProjectRequest,
  CreateRandomTenancy,
} from "../utils/utils";

test("test NewProjectFromRequest Static Function", async () => {
  const tenancy = await CreateRandomTenancy();

  const projectinfo = CreateRandomProjectRequest();
  const project = await Project.NewProjectFromRequest(projectinfo, tenancy);

  // get the project from the database via id
  const projectFromDB = await Project.findById(project._id);

  // check that the project has the correct properties
  expect(projectFromDB).toHaveProperty("projectName", projectinfo.projectName);
  expect(projectFromDB).toHaveProperty("startedDate");
  expect(projectFromDB).toHaveProperty("customMetaData");
  expect(projectFromDB).toHaveProperty("projectDescription", projectinfo.projectDescription);
  expect(projectFromDB).toHaveProperty("projectStatus", "ACTIVE");
  expect(projectFromDB).toHaveProperty("events", []);
  expect(projectFromDB).toHaveProperty("OwnerTenancy", tenancy._id);
  expect(projectFromDB).toHaveProperty("diffs", []);
});

test("test ListallEvents Method", async () => {
  const tenancy = await CreateRandomTenancy();
  const projectinfo = CreateRandomProjectRequest();
  const RandomEvents = [CreateRandomEventRequest(), CreateRandomEventRequest(), CreateRandomEventRequest()];

  // Add project to database
  const project = await Project.NewProjectFromRequest(projectinfo, tenancy);

  // Create events and add them to the project
  for (const event of RandomEvents) {
    const newEvent = await Event.NewEventFromRequest(event, project, tenancy);
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
  const projectinfo = CreateRandomProjectRequest();
  const tenancy = await CreateRandomTenancy();

  // Add project to database
  const project = await Project.NewProjectFromRequest(projectinfo, tenancy);

  // get project from database
  const projectFromDB = await Project.findById(project._id);

  expect(projectFromDB).not.toBeUndefined();

  // get the project response
  const projectResponse = await (projectFromDB as ProjectDocument).ToProjectResponse();

  // check that the project response has the correct properties
  expect(projectResponse).toHaveProperty("projectId");
  expect(projectResponse).toHaveProperty("projectName");
  expect(projectResponse).toHaveProperty("startedDate");
  expect(projectResponse).toHaveProperty("customMetaData");
  expect(projectResponse).toHaveProperty("projectDescription");
  expect(projectResponse).toHaveProperty("projectStatus");
});


test("test CreateCopyForCollaborator static Method", async () => {
  const ownerTenancy = await CreateRandomTenancy();
  let collaboratorOne = await CreateRandomTenancy();
  let collaboratorTwo = await CreateRandomTenancy();
  const projectinfo = CreateRandomProjectRequest();
  
  const project = await Project.NewProjectFromRequest(projectinfo, ownerTenancy);
  
  // create copies for the collaborators
  await Project.CreateCopyForCollaborator(project, collaboratorOne);
  await Project.CreateCopyForCollaborator(project, collaboratorTwo);
  
  // check that the copies are present on the collaborators project list
  collaboratorOne = (await Tenancy.findById(collaboratorOne._id) as TenancyDocument);
  collaboratorTwo = (await Tenancy.findById(collaboratorTwo._id) as TenancyDocument);
  
  expect(collaboratorOne.projects).toContainEqual(project.ProjectId);
  expect(collaboratorTwo.projects).toContainEqual(project.ProjectId);
})

test("test ListProjectCollaborators Method", async () => {
  
  
  const ownerTenancy = await CreateRandomTenancy();
  const collaboratorOne = await CreateRandomTenancy();
  const collaboratorTwo = await CreateRandomTenancy();
  const projectinfo = CreateRandomProjectRequest();
  
  const project = await Project.NewProjectFromRequest(projectinfo, ownerTenancy);
  
  // create copies for the collaborators
  await Project.CreateCopyForCollaborator(project, collaboratorOne);
  await Project.CreateCopyForCollaborator(project, collaboratorTwo);
  
  // directly update the collaborators list to skip the relationship checks
  project.collaborators = [ownerTenancy._id, collaboratorOne._id, collaboratorTwo._id];
  await project.save();
  
  // get the project from the database
  const projectFromDB = await Project.findById(project._id)
  
  // get the list of collaborators
  const collaborators : ProjectCollaborator[] = await (projectFromDB as ProjectDocument).ListProjectCollaborators();
  expect(collaborators.length).toBe(2);
  expect(collaborators[0].tenantID).toBe(collaboratorOne._id.toString());
  expect(collaborators[1].tenantID).toBe(collaboratorTwo._id.toString());
  
  expect(collaborators[0].friendlyName).toBe(collaboratorOne.companyName);
  expect(collaborators[1].friendlyName).toBe(collaboratorTwo.companyName);
  
})

test("test IsOwner Method", async () => {
  const ownerTenancy = await CreateRandomTenancy();
  const collaboratorOne = await CreateRandomTenancy();
  const collaboratorTwo = await CreateRandomTenancy();
  const projectinfo = CreateRandomProjectRequest();
  
  const project = await Project.NewProjectFromRequest(projectinfo, ownerTenancy);
  
  // create copies for the collaborators
  await Project.CreateCopyForCollaborator(project, collaboratorOne);
  await Project.CreateCopyForCollaborator(project, collaboratorTwo);
  
  // directly update the collaborators list to skip the relationship checks
  project.collaborators = [ownerTenancy._id, collaboratorOne._id, collaboratorTwo._id];
  await project.save();
  
  // get the project from the database
  const projectFromDB = (await Project.findById(project._id) as ProjectDocument);
  expect(projectFromDB.IsOwner(ownerTenancy)).toBe(true);
  expect(projectFromDB.IsOwner(collaboratorOne)).toBe(false);
  expect(projectFromDB.IsOwner(collaboratorTwo)).toBe(false);

})

test("IsActive Method", async () => {
  
  const ownerTenancy = await CreateRandomTenancy();
  const collaboratorOne = await CreateRandomTenancy();
  const collaboratorTwo = await CreateRandomTenancy();
  const projectinfo = CreateRandomProjectRequest();
  
  const project = await Project.NewProjectFromRequest(projectinfo, ownerTenancy);
  
  // create copies for the collaborators
  await Project.CreateCopyForCollaborator(project, collaboratorOne);
  await Project.CreateCopyForCollaborator(project, collaboratorTwo);
  
  // directly update the collaborators list to skip the relationship checks
  project.collaborators = [ownerTenancy._id, collaboratorOne._id];
  await project.save();
  
  // get the project from the database
  const projectFromDB = (await Project.findById(project._id) as ProjectDocument);
  expect(projectFromDB.IsActive(ownerTenancy)).toBe(true);
  expect(projectFromDB.IsActive(collaboratorOne)).toBe(true);
  expect(projectFromDB.IsActive(collaboratorTwo)).toBe(false);
  
})


test("test applyDiff Method", async () => {
  const projectinfo = CreateRandomProjectRequest();
  const tenancy = await CreateRandomTenancy();

  // Add project to database
  const project = await Project.NewProjectFromRequest(projectinfo, tenancy);

  // Create a random diff
  const diff = CreateRandomDiffRequest();
  const diffResp = await project.createDiff(diff, tenancy);

  // check that the diff response has the correct properties
  expect(diffResp).toHaveProperty("projectName");
  expect(diffResp.projectName?.old).toBe(projectinfo.projectName);
  expect(diffResp.projectName?.new).toBe(diff.projectName);
  expect(diffResp).toHaveProperty("projectDescription");
  expect(diffResp.projectDescription?.old).toBe(projectinfo.projectDescription);
  expect(diffResp.projectDescription?.new).toBe(diff.projectDescription);
});

test("project IsActive Method", async () => {
  // create random project
  const tenancy = await CreateRandomTenancy();

  const projectinfo = CreateRandomProjectRequest();
  const project = await Project.NewProjectFromRequest(projectinfo, tenancy);

  // update the project status to inactive
  await project.applyDiff({ projectStatus: "INACTIVE" }, tenancy);
  const ptojectFromDB = await Project.findById(project._id);

  // check that the project is inactive
  expect((ptojectFromDB as ProjectDocument).IsActive(tenancy)).toBe(false);
});

test("project Update CustomMetaData via diff", async () => {
  // create random project
  const tenancy = await CreateRandomTenancy();

  const projectinfo = CreateRandomProjectRequest();

  const project = await Project.NewProjectFromRequest(projectinfo, tenancy);

  // create diff that only updates the customMetaData
  // loop over the existing customMetaData and update the values
  const UpdatedCustomMetaData: Record<string, string> = {};
  for (const key in projectinfo.customMetaData) {
    UpdatedCustomMetaData[key] = faker.lorem.word();
  }

  const diff = { customMetaData: UpdatedCustomMetaData };
  const diffResp = await project.createDiff(diff, tenancy);

  // check that the diff response has the correct properties
  expect(diffResp).toHaveProperty("customMetaData");
  project.save();

  const projectFromDB = await Project.findById(project._id);
  const customMetaDataFromDB = (await (projectFromDB as ProjectDocument).ToProjectResponse()).customMetaData;

  // check that the customMetaData has been updated
  expect(JSON.stringify(customMetaDataFromDB)).toEqual(JSON.stringify(UpdatedCustomMetaData));
});
