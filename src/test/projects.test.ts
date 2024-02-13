/* Tests that cover the Projects Endpoint */

import { expect,test } from "@jest/globals";
// temporary no operation test 

test('no-op', () => {
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




// ProjectRequest: {
//     projectName: string;
//     projectDescription: string;
//     /** @enum {string} */
//     projectStatus?: "ACTIVE" | "INACTIVE";
//     customMetaData?: {
//         [key: string]: string | undefined;
//     };
// };

// Describe project input Validation tests

//      Test 1 - missing projectName should fail

//      Test 2 - missing projectDescription should fail

//      Test 3 - missing projectStatus should be fine

//      Test 4 - missing customMetaData should be fine

//      Test 5 - Non string customMetaData should fail

//      Test 6 - Missing project ID Paramater should fail

//      Test 7 - Non UUID project ID Paramater should fail

//      Test 8 - Missing project ID Paramater should fail

//      Test 9 - Non-existing project ID Paramater should fail