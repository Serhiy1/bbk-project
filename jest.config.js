module.exports ={
    preset: "ts-jest",
    testEnvironment : "node",
    testMatch : ["**/**/*test.ts"],
    verbose: true,
    forceExit: true,
    testTimeout  : 50000,
    runner: 'jest-serial-runner',
    reporters: [
        "default", // Keep the default reporter for console outputs
        ["jest-junit", {
          outputDirectory: "./test-results", // Specify the output directory
          outputName: "junit.xml", // Specify the output file name
        }]
    ],
}