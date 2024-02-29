import { faker } from "@faker-js/faker";
import { beforeAll, describe, expect, test } from "@jest/globals";
import mongoose from "mongoose";

import { Project } from "../../app/models/database/project";
import { Tenancy, TenancyDocument } from "../../app/models/database/tenancy";
import { CreateRandomProject } from "../utils/utils";

test("test NewTenancyFromRequest Static Function", async () => {
  const companyName = faker.company.name();
  const tenancy = await Tenancy.NewTenancy(companyName);
  await tenancy.save();

  // get the tenancy from the database via id
  const tenancyFromDB = await Tenancy.findById(tenancy._id);

  // assert that the tenancy has the correct properties
  expect(tenancyFromDB).toHaveProperty("_id", tenancy._id);
  expect(tenancyFromDB).toHaveProperty("projects", []);
});

test("test listAllProjects Method", async () => {
  const companyName = faker.company.name();
  const tenancy = await Tenancy.NewTenancy(companyName);
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
  const companyName = faker.company.name();
  const tenancy = await Tenancy.NewTenancy(companyName);
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

describe("test ListPendingInvites Method", () => {
  let tenancy1: TenancyDocument;
  const companyName1 = faker.company.name();
  let tenancy2: TenancyDocument;
  const companyName2 = faker.company.name();
  let tenancy3: TenancyDocument;
  const companyName3 = faker.company.name();

  // beforeall creates three tenancies
  beforeAll(async () => {
    tenancy1 = await Tenancy.NewTenancy(companyName1);
    tenancy2 = await Tenancy.NewTenancy(companyName2);
    tenancy3 = await Tenancy.NewTenancy(companyName3);

    tenancy1.save();
    tenancy2.save();
    tenancy3.save();
  });

  test("test ListPendingInvites Method no invites", async () => {
    const pendingInvitesTenancyOne = await tenancy1.ListPendingInvites();
    const pendingInvitesTenancyTwo = await tenancy2.ListPendingInvites();
    const pendingInvitesTenancyThree = await tenancy3.ListPendingInvites();

    // assert that there are no pending invites
    expect(pendingInvitesTenancyOne).toHaveLength(0);
    expect(pendingInvitesTenancyTwo).toHaveLength(0);
    expect(pendingInvitesTenancyThree).toHaveLength(0);
  });

  test("test ListPendingInvites Method with invites", async () => {
    // tenancy 1 add tenancy 2 as a collaborator
    await tenancy1.AddCollaborator({ tenantID: tenancy2._id.toString(), friendlyName: faker.company.name() });

    // both tenancy 1 and tenancy 2 add tenancy 3 as a collaborator
    await tenancy1.AddCollaborator({ tenantID: tenancy3._id.toString(), friendlyName: faker.company.name() });
    await tenancy2.AddCollaborator({ tenantID: tenancy3._id.toString(), friendlyName: faker.company.name() });

    const TenancyOneFromDB = await Tenancy.findById(tenancy1._id);
    const TenancyTwoFromDB = await Tenancy.findById(tenancy2._id);

    const pendingInvitesTenancyOne = await (TenancyOneFromDB as TenancyDocument).ListPendingInvites();
    const pendingInvitesTenancyTwo = await (TenancyTwoFromDB as TenancyDocument).ListPendingInvites();
    const pendingInvitesTenancyThree = await tenancy3.ListPendingInvites();

    // assert that there are no pending invites
    expect(pendingInvitesTenancyOne).toHaveLength(2);
    expect(pendingInvitesTenancyTwo).toHaveLength(1);
    expect(pendingInvitesTenancyThree).toHaveLength(0);
  });

  test("OpenInvites Method with invites", async () => {
    const TenancyOneFromDB = await Tenancy.findById(tenancy1._id);
    const TenancyTwoFromDB = await Tenancy.findById(tenancy2._id);
    const TenancyThreeFromDB = await Tenancy.findById(tenancy3._id);

    const openInvitesTenancyOne = await (TenancyOneFromDB as TenancyDocument).ListOpenInvites();
    const openInvitesTenancyTwo = await (TenancyTwoFromDB as TenancyDocument).ListOpenInvites();
    const openInvitesTenancyThree = await (TenancyThreeFromDB as TenancyDocument).ListOpenInvites();

    // assert that there are no pending invites
    expect(openInvitesTenancyOne).toHaveLength(0);
    expect(openInvitesTenancyTwo).toHaveLength(1);
    expect(openInvitesTenancyThree).toHaveLength(2);
  });

  test(" Adding back the collaborator updates pending and open invites", async () => {
    // tenancy 2 adds tenancy 1 as a collaborator
    await tenancy2.AddCollaborator({ tenantID: tenancy1._id.toString(), friendlyName: faker.company.name() });

    const TenancyOneFromDB = await Tenancy.findById(tenancy1._id);
    const TenancyTwoFromDB = await Tenancy.findById(tenancy2._id);

    // check open invites
    const openInvitesTenancyOne = await (TenancyOneFromDB as TenancyDocument).ListOpenInvites();
    const openInvitesTenancyTwo = await (TenancyTwoFromDB as TenancyDocument).ListOpenInvites();

    // assert that there are no open invites
    expect(openInvitesTenancyOne).toHaveLength(0);
    expect(openInvitesTenancyTwo).toHaveLength(0);

    // check pending invites
    const pendingInvitesTenancyOne = await (TenancyOneFromDB as TenancyDocument).ListPendingInvites();
    const pendingInvitesTenancyTwo = await (TenancyTwoFromDB as TenancyDocument).ListPendingInvites();

    // assert that there are no pending invites
    expect(pendingInvitesTenancyOne).toHaveLength(1);
    expect(pendingInvitesTenancyTwo).toHaveLength(1);
  });

  test(" test ListActiveCollaborators Method", async () => {
    const TenancyOneFromDB = await Tenancy.findById(tenancy1._id);
    const TenancyTwoFromDB = await Tenancy.findById(tenancy2._id);
    const TenancyThreeFromDB = await Tenancy.findById(tenancy3._id);

    const activeCollaboratorsTenancyOne = await (TenancyOneFromDB as TenancyDocument).listActiveCollaborators();
    const activeCollaboratorsTenancyTwo = await (TenancyTwoFromDB as TenancyDocument).listActiveCollaborators();
    const activeCollaboratorsTenancyThree = await (TenancyThreeFromDB as TenancyDocument).listActiveCollaborators();

    // assert that there are no pending invites
    expect(activeCollaboratorsTenancyOne).toHaveLength(1);
    expect(activeCollaboratorsTenancyTwo).toHaveLength(1);
    expect(activeCollaboratorsTenancyThree).toHaveLength(0);
  });

  test(" Test Find a collaborator exists", async () => {
    const TenancyOneFromDB = await Tenancy.findById(tenancy1._id);
    const TenancyTwoFromDB = await Tenancy.findById(tenancy2._id);

    const collaboratorFromOne = await (TenancyOneFromDB as TenancyDocument).findCollaborator(tenancy2._id);
    const collaboratorFromTwo = await (TenancyTwoFromDB as TenancyDocument).findCollaborator(tenancy1._id);

    // assert that there are no open invites
    expect(collaboratorFromOne).toHaveProperty("tenantID", tenancy2._id.toString());
    expect(collaboratorFromOne).toHaveProperty("friendlyName");

    expect(collaboratorFromTwo).toHaveProperty("tenantID", tenancy1._id.toString());
    expect(collaboratorFromTwo).toHaveProperty("friendlyName");
  });

  test(" Removing the collaborator updates pending and open invites", async () => {
    // tenancy 2 adds tenancy 1 as a collaborator
    await tenancy2.removeCollaborator(tenancy1._id);

    const TenancyOneFromDB = await Tenancy.findById(tenancy1._id);
    const TenancyTwoFromDB = await Tenancy.findById(tenancy2._id);

    // check open invites
    const openInvitesTenancyOne = await (TenancyOneFromDB as TenancyDocument).ListOpenInvites();
    const openInvitesTenancyTwo = await (TenancyTwoFromDB as TenancyDocument).ListOpenInvites();

    // assert the invite is marked as open again
    expect(openInvitesTenancyOne).toHaveLength(0);
    expect(openInvitesTenancyTwo).toHaveLength(1);

    // check pending invites
    const pendingInvitesTenancyOne = await (TenancyOneFromDB as TenancyDocument).ListPendingInvites();
    const pendingInvitesTenancyTwo = await (TenancyTwoFromDB as TenancyDocument).ListPendingInvites();

    // assert that invite is marked as pending again
    expect(pendingInvitesTenancyOne).toHaveLength(2);
    expect(pendingInvitesTenancyTwo).toHaveLength(1);
  });
});

test("test AddCollaborator Method, collaborator does not exist should throw error", async () => {
  const companyName = faker.company.name();
  const tenancy = await Tenancy.NewTenancy(companyName);
  await tenancy.save();

  // add a collaborator that does not exist
  await expect(
    tenancy.AddCollaborator({ tenantID: new mongoose.Types.ObjectId().toString(), friendlyName: faker.company.name() })
  ).rejects.toThrow("collaberator Tenant does not exist");
});

test("test removeCollaborator Method, collaborator does not exist should throw error", async () => {
  const companyName = faker.company.name();
  const tenancy = await Tenancy.NewTenancy(companyName);
  await tenancy.save();

  // remove a collaborator that does not exist
  await expect(tenancy.removeCollaborator(new mongoose.Types.ObjectId())).rejects.toThrow("unknown collaborator");
});

test("test findCollaborator on unknown collaborator", async () => {
  const companyName = faker.company.name();
  const tenancy = await Tenancy.NewTenancy(companyName);
  await tenancy.save();

  // remove a collaborator that does not exist
  await expect(tenancy.findCollaborator(new mongoose.Types.ObjectId())).rejects.toThrow("unknown collaborator");
});
