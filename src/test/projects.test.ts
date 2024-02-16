/* Tests that cover the Projects Endpoint */
import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";

import { app } from "../app/app";
import { EventResponse, ProjectDiffRequest, ProjectDiffResponse, ProjectResponse } from "../app/models/types/projects";
import { connectToDatabase } from "../app/utils/utils";
import { CreateOverrideDiff, CreateRandomEvent, CreateRandomProject, Person, SignupPerson } from "./utils";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  connectToDatabase(uri);
});

// Describe positive tests
describe("Positive Tests", () => {
  const personInfo = new Person();
  let personToken: string;
  const FirstProjectinfo = CreateRandomProject();
  let firstProjectID: string;
  let firstEventID: string;

  beforeAll(async () => {
    personToken = await SignupPerson(personInfo, app);
  });

  test("Create a new project in tenancy responds 201", async () => {
    const res = await request(app)
      .post("/projects")
      .send(FirstProjectinfo)
      .set("Authorization", `Bearer ${personToken}`);
    expect(res.statusCode).toBe(201);

    // check that the response body matches the project response type
    const res_body = res.body as ProjectResponse;
    expect(res_body).toHaveProperty("projectId");
    expect(res_body).toHaveProperty("projectName", FirstProjectinfo.projectName);
    expect(res_body).toHaveProperty("startedDate");
    expect(res_body).toHaveProperty("customMetaData");
    expect(res_body).toHaveProperty("projectDescription", FirstProjectinfo.projectDescription);
    expect(res_body).toHaveProperty("projectStatus", "ACTIVE");

    firstProjectID = res_body.projectId;
  });

  test("Fetching all projects in tenancy responds 200 ", async () => {
    const res = await request(app).get("/projects").set("Authorization", `Bearer ${personToken}`);
    expect(res.statusCode).toBe(200);
    const res_bodies = res.body as ProjectResponse[];
    expect(res_bodies.length).toBeGreaterThan(0);

    // check that the response body matches the project response type
    const res_body = res_bodies[0];
    expect(res_body).toHaveProperty("projectId", firstProjectID);
    expect(res_body).toHaveProperty("projectName", FirstProjectinfo.projectName);
    expect(res_body).toHaveProperty("startedDate");
    expect(res_body).toHaveProperty("customMetaData");
    expect(res_body).toHaveProperty("projectDescription", FirstProjectinfo.projectDescription);
    expect(res_body).toHaveProperty("projectStatus", "ACTIVE");
  });

  test("Fetching a project by ID responds 200", async () => {
    const res = await request(app).get(`/Projects/${firstProjectID}`).set("Authorization", `Bearer ${personToken}`);
    expect(res.statusCode).toBe(200);
    const res_body = res.body as ProjectResponse;
    expect(res_body).toHaveProperty("projectId", firstProjectID);
    expect(res_body).toHaveProperty("projectName", FirstProjectinfo.projectName);
    expect(res_body).toHaveProperty("startedDate");
    expect(res_body).toHaveProperty("customMetaData");
    expect(res_body).toHaveProperty("projectDescription", FirstProjectinfo.projectDescription);
    expect(res_body).toHaveProperty("projectStatus", "ACTIVE");
  });

  test("Updating a project by ID responds 200", async () => {
    // create new project to avoid test interference
    const newProjectInfo = CreateRandomProject();
    const res = await request(app).post("/projects").send(newProjectInfo).set("Authorization", `Bearer ${personToken}`);

    expect(res.statusCode).toBe(201);

    const body = res.body as ProjectResponse;
    const ProjectID = body.projectId;

    // generate the override Diff
    const diff = CreateOverrideDiff(res.body);
    const res2 = await request(app)
      .patch(`/Projects/${ProjectID}`)
      .send(diff)
      .set("Authorization", `Bearer ${personToken}`);

    expect(res2.statusCode).toBe(200);
    const res_body = res2.body as ProjectDiffResponse;

    // check that the response body matches the diff
    expect(res_body.projectName).toHaveProperty("new", diff.projectName);
    expect(res_body.projectName).toHaveProperty("old", newProjectInfo.projectName);

    // Compare projectDescription
    expect(res_body.projectDescription).toHaveProperty("new", diff.projectDescription);
    expect(res_body.projectDescription).toHaveProperty("old", newProjectInfo.projectDescription);

    // get the updated project response
    const res3 = await request(app).get(`/Projects/${ProjectID}`).set("Authorization", `Bearer ${personToken}`);

    const updated_res_body = res3.body as ProjectResponse;

    // Compare customMetaData by strifigying it with JSON
    expect(JSON.stringify(updated_res_body.customMetaData)).toBe(JSON.stringify(diff.customMetaData));
  });

  test("deleting a project result in a 405 response", async () => {
    const res = await request(app).delete(`/Projects/${firstProjectID}`).set("Authorization", `Bearer ${personToken}`);
    expect(res.statusCode).toBe(405);
  });

  test("Creating a new event for a project responds 200", async () => {
    const eventinfo = CreateRandomEvent();
    const res = await request(app)
      .post(`/Projects/${firstProjectID}/events`)
      .send(eventinfo)
      .set("Authorization", `Bearer ${personToken}`);
    expect(res.statusCode).toBe(201);

    // check that the response body matches the event response type
    const res_body = res.body as EventResponse;
    expect(res_body).toHaveProperty("eventId");
    expect(res_body).toHaveProperty("eventName", eventinfo.eventName);
    expect(res_body).toHaveProperty("eventDate");
    expect(res_body).toHaveProperty("eventType", eventinfo.eventType);
    expect(res_body).toHaveProperty("customMetaData");

    firstEventID = res_body.eventId;
  });

  test("deleting an event results in a 405 response", async () => {
    const res = await request(app)
      .delete(`/Projects/${firstProjectID}/events/${firstEventID}`)
      .set("Authorization", `Bearer ${personToken}`);
    expect(res.statusCode).toBe(405);
  });

  test("Fetching all events for a project responds 200", async () => {
    const res = await request(app)
      .get(`/Projects/${firstProjectID}/events`)
      .set("Authorization", `Bearer ${personToken}`);
    expect(res.statusCode).toBe(200);
    const res_bodies = res.body as EventResponse[];
    expect(res_bodies.length).toBeGreaterThan(0);

    // check that the response body matches the event response type
    const res_body = res_bodies[0];
    expect(res_body).toHaveProperty("eventId", firstEventID);
    expect(res_body).toHaveProperty("eventName");
    expect(res_body).toHaveProperty("eventDate");
    expect(res_body).toHaveProperty("eventType");
    expect(res_body).toHaveProperty("customMetaData");
  });

  // Fetch Event by ID
  test("Fetching an event by ID responds 200", async () => {
    const res = await request(app)
      .get(`/Projects/${firstProjectID}/events/${firstEventID}`)
      .set("Authorization", `Bearer ${personToken}`);
    console.log(res.body.message);
    expect(res.statusCode).toBe(200);
    const res_body = res.body as EventResponse;
    expect(res_body).toHaveProperty("eventId", firstEventID);
    expect(res_body).toHaveProperty("eventName");
    expect(res_body).toHaveProperty("eventDate");
    expect(res_body).toHaveProperty("eventType");
    expect(res_body).toHaveProperty("customMetaData");
  });

  test("Fetching all projects for an empty tenant responds 200", async () => {
    const person = new Person();
    const token = await SignupPerson(person, app);
    const res = await request(app).get("/projects").set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    const res_bodies = res.body as ProjectResponse[];
    expect(res_bodies.length).toBe(0);
  });

  test("Fetching all events for an empty project responds 200", async () => {
    const person = new Person();
    const token = await SignupPerson(person, app);

    const projectinfo = CreateRandomProject();
    const res = await request(app).post("/projects").send(projectinfo).set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(201);

    // get the events from the project
    const res2 = await request(app)
      .get(`/Projects/${res.body.projectId}/events`)
      .set("Authorization", `Bearer ${token}`);
    expect(res2.statusCode).toBe(200);
    const res_bodies = res2.body as EventResponse[];
    expect(res_bodies.length).toBe(0);
  });

  test("Set project status to INACTIVE responds 200", async () => {
    const diff: ProjectDiffRequest = { projectStatus: "INACTIVE" };
    const res = await request(app)
      .patch(`/Projects/${firstProjectID}`)
      .send(diff)
      .set("Authorization", `Bearer ${personToken}`);
    expect(res.statusCode).toBe(200);
    const res_body = res.body as ProjectDiffResponse;
    expect(res_body.projectStatus).toHaveProperty("new", "INACTIVE");

    // get the updated project response
    const res2 = await request(app).get(`/Projects/${firstProjectID}`).set("Authorization", `Bearer ${personToken}`);
    expect(res2.statusCode).toBe(200);

    const updated_res_body = res2.body as ProjectResponse;

    // Compare projectStatus
    expect(updated_res_body).toHaveProperty("projectStatus", "INACTIVE");
  });

  test("Create a new event for an INACTIVE project responds 400", async () => {
    const eventinfo = CreateRandomEvent();
    const res = await request(app)
      .post(`/Projects/${firstProjectID}/events`)
      .send(eventinfo)
      .set("Authorization", `Bearer ${personToken}`);
    expect(res.statusCode).toBe(400);
  });

  test("Set project status to ACTIVE allows new events to be created", async () => {
    const diff: ProjectDiffRequest = { projectStatus: "ACTIVE" };
    const res = await request(app)
      .patch(`/Projects/${firstProjectID}`)
      .send(diff)
      .set("Authorization", `Bearer ${personToken}`);
    expect(res.statusCode).toBe(200);

    const res_body = res.body as ProjectDiffResponse;
    expect(res_body.projectStatus).toHaveProperty("new", "ACTIVE");

    // get the updated project response
    const res2 = await request(app).get(`/Projects/${firstProjectID}`).set("Authorization", `Bearer ${personToken}`);
    expect(res2.statusCode).toBe(200);

    const updated_res_body = res2.body as ProjectResponse;

    expect(updated_res_body).toHaveProperty("projectStatus", "ACTIVE");

    const eventinfo = CreateRandomEvent();
    const res3 = await request(app)
      .post(`/Projects/${firstProjectID}/events`)
      .send(eventinfo)
      .set("Authorization", `Bearer ${personToken}`);
    expect(res3.statusCode).toBe(201);
  });
});

