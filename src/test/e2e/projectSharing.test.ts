import { beforeAll, describe, expect, test } from "@jest/globals";
import request from "supertest";

import { app } from "../../app/app";
import {
  EventResponse,
  ProjectDiffRequest,
  ProjectDiffResponse,
  ProjectResponse,
} from "../../app/models/types/projects";
import { CreateRandomEventRequest, CreateRandomProjectRequest, Person, SignupPerson } from "../utils/utils";
import { checkEventMatchesRequest } from "../utils/utils";
import { checkProjectMatchesRequest } from "../utils/utils";
import { checkCollaborators } from "../utils/utils";
import { becomeCollaborators } from "../utils/utils";

describe("End to end Project sharing", () => {
  let person1: Person;
  let person2: Person;
  let person3: Person;
  let project: ProjectResponse;
  let missingEvent: EventResponse;

  beforeAll(async () => {
    person1 = new Person();
    person2 = new Person();
    person3 = new Person();

    await SignupPerson(person1, app);
    await SignupPerson(person2, app);
    await SignupPerson(person3, app);
    // person 1 adds person 2 and back as a collaborator
    await becomeCollaborators(app, person1, person2);
    // person 1 adds person 3 and back as a collaborator
    await becomeCollaborators(app, person1, person3);
  });

  // User creates a project with an active collaborator, project should appear in both users project list

  test("User creates a project with an active collaborator, project should appear in both users project list", async () => {
    // person 1 creates a project
    const project_info = CreateRandomProjectRequest();
    // update project info to add person 2 and three
    project_info.collaborators = [person2.token_info.tenancyId.toString()];

    // create the project
    const res = await request(app).post("/projects").set("Authorization", `Bearer ${person1.token}`).send(project_info);
    expect(res.statusCode).toBe(201);
    checkProjectMatchesRequest(res.body as ProjectResponse, project_info);
    project = res.body;

    // see if the creator can get the project
    const res2 = await request(app)
      .get(`/projects/${project.projectId}`)
      .set("Authorization", `Bearer ${person1.token}`);
    expect(res2.statusCode).toBe(200);
    checkProjectMatchesRequest(res2.body as ProjectResponse, project_info);

    // check person 2
    const res3 = await request(app)
      .get(`/projects/${project.projectId}`)
      .set("Authorization", `Bearer ${person2.token}`);
    expect(res3.statusCode).toBe(200);
    checkProjectMatchesRequest(res3.body as ProjectResponse, project_info);
  });

  test("Project Owner posts an event to project, event should appear in both users event lists", async () => {
    const event_info = CreateRandomEventRequest();
    const res1 = await request(app)
      .post(`/projects/${project.projectId}/events`)
      .set("Authorization", `Bearer ${person1.token}`)
      .send(event_info);
    expect(res1.statusCode).toBe(201);
    const event = res1.body as EventResponse;
    checkEventMatchesRequest(event, event_info);

    // check person 1
    const res2 = await request(app)
      .get(`/projects/${project.projectId}/events/${event.eventId}`)
      .set("Authorization", `Bearer ${person1.token}`);
    expect(res2.statusCode).toBe(200);
    checkEventMatchesRequest(res2.body as EventResponse, event_info);

    // check person 2
    const res3 = await request(app)
      .get(`/projects/${project.projectId}/events/${event.eventId}`)
      .set("Authorization", `Bearer ${person2.token}`);
    expect(res3.statusCode).toBe(200);
    checkEventMatchesRequest(res3.body as EventResponse, event_info);

    // check person 3
    const res4 = await request(app)
      .get(`/projects/${project.projectId}/events/${event.eventId}`)
      .set("Authorization", `Bearer ${person3.token}`);
    expect(res4.statusCode).toBe(404);
  });

  test("Project Owner updates project details, including an additional collaborator, changes should be reflected in both users project list", async () => {
    // get the project in its current state
    const res = await request(app)
      .get(`/projects/${project.projectId}`)
      .set("Authorization", `Bearer ${person1.token}`);
    expect(res.statusCode).toBe(200);
    const project_info = res.body as ProjectResponse;

    // get the collaborators field of the project and append person 3 to it
    const collaborators = [person2.token_info.tenancyId.toString(), person3.token_info.tenancyId.toString()];

    // create the diff request
    const diff_request: ProjectDiffRequest = { collaborators: collaborators };
    // patch the project
    const res2 = await request(app)
      .patch(`/projects/${project_info.projectId}`)
      .set("Authorization", `Bearer ${person1.token}`)
      .send(diff_request);
    expect(res2.statusCode).toBe(200);
    const body: ProjectDiffResponse = res2.body;
    expect(body).toHaveProperty("ProjectCollaborators");
    expect(body.ProjectCollaborators).toHaveProperty("new", collaborators);

    // check person 2
    const res3 = await request(app)
      .get(`/projects/${project_info.projectId}`)
      .set("Authorization", `Bearer ${person2.token}`);
    expect(res3.statusCode).toBe(200);
    checkCollaborators(res3.body as ProjectResponse, collaborators);

    // check person 3
    const res4 = await request(app)
      .get(`/projects/${project_info.projectId}`)
      .set("Authorization", `Bearer ${person3.token}`);
    expect(res4.statusCode).toBe(200);
    checkCollaborators(res4.body as ProjectResponse, collaborators);
  });

  test("Project Owner Posts an event to project, event should appear in both users event lists", async () => {
    const event_info = CreateRandomEventRequest();
    const res1 = await request(app)
      .post(`/projects/${project.projectId}/events`)
      .set("Authorization", `Bearer ${person1.token}`)
      .send(event_info);
    expect(res1.statusCode).toBe(201);
    const event = res1.body as EventResponse;
    checkEventMatchesRequest(event, event_info);

    // check person 1
    const res2 = await request(app)
      .get(`/projects/${project.projectId}/events/${event.eventId}`)
      .set("Authorization", `Bearer ${person1.token}`);
    expect(res2.statusCode).toBe(200);
    checkEventMatchesRequest(res2.body as EventResponse, event_info);

    // check person 2
    const res3 = await request(app)
      .get(`/projects/${project.projectId}/events/${event.eventId}`)
      .set("Authorization", `Bearer ${person2.token}`);
    expect(res3.statusCode).toBe(200);
    checkEventMatchesRequest(res3.body as EventResponse, event_info);

    // check person 3
    const res4 = await request(app)
      .get(`/projects/${project.projectId}/events/${event.eventId}`)
      .set("Authorization", `Bearer ${person3.token}`);
    expect(res4.statusCode).toBe(200);
    checkEventMatchesRequest(res4.body as EventResponse, event_info);
  });

  test("project collaborator posts an event to project, event should appear in both users event lists", async () => {
    const event_info = CreateRandomEventRequest();
    const res1 = await request(app)
      .post(`/projects/${project.projectId}/events`)
      .set("Authorization", `Bearer ${person2.token}`)
      .send(event_info);
    expect(res1.statusCode).toBe(201);
    const event = res1.body as EventResponse;
    checkEventMatchesRequest(event, event_info);

    // check person 2
    const res2 = await request(app)
      .get(`/projects/${project.projectId}/events/${event.eventId}`)
      .set("Authorization", `Bearer ${person2.token}`);
    expect(res2.statusCode).toBe(200);
    checkEventMatchesRequest(res2.body as EventResponse, event_info);

    // check person 1
    const res3 = await request(app)
      .get(`/projects/${project.projectId}/events/${event.eventId}`)
      .set("Authorization", `Bearer ${person1.token}`);
    expect(res3.statusCode).toBe(200);
    checkEventMatchesRequest(res3.body as EventResponse, event_info);

    // check person 3
    const res4 = await request(app)
      .get(`/projects/${project.projectId}/events/${event.eventId}`)
      .set("Authorization", `Bearer ${person3.token}`);
    expect(res4.statusCode).toBe(200);
    checkEventMatchesRequest(res4.body as EventResponse, event_info);
  });

  // Project Owner Removes collaborator, Project should still be visible to other
  test("Project Owner Removes collaborator from project, Project should still be visible to both", async () => {
    const collaborators = [person2.token_info.tenancyId.toString()];
    const diff_request: ProjectDiffRequest = { collaborators: collaborators };

    // patch the project
    const res = await request(app)
      .patch(`/projects/${project.projectId}`)
      .set("Authorization", `Bearer ${person1.token}`)
      .send(diff_request);
    expect(res.statusCode).toBe(200);

    // check person 1 is still able to see the project
    const res2 = await request(app)
      .get(`/projects/${project.projectId}`)
      .set("Authorization", `Bearer ${person1.token}`);
    expect(res2.statusCode).toBe(200);

    checkCollaborators(res2.body as ProjectResponse, collaborators);

    // check person 2
    const res3 = await request(app)
      .get(`/projects/${project.projectId}`)
      .set("Authorization", `Bearer ${person2.token}`);
    expect(res3.statusCode).toBe(200);
    checkCollaborators(res3.body as ProjectResponse, collaborators);

    // check person 3
    const res4 = await request(app)
      .get(`/projects/${project.projectId}`)
      .set("Authorization", `Bearer ${person3.token}`);
    expect(res4.statusCode).toBe(200);
    // person 1 should see the the they are removed as a collaborator
    checkCollaborators(res4.body as ProjectResponse, collaborators);
  });

  test("Project owner Adds event to project, event should only appear in project person 1 and person 2's event list", async () => {
    const event_info = CreateRandomEventRequest();
    const res = await request(app)
      .post(`/projects/${project.projectId}/events`)
      .set("Authorization", `Bearer ${person1.token}`)
      .send(event_info);
    expect(res.statusCode).toBe(201);
    const event = res.body as EventResponse;
    checkEventMatchesRequest(event, event_info);

    // check person 2
    const res2 = await request(app)
      .get(`/projects/${project.projectId}/events/${event.eventId}`)
      .set("Authorization", `Bearer ${person2.token}`);
    expect(res2.statusCode).toBe(200);
    checkEventMatchesRequest(res2.body as EventResponse, event_info);

    // check person 3
    const res3 = await request(app)
      .get(`/projects/${project.projectId}/events/${event.eventId}`)
      .set("Authorization", `Bearer ${person3.token}`);

    expect(res3.statusCode).toBe(404);

    missingEvent = event;
  });

  test("Removed Collaborator tries to add event to project should be rejected", async () => {
    const event_info = CreateRandomEventRequest();
    const res = await request(app)
      .post(`/projects/${project.projectId}/events`)
      .set("Authorization", `Bearer ${person3.token}`)
      .send(event_info);

    expect(res.statusCode).toBe(400);
  });

  test("Project owner adds collaborator back, previous event should not be shared with the collaborator", async () => {
    const collaborators = [person2.token_info.tenancyId.toString(), person3.token_info.tenancyId.toString()];

    const diff_request: ProjectDiffRequest = { collaborators: collaborators };

    // patch the project
    const res = await request(app)
      .patch(`/projects/${project.projectId}`)
      .set("Authorization", `Bearer ${person1.token}`)
      .send(diff_request);
    expect(res.statusCode).toBe(200);

    // check person 2
    const res2 = await request(app)
      .get(`/projects/${project.projectId}`)
      .set("Authorization", `Bearer ${person2.token}`);
    expect(res2.statusCode).toBe(200);
    checkCollaborators(res2.body as ProjectResponse, collaborators);

    // check person 3
    const res3 = await request(app)
      .get(`/projects/${project.projectId}`)
      .set("Authorization", `Bearer ${person3.token}`);
    expect(res3.statusCode).toBe(200);
    checkCollaborators(res3.body as ProjectResponse, collaborators);

    // check that that event that was previously added is not visible to person 3
    const res4 = await request(app)
      .get(`/projects/${project.projectId}/events/${missingEvent.eventId}`)
      .set("Authorization", `Bearer ${person3.token}`);
    expect(res4.statusCode).toBe(404);
  });

  test("Collaborator who has been re-added to project adds an event, event should appear in both users event lists", async () => {
    const event_info = CreateRandomEventRequest();
    const res = await request(app)
      .post(`/projects/${project.projectId}/events`)
      .set("Authorization", `Bearer ${person3.token}`)
      .send(event_info);
    expect(res.statusCode).toBe(201);

    const event = res.body as EventResponse;
    checkEventMatchesRequest(event, event_info);

    // check person 1
    const res2 = await request(app)
      .get(`/projects/${project.projectId}/events/${event.eventId}`)
      .set("Authorization", `Bearer ${person1.token}`);
    expect(res2.statusCode).toBe(200);
    checkEventMatchesRequest(res2.body as EventResponse, event_info);

    // check person 2
    const res3 = await request(app)
      .get(`/projects/${project.projectId}/events/${event.eventId}`)
      .set("Authorization", `Bearer ${person2.token}`);
    expect(res3.statusCode).toBe(200);
    checkEventMatchesRequest(res3.body as EventResponse, event_info);

    // check person 3
    const res4 = await request(app)
      .get(`/projects/${project.projectId}/events/${event.eventId}`)
      .set("Authorization", `Bearer ${person3.token}`);
    expect(res4.statusCode).toBe(200);
    checkEventMatchesRequest(res4.body as EventResponse, event_info);

    // check list events lengths for all users
    const res5 = await request(app)
      .get(`/projects/${project.projectId}/events`)
      .set("Authorization", `Bearer ${person1.token}`);
    expect(res5.statusCode).toBe(200);
    expect((res5.body as EventResponse[]).length).toBe(5);

    const res6 = await request(app)
      .get(`/projects/${project.projectId}/events`)
      .set("Authorization", `Bearer ${person2.token}`);
    expect(res6.statusCode).toBe(200);

    expect((res6.body as EventResponse[]).length).toBe(5);

    const res7 = await request(app)
      .get(`/projects/${project.projectId}/events`)
      .set("Authorization", `Bearer ${person3.token}`);
    expect(res7.statusCode).toBe(200);
    expect((res7.body as EventResponse[]).length).toBe(3);
  });
});

