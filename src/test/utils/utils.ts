import { faker } from "@faker-js/faker";
import { expect } from "@jest/globals";
import { Express } from "express";
import request from "supertest";

import { SignupRequest } from "../../app/models/types/authentications";
import { ProjectDiffRequest, ProjectRequest, ProjectResponse } from "../../app/models/types/projects";
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

// Create A new Random Project object using faker
export function CreateRandomProject(): ProjectRequest {
  return {
    projectName: faker.lorem.words(3),
    projectDescription: faker.lorem.sentence(),
    projectStatus: "ACTIVE",
    customMetaData: {
      [faker.lorem.word()]: faker.lorem.word(),
      [faker.lorem.word()]: faker.lorem.word(),
      [faker.lorem.word()]: faker.lorem.word(),
    },
  };
}

// Create A new Random Event object using faker
export function CreateRandomEvent(): EventRequest {
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
export function CreateRandomDiff(): ProjectDiffRequest {
  return {
    projectName: faker.lorem.words(3),
    projectDescription: faker.lorem.sentence(),
  };
}

// create a a diff that overrides all the passed in properties
export function CreateOverrideDiff(project: ProjectResponse): ProjectDiffRequest {
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