// Describe project input Validation tests
describe("Project Input Validation", () => {
  test("Create a new project with missing projectName should respond with 400", async () => {
    const projectinfo = {
      projectDescription: "This is a project",
    };
    const person = new Person();
    const token = await SignupPerson(person, app);
    const res = await request(app).post("/projects").send(projectinfo).set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Project Name is required");
  });
  
  test("patching an inactive project should respond with 400", async () => {
    const projectinfo = CreateRandomProject();
    const person = new Person();
    const token = await SignupPerson(person, app);
    const res = await request(app).post("/projects").send(projectinfo).set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(201);
    
    const diff = {
      projectStatus: "INACTIVE",
    };
    const res2 = await request(app)
      .patch(`/Projects/${res.body.projectId}`)
      .send(diff)
      .set("Authorization", `Bearer ${token}`);
    expect(res2.statusCode).toBe(200);
    
    // Try Patching the project without setting it to ACTIVE
    const diff2 = {
      projectDescription: "This is a project",
    };
    const res3 = await request(app)
      .patch(`/Projects/${res.body.projectId}`)
      .send(diff2)
      .set("Authorization", `Bearer ${token}`);
      
    expect(res3.statusCode).toBe(400);
    
  })
    

  test("Create a new project with missing projectDescription should respond with 400", async () => {
    const projectinfo = {
      projectName: "Project",
    };
    const person = new Person();
    const token = await SignupPerson(person, app);
    const res = await request(app).post("/projects").send(projectinfo).set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Project Description is required");
  });

  test("Create a new project with non string value in customMetaData should respond with 400", async () => {
    const projectinfo = {
      projectName: "Project",
      projectDescription: "This is a project",
      customMetaData: {
        key1: 1,
        key2: "value2",
      },
    };
    const person = new Person();
    const token = await SignupPerson(person, app);
    const res = await request(app).post("/projects").send(projectinfo).set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Custom Meta should be a string to string map");
  });

  test("updating a project with non string value in customMetaData should respond with 400", async () => {
    const projectinfo = CreateRandomProject();
    const person = new Person();
    const token = await SignupPerson(person, app);
    const res = await request(app).post("/projects").send(projectinfo).set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(201);

    const diff = {
      customMetaData: {
        key1: 1,
        key2: "value2",
      },
    };
    const res2 = await request(app)
      .patch(`/Projects/${res.body.projectId}`)
      .send(diff)
      .set("Authorization", `Bearer ${token}`);
    expect(res2.statusCode).toBe(400);
    expect(res2.body.message).toBe("Custom Meta should be a string to string map");
  });

  test("Get project with Non UUID project ID Paramater should respond with 400", async () => {
    const person = new Person();
    const token = await SignupPerson(person, app);
    const res = await request(app).get(`/Projects/123`).set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("A valid project ID is required");
  });

  test("Get project with non-existing project ID Paramater should respond with 404", async () => {
    const person = new Person();
    const token = await SignupPerson(person, app);
    const id = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/Projects/${id}`).set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Project not found");
  });

  test("Get project from a different tenant should respond with 404", async () => {
    const person = new Person();
    const token = await SignupPerson(person, app);
    const res = await request(app)
      .post("/projects")
      .send(CreateRandomProject())
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(201);

    const person2 = new Person();
    const token2 = await SignupPerson(person2, app);
    const res2 = await request(app).get(`/Projects/${res.body.projectId}`).set("Authorization", `Bearer ${token2}`);
    expect(res2.statusCode).toBe(404);
    expect(res2.body.message).toBe("Project not found");
  });

  test("Get event with Non UUID project ID Paramater should respond with 400", async () => {
    const person = new Person();
    const token = await SignupPerson(person, app);
    const projectinfo = CreateRandomProject();
    const res = await request(app).post("/projects").send(projectinfo).set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(201);

    const res2 = await request(app)
      .get(`/Projects/${res.body.projectId}/events/123`)
      .set("Authorization", `Bearer ${token}`);
    expect(res2.statusCode).toBe(400);
    console.log(res2.body);
    expect(res2.body.message).toBe("A valid event ID is required");
  });

  test("Get event with non-existing event ID Paramater should respond with 404", async () => {
    const person = new Person();
    const token = await SignupPerson(person, app);
    const projectinfo = CreateRandomProject();
    const res = await request(app).post("/projects").send(projectinfo).set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(201);

    const res2 = await request(app)
      .get(`/Projects/${res.body.projectId}/events/${new mongoose.Types.ObjectId()}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res2.statusCode).toBe(404);
    expect(res2.body.message).toBe("Event not found");
  });

  //      Test 12 - Getting a event from a different tenant should respond with 404
  
  test("Get event from a different project on same tenancy should respond with 404", async () => {
    const person = new Person();
    const token = await SignupPerson(person, app);
    const projectinfo = CreateRandomProject();
    const res = await request(app).post("/projects").send(projectinfo).set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(201);
    
    // create event on project
    const eventinfo = CreateRandomEvent();
    const res2 = await request(app)
      .post(`/Projects/${res.body.projectId}/events`)
      .send(eventinfo)
      .set("Authorization", `Bearer ${token}`);
      expect(res2.statusCode).toBe(201);

    // Create second project
    const projectinfo2 = CreateRandomProject();
    const res3 = await request(app).post("/projects").send(projectinfo2).set("Authorization", `Bearer ${token}`);
    expect(res3.statusCode).toBe(201);
    
    // get event from second project
    const res4 = await request(app)
      .get(`/Projects/${res3.body.projectId}/events/${res2.body.eventId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res4.statusCode).toBe(404);
   
  })
  
  test("Get event from a different tenant should respond with 404", async () => {
    const person = new Person();
    const token = await SignupPerson(person, app);
    const projectinfo = CreateRandomProject();
    const res = await request(app).post("/projects").send(projectinfo).set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(201);
    
    // create event on project
    const eventinfo = CreateRandomEvent();
    const res2 = await request(app)
      .post(`/Projects/${res.body.projectId}/events`)
      .send(eventinfo)
      .set("Authorization", `Bearer ${token}`);
      expect(res2.statusCode).toBe(201);

    const person2 = new Person();
    const token2 = await SignupPerson(person2, app);
    const res3 = await request(app)
      .get(`/Projects/${res.body.projectId}/events/${res2.body.eventId}`)
      .set("Authorization", `Bearer ${token2}`);
    expect(res3.statusCode).toBe(404);
  });
    
    
  
});
// Desacribe Authentication tests
describe("Authentication Tests", () => {
  
  let realEventID: string;
  let realProjectID: string;
  
  beforeAll(async () => {
    const person = new Person();
    const token = await SignupPerson(person, app);
    const projectinfo = CreateRandomProject();
    const res = await request(app).post("/projects").send(projectinfo).set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(201);
    realProjectID = res.body.projectId;
    
    const eventinfo = CreateRandomEvent();
    const res2 = await request(app)
      .post(`/Projects/${realProjectID}/events`)
      .send(eventinfo)
      .set("Authorization", `Bearer ${token}`);
    
    realEventID = res2.body.eventId;
  })
  
  test("Create a new project without authentication should respond with 403", async () => {
    const projectinfo = CreateRandomProject();
    const res = await request(app).post("/projects").send(projectinfo);
    expect(res.statusCode).toBe(403);
  })

  test("Create a new event without authentication should respond with 403", async () => {
    const eventinfo = CreateRandomEvent();
    const res = await request(app)
      .post(`/Projects/${realProjectID}/events`)
      .send(eventinfo);
    expect(res.statusCode).toBe(403);
  })

  test("Update a project without authentication should respond with 403", async () => {
    const diff: ProjectDiffRequest = { projectStatus: "INACTIVE" };
    const res = await request(app)
      .patch(`/Projects/${realProjectID}`)
      .send(diff);
    expect(res.statusCode).toBe(403);
  })
  
  test("Fetch all projects without authentication should respond with 403", async () => {
    const res = await request(app).get("/projects");
    expect(res.statusCode).toBe(403);
  })
  
  test("Get a event without authentication should respond with 403", async () => {
    const res = await request(app)
      .get(`/Projects/${realProjectID}/events/${realEventID}`);
    expect(res.statusCode).toBe(403);
  })
  
})




afterAll(async () => {
  await mongo.stop();
});
