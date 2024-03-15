import { faker } from "@faker-js/faker";
import { expect } from "@jest/globals";
import { Application, Express } from "express";
import request from "supertest";

import { Tenancy, TenancyDocument } from "../../app/models/database/tenancy";
import { SignupRequest } from "../../app/models/types/authentications";
import { collaboratorsRequest } from "../../app/models/types/collaborators";
import { EventResponse, ProjectDiffRequest, ProjectRequest, ProjectResponse } from "../../app/models/types/projects";
import { EventRequest } from "../../app/models/types/projects";
import { DecodeToken, UserTokenInfo } from "../../app/utils/token";

export class Person {
  companyName: string;
  email: string;
  password: string;
  token: string;
  token_info: UserTokenInfo;

  constructor() {
    this.companyName = faker.company.name();
    this.email = faker.internet.email().toLowerCase();
    this.password = faker.internet.password({ length: 12, prefix: "@1T_" });
    this.token = "";
    this.token_info = {} as UserTokenInfo;
  }
}

export async function SignupPerson(person: Person, app: Express): Promise<string> {
  const signup_info: SignupRequest = {
    email: person.email,
    companyName: person.companyName,
    password: person.password,
  };

  const res = await request(app).post("/user/signup").send(signup_info);
  expect(res.statusCode).toBe(201);
  person.token = res.body.token;
  person.token_info = DecodeToken(person.token);

  return res.body.token;
}

export function CreateRandomProjectRequest(opts = { public_project: false }): ProjectRequest {
  return {
    projectName: faker.lorem.words(3),
    projectDescription: faker.lorem.sentence(),
    projectStatus: "ACTIVE",
    customMetaData: {
      [faker.lorem.word()]: faker.lorem.word(),
      [faker.lorem.word()]: faker.lorem.word(),
      [faker.lorem.word()]: faker.lorem.word(),
    },
    collaborators: [],
    public: opts.public_project,
  };
}

// Create A new Random Event object using faker
export function CreateRandomEventRequest(): EventRequest {
  return {
    eventName: faker.lorem.words(3),
    eventType: "INFO",
    customMetaData: {
      [faker.lorem.word()]: faker.lorem.word(),
      [faker.lorem.word()]: faker.lorem.word(),
      [faker.lorem.word()]: faker.lorem.word(),
    },
  };
}

// Create a random Diff object
export function CreateRandomDiffRequest(): ProjectDiffRequest {
  return {
    projectName: faker.lorem.words(3),
    projectDescription: faker.lorem.sentence(),
  };
}

// create a a diff that overrides all the passed in properties
export function CreateOverrideDiffRequest(project: ProjectResponse): ProjectDiffRequest {
  // update name, description and customMetaData
  // loop over the existing customMetaData and update the values
  const UpdatedCustomMetaData: Record<string, string> = {};
  for (const key in project.customMetaData) {
    UpdatedCustomMetaData[key] = faker.lorem.word();
  }

  return {
    projectName: faker.lorem.words(3),
    projectDescription: faker.lorem.sentence(),
    customMetaData: UpdatedCustomMetaData,
  };
}

export async function CreateRandomTenancy(): Promise<TenancyDocument> {
  const companyName = faker.company.name();
  const tenancy = await Tenancy.NewTenancy(companyName);
  await tenancy.save();
  return tenancy;
}
export function checkEventMatchesRequest(event: EventResponse, request: EventRequest) {
  expect(event.eventName).toBe(request.eventName);
  expect(event.eventType).toBe(request.eventType);
}
export function checkProjectMatchesRequest(project: ProjectResponse, request: ProjectRequest) {
  expect(project.projectName).toBe(request.projectName);
  expect(project.projectDescription).toBe(request.projectDescription);
  expect(project.projectStatus).toBe(request.projectStatus);
  checkCollaborators(project, request.collaborators || []);
}
export function checkCollaborators(project: ProjectResponse, collaborators: string[]) {
  const collaboratorIDs = project.ProjectCollaborators.map((collaborator) => collaborator.tenantID);
  // check that the project collaboratorID's Include the request collaborators but not nessicarily match
  expect(collaboratorIDs).toEqual(expect.arrayContaining(collaborators));
}
export async function becomeCollaborators(
  app: Application,
  personA: Person,
  personB: Person,
  pending: boolean = false
) {
  // person 1 adds person 2
  const AddPersonB: collaboratorsRequest = {
    friendlyName: personB.companyName,
    tenantID: personB.token_info.tenancyId.toString(),
  };

  const res = await request(app)
    .post("/collaborators")
    .set("Authorization", `Bearer ${personA.token}`)
    .send(AddPersonB);
  expect(res.statusCode).toBe(201);

  let expectedStatus: string;

  if (!pending) {
    // person 2 adds person 1 back
    const AddPersonA: collaboratorsRequest = {
      friendlyName: personA.companyName,
      tenantID: personA.token_info.tenancyId.toString(),
    };

    const res2 = await request(app)
      .post("/collaborators")
      .set("Authorization", `Bearer ${personB.token}`)
      .send(AddPersonA);
    expect(res2.statusCode).toBe(201);

    expectedStatus = "ACTIVE";
  } else {
    expectedStatus = "PENDING";
  }

  // check that both see an ACTIVE relationship
  const res3 = await request(app)
    .get(`/collaborators/${personB.token_info.tenancyId}`)
    .set("Authorization", `Bearer ${personA.token}`);
  expect(res3.statusCode).toBe(200);
  expect(res3.body.status).toBe(expectedStatus);

  const res4 = await request(app)
    .get(`/collaborators/${personA.token_info.tenancyId}`)
    .set("Authorization", `Bearer ${personB.token}`);
  expect(res4.statusCode).toBe(200);
  expect(res4.body.status).toBe(expectedStatus);
}
