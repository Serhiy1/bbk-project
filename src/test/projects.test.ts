/* Tests that cover the Projects Endpoint */

import { expect, test } from "@jest/globals";
// temporary no operation test

test("no-op", () => {
  expect(true).toBe(true);
});

// import { SignupRequest } from "../app/models/types/authentications";
// import { ProjectRequest } from "../app/models/types/projects";
// import { EventRequest } from "../app/models/types/projects";
// import { SignupPerson, CreateRandomProject, CreateRandomEvent } from "../test/utils";

// Describe positive tests

//      Test 1 - Create a new project in tenancy

//      Test 2 - Fetch all projects in tenancy

//      Test 3 - Fetch a project by ID

//      Test 4 - Update a project by ID

//      Test 5 - Delete a project by ID Should Fail

//      Test 6 - Create a new event for a project

//      Test 7 - Fetch all events for a project

//      Test 8 - Fetch all project for an empty tenant should succeed

//      Test 9 - Fetch all events for an empty project should succeed

//      Test 10 - Set project status to INACTIVE

//      Test 11 - Check No New Events can be created for an INACTIVE project

//      Test 12 - Toggle Inactive project to ACTIVE and create a new event

// Describe project input Validation tests

//      Test 1 - missing projectName should repond with 400

//      Test 2 - missing projectDescription should respond with 400

//      Test 3 - missing projectStatus should be respond with 400

//      Test 4 - missing customMetaData should respond with 200

//      Test 5 - Non string customMetaData should respond with 400

//      Test 6 - Get project with Missing project ID Paramater respond with 400

//      Test 7 - Get project with Non UUID project ID Paramater respond with 400

//      Test 8 - Get project with non-existing project ID Paramater should respond with 404

//      Test 9 - Getting a project from a different tenant should respond with 404

// Desacribe Authentication tests

//      Test 1 - Create a new project without authentication should respond with 403

//      Test 2 - Create a new Event without authentication should respond with 403

//      Test 3 - Fetch all projects without authentication should respond with 403
