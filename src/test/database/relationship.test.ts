import { faker } from "@faker-js/faker";
import { beforeAll, describe, expect, test } from "@jest/globals";
import mongoose from "mongoose";

import { RelationshipManager, relationshipManagerDocument } from "../../app/models/database/relationshipManager";
import { collaboratorsRequest } from "../../app/models/types/collaborators";

// Create a new RelationshipManager from a collaboratorsRequest
test("test newRelationship Static Function", async () => {
  const tenantID = new mongoose.Types.ObjectId();
  const company = faker.company.name();
  const request: collaboratorsRequest = {
    tenantID: new mongoose.Types.ObjectId().toString(),
    friendlyName: "test",
  };

  const relationship = await RelationshipManager.newRelationship(tenantID, company, request);
  await relationship.save();

  // get the relationship from the database via id
  const relationshipFromDB = await RelationshipManager.findById(relationship._id);

  // assert that the result is not null
  expect(relationshipFromDB).not.toBeNull();

  // assert that the relationship has the correct properties
  expect(relationshipFromDB).toHaveProperty("collaboratorsInfo");
  expect(relationshipFromDB).toHaveProperty("collaborators");
  expect(relationshipFromDB).toHaveProperty("collaboratorsHash");
});

// test findByCollaborators Static Function, where the relationship exists
test("test findByCollaborators Static Function", async () => {
  const tenantID = new mongoose.Types.ObjectId();
  const company = faker.company.name();

  const request: collaboratorsRequest = {
    tenantID: new mongoose.Types.ObjectId().toString(),
    friendlyName: "test",
  };

  const relationship = await RelationshipManager.newRelationship(tenantID, company, request);
  await relationship.save();

  const relationshipFromDB = await RelationshipManager.findByCollaborators(
    tenantID,
    new mongoose.Types.ObjectId(request.tenantID)
  );

  expect(relationshipFromDB).not.toBeNull();
});

// test findByCollaborators Static Function, where the relationship does not exist
test("test findByCollaborators Static Function, where the relationship does not exist", async () => {
  const tenantID = new mongoose.Types.ObjectId();
  const company = faker.company.name();

  const request: collaboratorsRequest = {
    tenantID: new mongoose.Types.ObjectId().toString(),
    friendlyName: "test",
  };

  const relationship = await RelationshipManager.newRelationship(tenantID, company, request);
  await relationship.save();

  const relationshipFromDB = await RelationshipManager.findByCollaborators(tenantID, new mongoose.Types.ObjectId());

  expect(relationshipFromDB).toBeNull();
});

// describe the status and acceptInvite methods

describe("test status and acceptInvite methods", () => {
  const tenantIDOne = new mongoose.Types.ObjectId();
  const tenantIDTwo = new mongoose.Types.ObjectId();
  const company = faker.company.name();
  let relationshipManager: relationshipManagerDocument;

  // first test creates a relationship with one accepted and one not accepted, assert that status is PENDING
  test("test status method", async () => {
    const request: collaboratorsRequest = {
      tenantID: tenantIDTwo.toString(),
      friendlyName: "test",
    };

    relationshipManager = await RelationshipManager.newRelationship(tenantIDOne, company, request);
    await relationshipManager.save();

    const relationshipFromDB = await RelationshipManager.findById(relationshipManager._id);

    expect((relationshipFromDB as relationshipManagerDocument).status()).toBe("PENDING");
  });

  // second test Accepts the invite and asserts that the status is ACCEPTED
  test("test acceptInvite method", async () => {
    const request: collaboratorsRequest = {
      tenantID: tenantIDOne.toString(),
      friendlyName: "test",
    };

    await relationshipManager.acceptInvite(tenantIDTwo, request);

    const relationshipFromDB = await RelationshipManager.findById(relationshipManager._id);

    expect((relationshipFromDB as relationshipManagerDocument).status()).toBe("ACTIVE");
  });

  // third test deletes the collaborator and asserts that the status is PENDING
  test("test unAcceptInvite method", async () => {
    await relationshipManager.unAcceptInvite(tenantIDOne);

    const relationshipFromDB = await RelationshipManager.findById(relationshipManager._id);

    expect((relationshipFromDB as relationshipManagerDocument).status()).toBe("PENDING");
  });
});

