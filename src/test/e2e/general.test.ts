/* This file contains general tests that do not fit in any other category. */

import { expect, test } from "@jest/globals";
import request from "supertest";

import { app } from "../../app/app";
import { GetEnvValue } from "../../app/utils/utils";

test("Test that unknown routes return 404", async () => {
  const res = await request(app).get("/unknown/route");
  expect(res.statusCode).toBe(404);
});

test("Get Env utils function", async () => {
  // set the environment variable
  process.env.TEST_ENV = "test";
  const env = GetEnvValue("TEST_ENV");
  expect(env).toBe("test");

  // expect function to throw error if environment variable is not set
  expect(() => GetEnvValue("NOT_SET")).toThrowError("NOT_SET environment variables is not set");
});
