import { beforeAll, describe, expect, test } from "@jest/globals";
import mongoose from "mongoose";
import request from "supertest";

import { app } from "../../app/app";
import { ApplicationResponse } from "../../app/models/types/applications";
// import { DecodeToken } from "../app/middleware/authentication";
// import { UserTokenInfo } from "../app/models/database/user";
import {
  LoginRequest,
  LoginResponse,
  SignupRequest,
  SignupResponse,
  UserResponse,
} from "../../app/models/types/authentications";
import { NewToken } from "../../app/utils/token";
import { Person, SignupPerson } from "../utils/utils";

let FirstPerson: Person;
let FirstToken: string;
let FirstTenancyID: string;

describe("Sign Up And Login", () => {
  test("Successful signup flow", async () => {
    FirstPerson = new Person();

    const user_info: SignupRequest = {
      email: FirstPerson.email,
      companyName: FirstPerson.companyName,
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
      companyName: missingEmailPerson.companyName,
      password: missingEmailPerson.password,
    };

    const res = await request(app).post("/user/signup").send(user_info);
    expect(res.statusCode).toBe(400);
  });

  test("Signup with missing password should fail", async () => {
    const missingPasswordPerson = new Person();

    const user_info = {
      email: missingPasswordPerson.email,
      companyName: missingPasswordPerson.companyName,
    };

    const res = await request(app).post("/user/signup").send(user_info);
    expect(res.statusCode).toBe(400);
  });

  test("Signup with weak password should fail", async () => {
    const PersonWithWeakPassword = new Person();
    PersonWithWeakPassword.password = "weak_password";

    const user_info: SignupRequest = {
      email: PersonWithWeakPassword.email,
      companyName: PersonWithWeakPassword.companyName,
      password: PersonWithWeakPassword.password,
    };

    const res = await request(app).post("/user/signup").send(user_info);
    expect(res.statusCode).toBe(400);
  });

  test("signup with duplicate email should fail", async () => {
    const person = new Person();
    const user_info: SignupRequest = {
      email: person.email,
      companyName: person.companyName,
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
      UserId: new mongoose.Types.ObjectId(),
      tenancyId: new mongoose.Types.ObjectId(),
    });

    const res = await request(app).get("/user/whoami").set("Authorization", `Bearer ${NonexistentToken}`);
    expect(res.statusCode).toBe(404);
  });
});

describe("Application Authentication", () => {
  // new person signs up and logs in
  // person creates an application
  // user authenticates application

  let person: Person;
  let application: ApplicationResponse;

  beforeAll(async () => {
    person = new Person();
    await SignupPerson(person, app);
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

  test("Authenticate Application with wrong secret", async () => {
    // use the login endpoint to authenticate the application
    const res = await request(app).post("/user/login").send({ email: application.appID, password: "wrong_secret" });
    expect(res.statusCode).toBe(403);
  });

  test("Authenticate Application with wrong appID", async () => {
    // use the login endpoint to authenticate the application
    const res = await request(app)
      .post("/user/login")
      .send({ email: new mongoose.Types.UUID(), password: application.secret });
    expect(res.statusCode).toBe(404);
  });

  test("Roll Secret for application, authentication should fail", async () => {
    const res = await request(app)
      .get(`/app/${application.appID}/newSecret`)
      .set("Authorization", `Bearer ${person.token}`);
    expect(res.statusCode).toBe(201);

    const newSecret = res.body.secret;

    // make sure the old secret does not work
    const res2 = await request(app)
      .post("/user/login")
      .send({ email: application.appID, password: application.secret });
    expect(res2.statusCode).toBe(403);

    // make sure the new secret does work
    const res3 = await request(app).post("/user/login").send({ email: application.appID, password: newSecret });
    expect(res3.statusCode).toBe(200);
  });
});
