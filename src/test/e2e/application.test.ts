import { beforeAll, describe, expect, test } from "@jest/globals";
import mongoose from "mongoose";
import request from "supertest";

import { app } from "../../app/app";
import { User, UserDocument } from "../../app/models/database/user";
import { ApplicationResponse } from "../../app/models/types/applications";
import { LoginResponse } from "../../app/models/types/authentications";
import { ProjectResponse } from "../../app/models/types/projects";
import { CreateRandomProjectRequest, Person, SignupPerson } from "../utils/utils";

describe("Application Authentication", () => {
  // new person signs up and logs in
  // person creates an application
  // user authenticates application

  let person: Person;
  let personSameCompany: Person;
  let randomPerson: Person;
  let application: ApplicationResponse;

  beforeAll(async () => {
    person = new Person();
    personSameCompany = new Person();
    randomPerson = new Person();
    await SignupPerson(person, app);
    await SignupPerson(personSameCompany, app);
    await SignupPerson(randomPerson, app);

    // modify the person to have the same company as person via the database
    const person_from_db = await User.FindByEmail(personSameCompany.email);
    (person_from_db as UserDocument).tenancyId = person.token_info.tenancyId;
    personSameCompany.token_info.tenancyId = person.token_info.tenancyId;
    await (person_from_db as UserDocument).save();
  });

  test("Create Application", async () => {
    const res = await request(app).get("/app").set("Authorization", `Bearer ${person.token}`);
    expect(res.statusCode).toBe(201);
    application = res.body as ApplicationResponse;

    expect(application).toHaveProperty("appID");
    expect(application).toHaveProperty("secret");
  });

  test("Authenticate Application", async () => {
    // use the login endpoint to authenticate the application
    const res = await request(app).post("/user/login").send({ email: application.appID, password: application.secret });
    const res_body = res.body as LoginResponse;
    console.log(res_body);
    expect(res.statusCode).toBe(200);
  });

  test("Roll application secrets", async () => {
    // person same company should not be able to roll the secret
    // random person should not be able to roll the secret
    // person should be able to roll the secret

    const res = await request(app)
      .get(`/app/${application.appID}/newSecret`)
      .set("Authorization", `Bearer ${personSameCompany.token}`);
    expect(res.statusCode).toBe(403);

    const res2 = await request(app)
      .get(`/app/${application.appID}/newSecret`)
      .set("Authorization", `Bearer ${randomPerson.token}`);
    expect(res2.statusCode).toBe(403);

    const res3 = await request(app)
      .get(`/app/${application.appID}/newSecret`)
      .set("Authorization", `Bearer ${person.token}`);
    expect(res3.statusCode).toBe(201);

    const newSecret = res3.body.secret;

    // make sure the old secret does not work
    const res4 = await request(app)
      .post("/user/login")
      .send({ email: application.appID, password: application.secret });
    expect(res4.statusCode).toBe(403);

    // make sure the new secret does work
    const res5 = await request(app).post("/user/login").send({ email: application.appID, password: newSecret });
    expect(res5.statusCode).toBe(200);
  });

  test("Delete Application", async () => {
    // person same company should not be delete the application
    // random person should not be delete the application
    // person should be delete the application

    const res = await request(app)
      .delete(`/app/${application.appID}`)
      .set("Authorization", `Bearer ${personSameCompany.token}`);
    expect(res.statusCode).toBe(403);

    const res2 = await request(app)
      .delete(`/app/${application.appID}`)
      .set("Authorization", `Bearer ${randomPerson.token}`);
    expect(res2.statusCode).toBe(403);

    const res3 = await request(app).delete(`/app/${application.appID}`).set("Authorization", `Bearer ${person.token}`);
    expect(res3.statusCode).toBe(200);

    // send a delete request again, should fail
    const res4 = await request(app).delete(`/app/${application.appID}`).set("Authorization", `Bearer ${person.token}`);
    expect(res4.statusCode).toBe(404);
  });
});

