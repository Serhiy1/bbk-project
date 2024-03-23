module.exports ={
    preset: "ts-jest",
    testEnvironment : "node",
    testMatch : ["**/**/*test.ts"],
    coveragePathIgnorePatterns: [
      "<rootDir>/src/app/app.ts",
      "<rootDir>/src/app/server.ts",
      "<rootDir>/src/app/utils/utils.ts",
    ],
    verbose: true,
    forceExit: true,
    testTimeout  : 50000,
    globalSetup: "<rootDir>/src/test/utils/globalSetup.ts",
    globalTeardown: "<rootDir>/src/test/utils/globalTeardown.ts",
    setupFilesAfterEnv : ["<rootDir>/src/test/utils/SetupFile.ts"],
    maxWorkers: 2,
    reporters: [
        "default", // Keep the default reporter for console outputs
        ["jest-junit", {
          outputDirectory: "./test-results", // Specify the output directory
          outputName: "junit.xml", // Specify the output file name
        }]
    ],
}