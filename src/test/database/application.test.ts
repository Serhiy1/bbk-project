import { expect, test } from "@jest/globals";
import bcrypt from "bcrypt";
import mongoose from "mongoose";

import { Application } from "../../app/models/database/application";
import { User } from "../../app/models/database/user";
import { Person } from "../utils/utils";

test("test New Application Static Function", async () => {
  const person = new Person();
  const user = await User.NewUser({
    email: person.email,
    passwordHash: person.password,
    tenancyId: new mongoose.Types.ObjectId(),
  });

  const application = await Application.NewApplication(user);

  expect(application).toHaveProperty("appId");
  expect(application).toHaveProperty("secret");
  expect(application).toHaveProperty("tenancyId", user.tenancyId);
  expect(application).toHaveProperty("OwnerEmail", user.email);

  // check the passwordHash virtual
  expect(application).toHaveProperty("passwordHash");
});

test("test findByAppId Static Function", async () => {
  const person = new Person();
  const user = await User.NewUser({
    email: person.email,
    passwordHash: person.password,
    tenancyId: new mongoose.Types.ObjectId(),
  });
  const application = await Application.NewApplication(user);
  const appFromDB = await Application.findByAppId(application.appId);

  expect(appFromDB).toHaveProperty("appId", application.appId);
  expect(appFromDB).toHaveProperty("secret", application.secret);
  expect(appFromDB).toHaveProperty("tenancyId", application.tenancyId);
  expect(appFromDB).toHaveProperty("OwnerEmail", application.OwnerEmail);
});

test("test isOwner Method", async () => {
  // person 1 creates the user
  // person 2 is in the same tenancy as person 1
  // person 3 is not in the same tenancy as person 1

  const person1 = new Person();
  const person2 = new Person();
  const person3 = new Person();

  const user1 = await User.NewUser({
    email: person1.email,
    passwordHash: person1.password,
    tenancyId: new mongoose.Types.ObjectId(),
  });

  const user2 = await User.NewUser({
    email: person2.email,
    passwordHash: person2.password,
    tenancyId: user1.tenancyId,
  });

  const user3 = await User.NewUser({
    email: person3.email,
    passwordHash: person3.password,
    tenancyId: new mongoose.Types.ObjectId(),
  });

  // create an application for user1
  const application = await Application.NewApplication(user1);

  // check if user1 is the owner
  expect(application.isOwner(user1)).toBe(true);

  // check if user2 is the owner. TODO this needs to be updated with an admin role
  expect(application.isOwner(user2)).toBe(false);

  // check if user3 is the owner
  expect(application.isOwner(user3)).toBe(false);
});

test("test toResponse Method", async () => {
  const person = new Person();
  const user = await User.NewUser({
    email: person.email,
    passwordHash: person.password,
    tenancyId: new mongoose.Types.ObjectId(),
  });
  const application = await Application.NewApplication(user);
  const response = application.toResponse();

  expect(response).toHaveProperty("appID", application.appId.toString());
  expect(response).toHaveProperty("secret", application.secret.toString());
});

test("test rollSecret Method", async () => {
  const person = new Person();
  const user = await User.NewUser({
    email: person.email,
    passwordHash: person.password,
    tenancyId: new mongoose.Types.ObjectId(),
  });
  const application = await Application.NewApplication(user);
  const oldSecret = application.secret;
  const newSecret = application.rollSecret();

  expect(oldSecret).not.toBe(newSecret);
});

test("test delete Method", async () => {
  const person = new Person();
  const user = await User.NewUser({
    email: person.email,
    passwordHash: person.password,
    tenancyId: new mongoose.Types.ObjectId(),
  });
  const application = await Application.NewApplication(user);

  // make sure it exists in the database
  let appFromDB = await Application.findByAppId(application.appId);
  expect(appFromDB).not.toBe(null);

  await application.delete();

  appFromDB = await Application.findByAppId(application.appId);

  expect(appFromDB).toBe(null);
});

test("test toTokenInfo Method", async () => {
  const person = new Person();
  const user = await User.NewUser({
    email: person.email,
    passwordHash: person.password,
    tenancyId: new mongoose.Types.ObjectId(),
  });
  const application = await Application.NewApplication(user);
  const tokenInfo = application.toTokenInfo();

  expect(tokenInfo).toHaveProperty("UserId", application._id);
  expect(tokenInfo).toHaveProperty("email", application.OwnerEmail);
  expect(tokenInfo).toHaveProperty("tenancyId", application.tenancyId);
});

test("test passwordHash Virtual", async () => {
  const person = new Person();
  const user = await User.NewUser({
    email: person.email,
    passwordHash: person.password,
    tenancyId: new mongoose.Types.ObjectId(),
  });
  const application = await Application.NewApplication(user);

  expect(application).toHaveProperty("passwordHash");
  // make sure that that hash is consistent over many calls
  const hash1 = application.passwordHash;
  const hash2 = application.passwordHash;

  expect(bcrypt.compareSync(application.secret.toString(), hash1)).toBe(true);
  expect(bcrypt.compareSync(application.secret.toString(), hash2)).toBe(true);
});
