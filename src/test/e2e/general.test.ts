/* This file contains general tests that do not fit in any other category. */

import { expect, test } from "@jest/globals";
import request from "supertest";

import { app } from "../../app/app";

test("Test that unknown routes return 404", async () => {
  const res = await request(app).get("/unknown/route");
  expect(res.statusCode).toBe(404);
});
