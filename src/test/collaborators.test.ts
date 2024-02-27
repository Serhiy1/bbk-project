/* eslint-disable @typescript-eslint/no-unused-vars */
/* Tests that cover the Projects Endpoint */
import { de, faker } from "@faker-js/faker";
import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";

import { app } from "../app/app";
import { Tenancy } from "../app/models/database/tenancy";
import { collaboratorsRequest } from "../app/models/types/collaborators";
import { connectToDatabase } from "../app/utils/utils";
import { Person, SignupPerson } from "./utils";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  connectToDatabase(uri);
});

describe(" Collaborators workflow", () => {
  let person1: Person;
  let person2: Person;
  let person3: Person;

  beforeAll(async () => {
    person1 = new Person();
    person2 = new Person();
    person3 = new Person();

    await SignupPerson(person1, app);
    await SignupPerson(person2, app);
    await SignupPerson(person3, app);
  });

  test("Adding collaberators", async () => {
    const addRequest1: collaboratorsRequest = {
      friendlyName: faker.company.name(),
      tenantID: person2.token_info.tenancyId.toString(),
    };
    const res1 = await request(app)
      .post("/collaborators")
      .set("Authorization", `Bearer ${person1.token}`)
      .send(addRequest1);
    expect(res1.statusCode).toBe(201);

    const addRequest2: collaboratorsRequest = {
      friendlyName: faker.company.name(),
      tenantID: person1.token_info.tenancyId.toString(),
    };
    const res2 = await request(app)
      .post("/collaborators")
      .set("Authorization", `Bearer ${person2.token}`)
      .send(addRequest2);
    expect(res2.statusCode).toBe(201);

    const addRequest3: collaboratorsRequest = {
      friendlyName: faker.company.name(),
      tenantID: person3.token_info.tenancyId.toString(),
    };
    const res3 = await request(app)
      .post("/collaborators")
      .set("Authorization", `Bearer ${person1.token}`)
      .send(addRequest3);
    expect(res3.statusCode).toBe(201);

    const res4 = await request(app)
      .post("/collaborators")
      .set("Authorization", `Bearer ${person2.token}`)
      .send(addRequest3);
    expect(res4.statusCode).toBe(201);
  });

  test("Listing open collaberators", async () => {
    const res1 = await request(app).get("/collaborators/open").set("Authorization", `Bearer ${person1.token}`);
    expect(res1.statusCode).toBe(200);
    expect(res1.body.length).toBe(0);

    const res2 = await request(app).get("/collaborators/open").set("Authorization", `Bearer ${person2.token}`);
    expect(res2.statusCode).toBe(200);
    expect(res2.body.length).toBe(0);

    const res3 = await request(app).get("/collaborators/open").set("Authorization", `Bearer ${person3.token}`);
    expect(res3.statusCode).toBe(200);
    expect(res3.body.length).toBe(2);
  });

  test("Listing pending collaberators", async () => {
    const res1 = await request(app).get("/collaborators/pending").set("Authorization", `Bearer ${person1.token}`);
    expect(res1.statusCode).toBe(200);
    expect(res1.body.length).toBe(1);

    const res2 = await request(app).get("/collaborators/pending").set("Authorization", `Bearer ${person2.token}`);
    expect(res2.statusCode).toBe(200);
    expect(res2.body.length).toBe(1);

    const res3 = await request(app).get("/collaborators/pending").set("Authorization", `Bearer ${person3.token}`);
    expect(res3.statusCode).toBe(200);
    expect(res3.body.length).toBe(0);
  });

  test("Listing collaberators", async () => {
    const res1 = await request(app).get("/collaborators").set("Authorization", `Bearer ${person1.token}`);
    expect(res1.statusCode).toBe(200);
    expect(res1.body.length).toBe(1);

    const res2 = await request(app).get("/collaborators").set("Authorization", `Bearer ${person2.token}`);
    expect(res2.statusCode).toBe(200);
    expect(res2.body.length).toBe(1);

    const res3 = await request(app).get("/collaborators").set("Authorization", `Bearer ${person3.token}`);
    expect(res3.statusCode).toBe(200);
    expect(res3.body.length).toBe(0);
  });

  test("Viewing a single collaberator", async () => {
    const res1 = await request(app)
      .get(`/collaborators/${person2.token_info.tenancyId}`)
      .set("Authorization", `Bearer ${person1.token}`);
    expect(res1.statusCode).toBe(200);
    expect(res1.body.tenantID).toBe(person2.token_info.tenancyId);
  });

  // test Removing a collaberator
  test("Removing a collaberators", async () => {
    // person 2 removes person 1
    const res1 = await request(app)
      .delete(`/collaborators/${person1.token_info.tenancyId}`)
      .set("Authorization", `Bearer ${person2.token}`);
    expect(res1.statusCode).toBe(200);

    // see if all the lists are updated

    // list collaberators
    const res2 = await request(app).get("/collaborators").set("Authorization", `Bearer ${person1.token}`);
    expect(res2.statusCode).toBe(200);
    expect(res2.body.length).toBe(0);

    // list open collaberators
    const res3 = await request(app).get("/collaborators/open").set("Authorization", `Bearer ${person1.token}`);
    expect(res3.statusCode).toBe(200);
    expect(res3.body.length).toBe(0);

    // list pending collaberators
    const res4 = await request(app).get("/collaborators/pending").set("Authorization", `Bearer ${person1.token}`);
    expect(res4.statusCode).toBe(200);
    expect(res4.body.length).toBe(2);
  });
});

