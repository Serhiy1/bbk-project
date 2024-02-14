import { faker } from "@faker-js/faker";
import { expect } from "@jest/globals";
import { Express } from "express";
import request from "supertest";

import { UserTokenInfo } from "../app/models/database/user";
import { SignupRequest } from "../app/models/types/authentications";
import { ProjectRequest } from "../app/models/types/projects";
import { EventRequest } from "../app/models/types/projects";

export class Person {
  userName: string;
  email: string;
  password: string;
  token: string;
  token_info?: UserTokenInfo;

  constructor() {
    this.userName = faker.internet.userName();
    this.email = faker.internet.email().toLowerCase();
    this.password = faker.internet.password({ length: 12, prefix: "@1T_" });
    this.token = "";
    this.token_info;
  }
}

export async function SignupPerson(person: Person, app: Express) {
  const signup_info: SignupRequest = {
    email: person.email,
    username: person.userName,
    password: person.password,
  };

  const res = await request(app).post("/user/signup").send(signup_info);
  expect(res.statusCode).toBe(201);
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
