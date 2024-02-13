import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";

import { app } from "../app/app";
// import { DecodeToken } from "../app/middleware/authentication";
// import { UserTokenInfo } from "../app/models/database/user";
import {
  LoginRequest,
  LoginResponse,
  SignupRequest,
  SignupResponse,
  UserResponse,
} from "../app/models/types/authentications";
import { NewToken } from "../app/utils/token";
import { connectToDatabase } from "../app/utils/utils";
import { Person } from "./utils";

let mongo: MongoMemoryServer;
let FirstPerson: Person;
let FirstToken: string;
let FirstTenancyID: string;

/* Creating the database for the suite. */
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  connectToDatabase(uri);
});

describe("Sign Up And Login", () => {
  test("Successful signup flow", async () => {
    FirstPerson = new Person();

    const user_info: SignupRequest = {
      email: FirstPerson.email,
      username: FirstPerson.userName,
      password: FirstPerson.password,
    };

    const res = await request(app).post("/user/signup").send(user_info);
    expect(res.statusCode).toBe(201);
    const res_body: SignupResponse = res.body;
    expect(res_body).toHaveProperty("token");
    expect(res_body).toHaveProperty("tenantID");

    FirstToken = res_body.token;
    FirstTenancyID = res_body.tenantID;
  });

  test("successful Login", async () => {
    const signup_info: LoginRequest = {
      email: FirstPerson.email,
      password: FirstPerson.password,
    };

    const res = await request(app).post("/user/login").send(signup_info);
    expect(res.statusCode).toBe(200);
    const res_body: LoginResponse = res.body;

    expect(res_body).toHaveProperty("token");
    expect(res_body.token).toBe(FirstToken);
  });

  test("Whoami Endpoint", async () => {
    const res = await request(app).get("/user/whoami").set("Authorization", `Bearer ${FirstToken}`);
    expect(res.statusCode).toBe(200);
    const res_body: UserResponse = res.body;

    expect(res_body.email).toBe(FirstPerson.email);
    expect(res_body.username).toBe(FirstPerson.userName);
    expect(res_body.tenantID).toBe(FirstTenancyID);
  });

  test("Login with wrong password should fail", async () => {
    const signup_info: LoginRequest = {
      email: FirstPerson.email,
      password: "wrong_password",
    };

    const res = await request(app).post("/user/login").send(signup_info);
    expect(res.statusCode).toBe(403);
  });

  test("Login with wrong email should fail", async () => {
    const signup_info: LoginRequest = {
      email: "wrong_email@foobar.com",
      password: FirstPerson.password,
    };

    const res = await request(app).post("/user/login").send(signup_info);
    expect(res.statusCode).toBe(404);
  });
});

describe("Signup Input Validation", () => {
  test("Signup with missing username should fail", async () => {
    const missingUsernamePerson = new Person();

    const user_info = {
      email: missingUsernamePerson.email,
      password: missingUsernamePerson.password,
    };

    const res = await request(app).post("/user/signup").send(user_info);
    expect(res.statusCode).toBe(400);
  });

  test("Signup with missing email should fail", async () => {
    const missingEmailPerson = new Person();

    const user_info = {
      username: missingEmailPerson.userName,
      password: missingEmailPerson.password,
    };

    const res = await request(app).post("/user/signup").send(user_info);
    expect(res.statusCode).toBe(400);
  });

  test("Signup with missing password should fail", async () => {
    const missingPasswordPerson = new Person();

    const user_info = {
      email: missingPasswordPerson.email,
      username: missingPasswordPerson.userName,
    };

    const res = await request(app).post("/user/signup").send(user_info);
    expect(res.statusCode).toBe(400);
  });

  test("Signup with weak password should fail", async () => {
    const PersonWithWeakPassword = new Person();
    PersonWithWeakPassword.password = "weak_password";

    const user_info: SignupRequest = {
      email: PersonWithWeakPassword.email,
      username: PersonWithWeakPassword.userName,
      password: PersonWithWeakPassword.password,
    };

    const res = await request(app).post("/user/signup").send(user_info);
    expect(res.statusCode).toBe(400);
  });

  test("signup with duplicate email should fail", async () => {
    const person = new Person();
    const user_info: SignupRequest = {
      email: person.email,
      username: person.userName,
      password: person.password,
    };
    // First signup
    await request(app).post("/user/signup").send(user_info);

    // Second signup - should fail
    const res = await request(app).post("/user/signup").send(user_info);
    expect(res.statusCode).toBe(409);
  });
});

describe("login Validation", () => {
  test("login with missing email should fail", async () => {
    const person = new Person();

    const signup_info = {
      password: person.password,
    };
    const res = await request(app).post("/user/login").send(signup_info);
    expect(res.statusCode).toBe(400);
  });

  test("login with missing password should fail", async () => {
    const person = new Person();

    const signup_info = {
      email: person.email,
    };
    const res = await request(app).post("/user/login").send(signup_info);
    expect(res.statusCode).toBe(400);
  });

  test("login with missing email and password should fail", async () => {
    const res = await request(app).post("/user/login").send({});
    expect(res.statusCode).toBe(400);
  });

  test("login with invalid email should fail", async () => {
    const person = new Person();
    const signup_info = {
      email: "invalid_email",
      password: person.password,
    };
    const res = await request(app).post("/user/login").send(signup_info);
    expect(res.statusCode).toBe(400);
  });
});

describe("whoami Validation", () => {
  test("whoami with missing token should fail", async () => {
    const res = await request(app).get("/user/whoami");
    expect(res.statusCode).toBe(403);
  });

  test("whoami with invalid token should fail", async () => {
    const res = await request(app).get("/user/whoami").set("Authorization", `Bearer invalid_token`);
    expect(res.statusCode).toBe(403);
  });

  test("whoami with malicious token should fail", async () => {
    // person has got hold of a token key and makes an invalid token without a user
    const NonExistentPerson = new Person();

    const NonexistentToken = NewToken({
      email: NonExistentPerson.email,
      _id: new mongoose.Types.ObjectId(),
      userName: NonExistentPerson.userName,
      tenancyId: new mongoose.Types.ObjectId(),
    });

    const res = await request(app).get("/user/whoami").set("Authorization", `Bearer ${NonexistentToken}`);
    expect(res.statusCode).toBe(404);
  });
});

/* Closing database connection at the end of the suite. */
afterAll(async () => {
  await mongo.stop();
});