describe("test find by collaborator Hash method", () => {
  const tenantIDOne = new mongoose.Types.ObjectId();
  const companyOne = faker.company.name();

  const tenantIDTwo = new mongoose.Types.ObjectId();
  const companyTwo = faker.company.name();

  const tenantIDThree = new mongoose.Types.ObjectId();

  const tenantIDFour = new mongoose.Types.ObjectId();
  let RelationshipOneToTwo: relationshipManagerDocument;
  let RelationshipThreeToFour: relationshipManagerDocument;

  // convert the declarations above into a beforeAll function
  beforeAll(async () => {
    RelationshipOneToTwo = await RelationshipManager.newRelationship(
      tenantIDOne,
      companyOne,
      newCollaboratorRequest(tenantIDTwo)
    );
    await RelationshipOneToTwo.acceptInvite(tenantIDTwo, newCollaboratorRequest(tenantIDOne));

    RelationshipThreeToFour = await RelationshipManager.newRelationship(
      tenantIDThree,
      companyTwo,
      newCollaboratorRequest(tenantIDFour)
    );
    await RelationshipThreeToFour.acceptInvite(tenantIDFour, newCollaboratorRequest(tenantIDThree));
  });

  test("test find by collaborator Hash method success first relationship", async () => {
    // find in the relation in the order it was created
    const relationship = await RelationshipManager.findByCollaborators(tenantIDOne, tenantIDTwo);
    expect(relationship).not.toBeNull();
    expect(relationship?._id).toEqual(RelationshipOneToTwo._id);

    // find in the relation in the reverse order it was created
    const relationshipReverse = await RelationshipManager.findByCollaborators(tenantIDTwo, tenantIDOne);
    expect(relationshipReverse).not.toBeNull();
    expect(relationship?._id).toEqual(RelationshipOneToTwo._id);
  });

  test("test find by collaborator Hash method success second relationship", async () => {
    const relationship = await RelationshipManager.findByCollaborators(tenantIDThree, tenantIDFour);
    expect(relationship).not.toBeNull();
    expect(relationship?._id).toEqual(RelationshipThreeToFour._id);

    const relationshipReverse = await RelationshipManager.findByCollaborators(tenantIDFour, tenantIDThree);
    expect(relationshipReverse).not.toBeNull();
    expect(relationship?._id).toEqual(RelationshipThreeToFour._id);
  });

  test("test find by collaborator Hash method failure", async () => {
    const relationship = await RelationshipManager.findByCollaborators(tenantIDOne, tenantIDThree);
    expect(relationship).toBeNull();
  });

  function newCollaboratorRequest(tenantID: mongoose.Types.ObjectId): collaboratorsRequest {
    return {
      tenantID: tenantID.toString(),
      friendlyName: faker.company.name(),
    };
  }

  test("test toCollaboratorResponse method", async () => {
    const relationship = await RelationshipManager.findByCollaborators(tenantIDOne, tenantIDTwo);
    expect(relationship).not.toBeNull();

    const responseOne = (relationship as relationshipManagerDocument).toCollaboratorResponse(tenantIDOne);

    expect(responseOne).toHaveProperty("tenantID", tenantIDTwo.toString());
    expect(responseOne).toHaveProperty("friendlyName");
    expect(responseOne).toHaveProperty("status", "ACTIVE");
    expect(responseOne).toHaveProperty("projects", []);

    const responseTwo = (relationship as relationshipManagerDocument).toCollaboratorResponse(tenantIDTwo);

    expect(responseTwo).toHaveProperty("tenantID", tenantIDOne.toString());
    expect(responseTwo).toHaveProperty("friendlyName");
    expect(responseTwo).toHaveProperty("status", "ACTIVE");
    expect(responseTwo).toHaveProperty("projects", []);
  });

  test("test to collaborator response not found", async () => {
    const relationship = await RelationshipManager.findByCollaborators(tenantIDOne, tenantIDTwo);
    expect(relationship).not.toBeNull();

    expect(() =>
      (relationship as relationshipManagerDocument).toCollaboratorResponse(new mongoose.Types.ObjectId())
    ).toThrow();
  });
});