describe("Input Validation for collaborators", () => {
  let person1: Person;
  let person2: Person;
  let PendingPerson: Person;
  let NoRelationshipPerson: Person;
  let project: ProjectResponse;

  beforeAll(async () => {
    person1 = new Person();
    person2 = new Person();
    PendingPerson = new Person();
    NoRelationshipPerson = new Person();

    await SignupPerson(person1, app);
    await SignupPerson(person2, app);
    await SignupPerson(PendingPerson, app);
    await SignupPerson(NoRelationshipPerson, app);

    // person 1 adds person 2 and back as a collaborator
    await becomeCollaborators(app, person1, person2);
    // person pending relationship
    await becomeCollaborators(app, person1, PendingPerson, true);

    // setup project between person 1 and person 2
    const project_info = CreateRandomProjectRequest();
    project_info.collaborators = [person2.token_info.tenancyId.toString()];
    const res = await request(app).post("/projects").set("Authorization", `Bearer ${person1.token}`).send(project_info);
    expect(res.statusCode).toBe(201);

    // check that person 2 can see the project
    const res2 = await request(app)
      .get(`/projects/${res.body.projectId}`)
      .set("Authorization", `Bearer ${person2.token}`);
    expect(res2.statusCode).toBe(200);

    project = res.body as ProjectResponse;
  });

  // Project owner Tries to add a collaborator with no relationship, should be denied
  test("Project owner Tries to add a collaborator with no relationship to project, should be denied", async () => {
    const project_patch: ProjectDiffRequest = {
      collaborators: [person2.token_info.tenancyId.toString(), NoRelationshipPerson.token_info.tenancyId.toString()],
    };

    const res = await request(app)
      .patch(`/projects/${project.projectId}`)
      .set("Authorization", `Bearer ${person1.token}`)
      .send(project_patch);

    expect(res.statusCode).toBe(400);

    // make sure that the project has not been updated
    const res2 = await request(app)
      .get(`/projects/${project.projectId}`)
      .set("Authorization", `Bearer ${person1.token}`);
    expect(res2.statusCode).toBe(200);
    checkCollaborators(res2.body as ProjectResponse, [person2.token_info.tenancyId.toString()]);

    // make sure the person with no relationship can't see the project
    const res3 = await request(app)
      .get(`/projects/${project.projectId}`)
      .set("Authorization", `Bearer ${NoRelationshipPerson.token}`);
    expect(res3.statusCode).toBe(404);
  });

  // Project owner to add a collaborator with a Pending relationship, should be denied
  test("Project owner to add a collaborator with a Pending relationship, should be denied", async () => {
    const project_patch: ProjectDiffRequest = {
      collaborators: [person2.token_info.tenancyId.toString(), PendingPerson.token_info.tenancyId.toString()],
    };

    const res = await request(app)
      .patch(`/projects/${project.projectId}`)
      .set("Authorization", `Bearer ${person1.token}`)
      .send(project_patch);

    expect(res.statusCode).toBe(400);

    // make sure that the project has not been updated
    const res2 = await request(app)
      .get(`/projects/${project.projectId}`)
      .set("Authorization", `Bearer ${person1.token}`);
    expect(res2.statusCode).toBe(200);
    checkCollaborators(res2.body as ProjectResponse, [person2.token_info.tenancyId.toString()]);

    // make sure the person with no relationship can't see the project
    const res3 = await request(app)
      .get(`/projects/${project.projectId}`)
      .set("Authorization", `Bearer ${PendingPerson.token}`);
    expect(res3.statusCode).toBe(404);
  });

  // Collaborator tries to update project details, should be denied
  test("Collaborator tries to update project details, should be denied", async () => {
    const diff_request: ProjectDiffRequest = { projectName: "New Name" };
    const res = await request(app)
      .patch(`/projects/${project.projectId}`)
      .set("Authorization", `Bearer ${person2.token}`)
      .send(diff_request);
    expect(res.statusCode).toBe(400);
  });

  // Project owner tries to remove relationship with a collaborator that is still part of a project, should be denied
  test("Project owner tries to remove relationship with a collaborator that is still part of a project, should be denied", async () => {
    const removeRequest = await request(app)
      .delete(`/collaborators/${person2.token_info.tenancyId}`)
      .set("Authorization", `Bearer ${person1.token}`);
    expect(removeRequest.statusCode).toBe(400);
  });

  // collaborator tries to remove relationship with a project owner, should be denied
  test("collaborator tries to remove relationship with a project owner, should be denied", async () => {
    const removeRequest = await request(app)
      .delete(`/collaborators/${person1.token_info.tenancyId}`)
      .set("Authorization", `Bearer ${person2.token}`);
    expect(removeRequest.statusCode).toBe(400);
  });

  test("Owner removes collaborator from project, and then is able to remove the relationship", async () => {
    const collaborators: ProjectDiffRequest = { collaborators: [] };
    const res = await request(app)
      .patch(`/projects/${project.projectId}`)
      .set("Authorization", `Bearer ${person1.token}`)
      .send(collaborators);
    expect(res.statusCode).toBe(200);

    // check that the project has been updated
    const res2 = await request(app)
      .get(`/projects/${project.projectId}`)
      .set("Authorization", `Bearer ${person1.token}`);
    expect(res2.statusCode).toBe(200);
    checkCollaborators(res2.body as ProjectResponse, []);

    // person 1 removes person 2
    const removeRequest = await request(app)
      .delete(`/collaborators/${person2.token_info.tenancyId}`)
      .set("Authorization", `Bearer ${person1.token}`);

    expect(removeRequest.statusCode).toBe(200);
  });

  test("Collaborator tries to remove relationship with a project owner, after being removed from project, should succeed", async () => {
    const removeRequest = await request(app)
      .delete(`/collaborators/${person1.token_info.tenancyId}`)
      .set("Authorization", `Bearer ${person2.token}`);
    expect(removeRequest.statusCode).toBe(200);
  });
});
