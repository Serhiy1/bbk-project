/* tests the user Model */

import { afterAll, beforeAll, expect, test } from "@jest/globals";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

import { User } from "../../app/models/database/user";
import { connectToDatabase } from "../../app/utils/utils";
import { Person } from "../utils";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  connectToDatabase(uri);
});

test("test New User Static Function", async () => {
  const person = new Person();
  const user = await User.NewUser({
    userName: person.userName,
    email: person.email,
    passwordHash: person.password,
    tenancyId: new mongoose.Types.ObjectId(),
  });
  await user.save();

  // get the user from the database via id
  const userFromDB = await User.findById(user._id);

  // check that the user has the correct properties
  expect(userFromDB).toHaveProperty("userName", person.userName);
  expect(userFromDB).toHaveProperty("email", person.email);
  expect(userFromDB).toHaveProperty("passwordHash");
  expect(userFromDB).toHaveProperty("tenancyId");
});

test("test AlreadyExists Static Function", async () => {
  const person = new Person();
  const user = await User.NewUser({
    userName: person.userName,
    email: person.email,
    passwordHash: person.password,
    tenancyId: new mongoose.Types.ObjectId(),
  });
  await user.save();
  const exists = await User.AlreadyExists(person.email);
  expect(exists).toBe(true);
});

test("test toTokenInfo Method", async () => {
  const person = new Person();
  const user = await User.NewUser({
    userName: person.userName,
    email: person.email,
    passwordHash: person.password,
    tenancyId: new mongoose.Types.ObjectId(),
  });
  await user.save();
  const tokenInfo = user.toTokenInfo();
  expect(tokenInfo).toHaveProperty("UserId", user._id);
  expect(tokenInfo).toHaveProperty("userName", user.userName);
  expect(tokenInfo).toHaveProperty("email", user.email);
  expect(tokenInfo).toHaveProperty("tenancyId", user.tenancyId);
});

test("test toUserResponse Method", async () => {
  const person = new Person();
  const user = await User.NewUser({
    userName: person.userName,
    email: person.email,
    passwordHash: person.password,
    tenancyId: new mongoose.Types.ObjectId(),
  });
  await user.save();
  const userResponse = user.toUserResponse();
  expect(userResponse).toHaveProperty("tenantID", user.tenancyId.toString());
  expect(userResponse).toHaveProperty("username", user.userName);
  expect(userResponse).toHaveProperty("email", user.email);
});

afterAll(async () => {
  await mongo.stop();
});