// Test Authentication on collaberator routes
describe("Collaborators enpoint Authentication", () => {
  test("Adding collaberators without authentication", async () => {
    const addRequest1: collaboratorsRequest = { friendlyName: faker.company.name(), tenantID: "1234" };
    const res1 = await request(app).post("/collaborators").send(addRequest1);
    expect(res1.statusCode).toBe(403);
  });

  test("Listing open collaberators without authentication", async () => {
    const res1 = await request(app).get("/collaborators/open");
    expect(res1.statusCode).toBe(403);
  });

  test("Listing pending collaberators without authentication", async () => {
    const res1 = await request(app).get("/collaborators/pending");
    expect(res1.statusCode).toBe(403);
  });

  test("Listing collaberators without authentication", async () => {
    const res1 = await request(app).get("/collaborators");
    expect(res1.statusCode).toBe(403);
  });

  test("Removing a collaberators without authentication", async () => {
    const res1 = await request(app).delete(`/collaborators/${new mongoose.Types.ObjectId()}`);
    expect(res1.statusCode).toBe(403);
  });
});

describe(" Collaborators endpoint validation", () => {
  let person1: Person;
  let deletedperson: Person;

  beforeAll(async () => {
    person1 = new Person();
    deletedperson = new Person();
    await SignupPerson(person1, app);
    await SignupPerson(deletedperson, app);

    await Tenancy.findByIdAndDelete(deletedperson.token_info.tenancyId);
  });

  test("Adding collaberators with invalid tenantID", async () => {
    const addRequest1: collaboratorsRequest = { friendlyName: faker.company.name(), tenantID: "1234" };
    const res1 = await request(app)
      .post("/collaborators")
      .set("Authorization", `Bearer ${person1.token}`)
      .send(addRequest1);
    expect(res1.statusCode).toBe(400);
    expect(res1.body.message).toBe("tenantID must be a valid ID");
  });

  test("Adding collaberators with valid tenantID but not a tenant", async () => {
    const addRequest1: collaboratorsRequest = {
      friendlyName: faker.company.name(),
      tenantID: new mongoose.Types.ObjectId().toString(),
    };
    const res1 = await request(app)
      .post("/collaborators")
      .set("Authorization", `Bearer ${person1.token}`)
      .send(addRequest1);
    expect(res1.statusCode).toBe(400);
    expect(res1.body.message).toBe("collaberator Tenant does not exist");
  });

  test("Adding collaberators with missing friendlyName", async () => {
    const addRequest1 = { tenantID: new mongoose.Types.ObjectId().toString() };
    const res1 = await request(app)
      .post("/collaborators")
      .set("Authorization", `Bearer ${person1.token}`)
      .send(addRequest1);

    expect(res1.statusCode).toBe(400);
    expect(res1.body.message).toBe("Friendly Name is required");
  });

  test("Viewing a single collaberator with invalid tenantID", async () => {
    const res1 = await request(app).get(`/collaborators/${"1234"}`).set("Authorization", `Bearer ${person1.token}`);
    expect(res1.body.message).toBe("Collaborator must be a valid ID");
    expect(res1.statusCode).toBe(400);
  });

  test("Viewing a single collaberator with valid object id but not a tenant", async () => {
    const res1 = await request(app)
      .get(`/collaborators/${new mongoose.Types.ObjectId()}`)
      .set("Authorization", `Bearer ${person1.token}`);

    expect(res1.statusCode).toBe(400);
    expect(res1.body.message).toBe("unknown collaborator");
  });

  test("Removing a collaberator with invalid tenantID", async () => {
    const res1 = await request(app).delete(`/collaborators/${"1234"}`).set("Authorization", `Bearer ${person1.token}`);

    expect(res1.statusCode).toBe(400);
    expect(res1.body.message).toBe("Collaborator must be a valid ID");
  });

  test("Removing a collaberator with valid object id but not a tenant", async () => {
    const res1 = await request(app)
      .delete(`/collaborators/${new mongoose.Types.ObjectId()}`)
      .set("Authorization", `Bearer ${person1.token}`);

    expect(res1.statusCode).toBe(400);
    expect(res1.body.message).toBe("unknown collaborator");
  });

  // increasing converage - unlikely to happen
  test("viewing collaberators with a signed token but no tenancy", async () => {
    const res1 = await request(app).get("/collaborators").set("Authorization", `Bearer ${deletedperson.token}`);
    expect(res1.statusCode).toBe(500);
  });

  test("viewing open collaberators with a signed token but no tenancy", async () => {
    const res1 = await request(app).get("/collaborators/open").set("Authorization", `Bearer ${deletedperson.token}`);
    expect(res1.statusCode).toBe(500);
  });

  test("viewing pending collaberators with a signed token but no tenancy", async () => {
    const res1 = await request(app).get("/collaborators/pending").set("Authorization", `Bearer ${deletedperson.token}`);
    expect(res1.statusCode).toBe(500);
  });

  test("Adding collaberators with a signed token but no tenancy", async () => {
    const addRequest1: collaboratorsRequest = {
      friendlyName: faker.company.name(),
      tenantID: person1.token_info.tenancyId.toString(),
    };
    const res1 = await request(app)
      .post("/collaborators")
      .set("Authorization", `Bearer ${deletedperson.token}`)
      .send(addRequest1);
    expect(res1.statusCode).toBe(500);
  });

  test("viewing a single collaberators with a signed token but no tenancy", async () => {
    const res1 = await request(app)
      .get(`/collaborators/${person1.token_info.tenancyId}`)
      .set("Authorization", `Bearer ${deletedperson.token}`);
    expect(res1.statusCode).toBe(500);
  });
  
  test("Removing a collaberators with a signed token but no tenancy", async () => {
    const res1 = await request(app)
      .delete(`/collaborators/${person1.token_info.tenancyId}`)
      .set("Authorization", `Bearer ${deletedperson.token}`);
    expect(res1.statusCode).toBe(500);
  });
  
  
});

afterAll(async () => {
  await mongo.stop();
});
