import { beforeAll, describe, expect, test } from "@jest/globals";
import request from "supertest";

import { app } from "../../app/app";
import { Tenancy, TenancyDocument } from "../../app/models/database/tenancy";
import { SignupRequest } from "../../app/models/types/authentications";
import { EventResponse, ProjectDiffRequest, ProjectResponse } from "../../app/models/types/projects";
import {
  becomeCollaborators,
  checkEventMatchesRequest,
  checkProjectMatchesRequest,
  CreateRandomEventRequest,
  CreateRandomProjectRequest,
  Person,
  SignupPerson,
} from "../utils/utils";

describe("End to end Project sharing", () => {
  let person1: Person;
  let person2: Person;
  let person3: Person;
  let publicTenant: TenancyDocument;
  let publicProject1: ProjectResponse;
  let publicProject2: ProjectResponse;

  beforeAll(async () => {
    person1 = new Person();
    person2 = new Person();
    person3 = new Person();
    publicTenant = await Tenancy.getPublicTenant();

    await SignupPerson(person1, app);
    await SignupPerson(person2, app);
    await SignupPerson(person3, app);
    // person 1 adds person 2 and back as a collaborator
    await becomeCollaborators(app, person1, person2);
    // person 1 adds person 3 and back as a collaborator
    await becomeCollaborators(app, person1, person3);
  });

  // test that no one can sign up with the company name of public-transparency-service
  test("user should not allow a user to sign up with the company name of public-transparency-service", async () => {
    const FirstPerson = new Person();

    const user_info: SignupRequest = {
      email: FirstPerson.email,
      companyName: "public-transparency-service",
      password: FirstPerson.password,
    };

    const res = await request(app).post("/user/signup").send(user_info);
    expect(res.statusCode).toBe(400);
  });

  test("user should not allow a user to create a private project with the public tenancy as a collaborator", async () => {
    const project_info = CreateRandomProjectRequest();
    project_info.collaborators = [publicTenant._id.toString()];

    const res = await request(app).post("/projects").set("Authorization", `Bearer ${person1.token}`).send(project_info);
    expect(res.statusCode).toBe(400);
  });

  test("user should not allow to modify a project to add the public tenancy as a collaborator", async () => {
    const project_info = CreateRandomProjectRequest();
    const res = await request(app).post("/projects").set("Authorization", `Bearer ${person1.token}`).send(project_info);
    expect(res.statusCode).toBe(201);

    const update_info: ProjectDiffRequest = {
      collaborators: [publicTenant._id.toString()],
    };

    const project_id = res.body.projectID;
    const res2 = await request(app)
      .patch(`/projects/${project_id}`)
      .set("Authorization", `Bearer ${person1.token}`)
      .send(update_info);
    expect(res2.statusCode).toBe(400);
  });

  test("unauthenticated people should be able to list the public projects", async () => {
    // create a public project
    const project_info = CreateRandomProjectRequest({ public_project: true });
    const res = await request(app).post("/projects").set("Authorization", `Bearer ${person1.token}`).send(project_info);
    expect(res.statusCode).toBe(201);

    checkProjectMatchesRequest(res.body, project_info);

    // list the public projects
    const res2 = await request(app).get("/public/projects");
    expect(res2.statusCode).toBe(200);
    expect(res2.body.length).toBe(1);

    checkProjectMatchesRequest(res2.body[0], project_info);

    // make a second public project
    const project_info2 = CreateRandomProjectRequest({ public_project: true });
    const res3 = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${person1.token}`)
      .send(project_info2);
    expect(res3.statusCode).toBe(201);
    checkProjectMatchesRequest(res3.body, project_info2);

    // list the public projects
    const res4 = await request(app).get("/public/projects");
    expect(res4.statusCode).toBe(200);
    expect(res4.body.length).toBe(2);

    publicProject1 = res.body;
    publicProject2 = res3.body;
  });

  // check if unauthenticated people can access the public projects by id
  test("unauthenticated people should be able to access the public projects by id", async () => {
    const res = await request(app).get(`/public/projects/${publicProject1.projectId}`);
    expect(res.statusCode).toBe(200);

    const res2 = await request(app).get(`/public/projects/${publicProject2.projectId}`);
    expect(res2.statusCode).toBe(200);
  });

  // check if unauthenticated people can view the events of a public project
  test("unauthenticated people should be able to view the events of a public project", async () => {
    // person 1 creates events on public project 1 and 2
    const event_info_1 = CreateRandomEventRequest();

    const res = await request(app)
      .post(`/projects/${publicProject1.projectId}/events`)
      .set("Authorization", `Bearer ${person1.token}`)
      .send(event_info_1);

    expect(res.statusCode).toBe(201);
    checkEventMatchesRequest(res.body, event_info_1);
    const event1: EventResponse = res.body;

    const event_info_2 = CreateRandomEventRequest();
    const res2 = await request(app)
      .post(`/projects/${publicProject2.projectId}/events`)
      .set("Authorization", `Bearer ${person1.token}`)
      .send(event_info_2);
    expect(res2.statusCode).toBe(201);
    checkEventMatchesRequest(res2.body, event_info_2);
    const event2: EventResponse = res2.body;

    // check now the projects are accessible by the public
    const res3 = await request(app).get(`/public/projects/${publicProject1.projectId}/events/${event1.eventId}`);
    expect(res3.statusCode).toBe(200);
    checkEventMatchesRequest(res3.body, event_info_1);

    const res4 = await request(app).get(`/public/projects/${publicProject2.projectId}/events/${event2.eventId}`);
    expect(res4.statusCode).toBe(200);
    checkEventMatchesRequest(res4.body, event_info_2);
  });

  test("unauthenticated people should be able to list the events of a public project", async () => {
    const res = await request(app).get(`/public/projects/${publicProject1.projectId}/events`);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(2);
  });

  test("unauthenticated people should not be able to access a private project", async () => {
    const project_info = CreateRandomProjectRequest();
    const res = await request(app).post("/projects").set("Authorization", `Bearer ${person1.token}`).send(project_info);
    expect(res.statusCode).toBe(201);
    checkProjectMatchesRequest(res.body, project_info);

    const res2 = await request(app).get(`/public/projects/${res.body.projectId}`);
    expect(res2.statusCode).toBe(404);
  });

  test("unauthenticated people should not be able to list the events of a private project", async () => {
    const project_info = CreateRandomProjectRequest();
    const res = await request(app).post("/projects").set("Authorization", `Bearer ${person1.token}`).send(project_info);
    expect(res.statusCode).toBe(201);
    checkProjectMatchesRequest(res.body, project_info);

    const res2 = await request(app).get(`/public/projects/${res.body.projectId}/events`);
    expect(res2.statusCode).toBe(404);
  });

  // make sure that the public cannot access the events of a private project
  test("unauthenticated people should not be able to access the events of a private project", async () => {
    const project_info = CreateRandomProjectRequest();
    const res = await request(app).post("/projects").set("Authorization", `Bearer ${person1.token}`).send(project_info);
    expect(res.statusCode).toBe(201);
    checkProjectMatchesRequest(res.body, project_info);

    const event_info = CreateRandomEventRequest();
    const res2 = await request(app)
      .post(`/projects/${res.body.projectId}/events`)
      .set("Authorization", `Bearer ${person1.token}`)
      .send(event_info);
    expect(res2.statusCode).toBe(201);
    checkEventMatchesRequest(res2.body, event_info);

    const res3 = await request(app).get(`/public/projects/${res.body.projectId}/events/${res2.body.eventId}`);
    expect(res3.statusCode).toBe(404);
  });

  test("check if collaborators be added to a public project and interact with it", async () => {
    // add person 2 to public project 1
    const updateProjectInfo: ProjectDiffRequest = {
      collaborators: [person2.token_info.tenancyId.toString()],
    };

    const res = await request(app)
      .patch(`/projects/${publicProject1.projectId}`)
      .set("Authorization", `Bearer ${person1.token}`)
      .send(updateProjectInfo);
    expect(res.statusCode).toBe(200);

    // person 2 should be able to see the project
    const res2 = await request(app).get(`/public/projects/${publicProject1.projectId}`);
    expect(res2.statusCode).toBe(200);

    // person 2 should be able to see the public view of the project
    const res3 = await request(app).get(`/public/projects/${publicProject1.projectId}`);
    expect(res3.statusCode).toBe(200);

    // person 2 should be able to add events to the project
    const event_info = CreateRandomEventRequest();
    const res4 = await request(app)
      .post(`/projects/${publicProject1.projectId}/events`)
      .set("Authorization", `Bearer ${person2.token}`)
      .send(event_info);
    expect(res4.statusCode).toBe(201);

    // the public should be able to access the new event
    const res5 = await request(app).get(`/public/projects/${publicProject1.projectId}/events/${res4.body.eventId}`);
    expect(res5.statusCode).toBe(200);
  });
});