describe("Input Validation", () => {
  let person: Person;

  beforeAll(async () => {
    person = new Person();
    await SignupPerson(person, app);
  });

  test("Delete Application that does not exist", async () => {
    const res = await request(app)
      .delete(`/app/${new mongoose.Types.UUID()}`)
      .set("Authorization", `Bearer ${person.token}`);
    expect(res.statusCode).toBe(404);
  });

  test("Delete Application with invalid appID", async () => {
    const res = await request(app).delete(`/app/invalidAppID`).set("Authorization", `Bearer ${person.token}`);
    expect(res.statusCode).toBe(400);
  });

  test("Roll Secret for application that does not exist", async () => {
    const res = await request(app)
      .get(`/app/${new mongoose.Types.UUID()}/newSecret`)
      .set("Authorization", `Bearer ${person.token}`);
    expect(res.statusCode).toBe(404);
  });

  test("Roll Secret for application with invalid appID", async () => {
    const res = await request(app).get(`/app/invalidAppID/newSecret`).set("Authorization", `Bearer ${person.token}`);
    expect(res.statusCode).toBe(400);
  });
});

// testing that an application can see project in the tenancy it belongs to
describe("Application API Access", () => {
  let person: Person;
  let secondPerson: Person;
  let application: ApplicationResponse;
  let applicationToken: string;

  beforeAll(async () => {
    person = new Person();
    secondPerson = new Person();
    await SignupPerson(person, app);
    await SignupPerson(secondPerson, app);

    const res = await request(app).get("/app").set("Authorization", `Bearer ${person.token}`);
    expect(res.statusCode).toBe(201);
    application = res.body as ApplicationResponse;

    const applicationSignup = await request(app)
      .post("/user/login")
      .send({ email: application.appID, password: application.secret });
    expect(applicationSignup.statusCode).toBe(200);
    applicationToken = applicationSignup.body.token;
  });

  test("Application can see projects in its tenancy", async () => {
    // person creates a project
    const projectInfo = CreateRandomProjectRequest();
    const res = await request(app).post("/projects").send(projectInfo).set("Authorization", `Bearer ${person.token}`);
    expect(res.statusCode).toBe(201);
    const project: ProjectResponse = res.body;

    // see if the application can access in the projects list
    const res2 = await request(app).get("/projects").set("Authorization", `Bearer ${applicationToken}`);
    expect(res2.statusCode).toBe(200);
    expect(res2.body).toHaveLength(1);

    // see if the application can access the project by ID
    const res3 = await request(app)
      .get(`/projects/${project.projectId}`)
      .set("Authorization", `Bearer ${applicationToken}`);
    expect(res3.statusCode).toBe(200);
  });

  test("Application cannot see projects in other tenancies", async () => {
    // second person creates a project
    const projectInfo = CreateRandomProjectRequest();
    const res = await request(app)
      .post("/projects")
      .send(projectInfo)
      .set("Authorization", `Bearer ${secondPerson.token}`);
    expect(res.statusCode).toBe(201);
    const project: ProjectResponse = res.body;

    // see if the application can access in the projects list
    const res2 = await request(app).get("/projects").set("Authorization", `Bearer ${applicationToken}`);
    expect(res2.statusCode).toBe(200);
    expect(res2.body).toHaveLength(1);

    // see if the application can access the project by ID
    const res3 = await request(app)
      .get(`/projects/${project.projectId}`)
      .set("Authorization", `Bearer ${applicationToken}`);
    expect(res3.statusCode).toBe(404);
  });

  test("Application can see shared projects", async () => {
    const projectInfo = CreateRandomProjectRequest();
    projectInfo.collaborators = [person.token_info.tenancyId.toString()];

    const res = await request(app)
      .post("/projects")
      .send(projectInfo)
      .set("Authorization", `Bearer ${secondPerson.token}`);
    expect(res.statusCode).toBe(201);

    const project: ProjectResponse = res.body;

    // check if the person can see the project
    const res2 = await request(app)
      .get(`/projects/${project.projectId}`)
      .set("Authorization", `Bearer ${applicationToken}`);
    expect(res2.statusCode).toBe(200);

    // check if the application can see the project in the list
    const res3 = await request(app)
      .get(`/projects/${project.projectId}`)
      .set("Authorization", `Bearer ${applicationToken}`);
    expect(res3.statusCode).toBe(200);
  });
});
