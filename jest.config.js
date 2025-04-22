export default {
	// Use Node.js environment for testing
	testEnvironment: "node",

	// Automatically clear mock calls between every test
	clearMocks: true,

	// Indicates whether the coverage information should be collected while executing the test
	collectCoverage: false,

	// The directory where Jest should output its coverage files
	coverageDirectory: "coverage",

	// A list of paths to directories that Jest should use to search for files in
	roots: ["<rootDir>/tests"],

	// The glob patterns Jest uses to detect test files
	testMatch: ["**/__tests__/**/*.js", "**/?(*.)+(spec|test).js", "**/tests/*.test.js"],

	// Transform files
	transform: {
		"^.+\\.tsx?$": [
			"ts-jest",
			{
				useESM: true,
			},
		],
	},

	// Disable transformations for node_modules
	transformIgnorePatterns: ["/node_modules/"],

	// Set moduleNameMapper for absolute paths
	moduleNameMapper: {
		"^@domain/(.*)$": "<rootDir>/src/domain/$1",
		"^@application/(.*)$": "<rootDir>/src/application/$1",
		"^@infrastructure/(.*)$": "<rootDir>/src/infrastructure/$1",
		"^@presentation/(.*)$": "<rootDir>/src/presentation/$1",
		"^@shared/(.*)$": "<rootDir>/src/shared/$1",
	},

	// Setup module aliases
	moduleDirectories: ["node_modules", "<rootDir>"],

	// Configure test coverage thresholds
	coverageThreshold: {
		global: {
			branches: 80,
			functions: 80,
			lines: 80,
			statements: 80,
		},
	},

	// Generate coverage report in these formats
	coverageReporters: ["text", "lcov"],

	// Verbose output
	verbose: true,

	// Setup file
	setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],

	collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.d.ts", "!src/index.ts", "!src/server.ts"],
};
