/* This file contains general tests that do not fit in any other category. */

import { afterAll, beforeAll, expect, test } from "@jest/globals";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";

import { app } from "../app/app";
import { connectToDatabase } from "../app/utils/utils";

let mongo: MongoMemoryServer;

/* Creating the database for the suite. */
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  connectToDatabase(uri);
});

test("Test that unknown routes return 404", async () => {
  const res = await request(app).get("/unknown/route");
  expect(res.statusCode).toBe(404);
});

/* Closing database connection at the end of the suite. */
afterAll(async () => {
  await mongo.stop();
});
