import { afterAll, beforeAll, expect, test } from "@jest/globals";
import { MongoMemoryServer } from "mongodb-memory-server";

import { Project } from "../../app/models/database/project";
import { Tenancy, TenancyDocument } from "../../app/models/database/tenancy";
import { connectToDatabase } from "../../app/utils/utils";
import { CreateRandomProject } from "../utils";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  connectToDatabase(uri);
});

test("test NewTenancyFromRequest Static Function", async () => {
  const tenancy = await Tenancy.NewTenancy();
  await tenancy.save();

  // get the tenancy from the database via id
  const tenancyFromDB = await Tenancy.findById(tenancy._id);

  // assert that the tenancy has the correct properties
  expect(tenancyFromDB).toHaveProperty("_id", tenancy._id);
  expect(tenancyFromDB).toHaveProperty("projects", []);
});

test("test listAllProjects Method", async () => {
  const tenancy = await Tenancy.NewTenancy();
  await tenancy.save();

  const RandomProjects = [CreateRandomProject(), CreateRandomProject(), CreateRandomProject()];

  // Add projects to the tenancy
  for (const project of RandomProjects) {
    const newProject = await Project.NewProjectFromRequest(project, tenancy._id);
    await newProject.save();
    tenancy.projects.push(newProject._id);
  }
  await tenancy.save();

  // get the tenancy from the database via id
  const tenancyFromDB = await Tenancy.findById(tenancy._id);

  // assert project is not null
  expect(tenancyFromDB).not.toBeNull();

  // list all projects in the tenancy
  const projectsFromDB = await (tenancyFromDB as TenancyDocument).ListProjects();

  // assert that there are 3 projects in the tenancy
  expect(projectsFromDB).toHaveLength(3);

  // assert that the project has the correct properties of projectResponse
  for (const project of projectsFromDB) {
    expect(project).toHaveProperty("projectName");
    expect(project).toHaveProperty("projectDescription");
    expect(project).toHaveProperty("projectStatus");
    expect(project).toHaveProperty("startedDate");
  }
});

test("test AssertProjectInTenancy Method", async () => {
  const tenancy = await Tenancy.NewTenancy();
  const project = await Project.NewProjectFromRequest(CreateRandomProject(), tenancy._id);
  tenancy.projects.push(project._id);
  Promise.all([tenancy.save(), project.save()]);

  const tenancyFromDB = await Tenancy.findById(tenancy._id);

  // assert project is not null
  expect(tenancyFromDB).not.toBeNull();

  // assert that the project is in the tenancy
  const assert = await (tenancyFromDB as TenancyDocument).AssertProjectInTenancy(project._id);
  expect(assert).toBe(true);
});

/* Closing database connection at the end of the suite. */
afterAll(async () => {
  await mongo.stop();
});
