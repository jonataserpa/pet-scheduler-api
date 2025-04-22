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
	roots: ["<rootDir>/src"],

	// The glob patterns Jest uses to detect test files
	testMatch: ["<rootDir>/src/**/__tests__/**/*.ts", "<rootDir>/src/**/*.test.ts"],

	// Transform files
	transform: {
		"^.+\\.tsx?$": [
			"ts-jest",
			{
				useESM: true,
				// Não exigir extensões .js nas importações
				extensionsToTreatAsEsm: [".ts", ".tsx", ".mts"],
				moduleNameMapper: {
					"^(\\.{1,2}/.*)\\.js$": "$1",
				},
			},
		],
		"^.+\\.jsx?$": [
			"babel-jest",
			{
				presets: [["@babel/preset-env", { targets: { node: "current" } }]],
			},
		],
	},

	// Add extensionsToTreatAsEsm for ESM support
	extensionsToTreatAsEsm: [".ts", ".tsx", ".mts"],

	// Disable transformations for node_modules except for specific packages that use ESM
	transformIgnorePatterns: ["/node_modules/(?!(@prisma))"],

	// Set moduleNameMapper for absolute paths and .js extensions
	moduleNameMapper: {
		"^(\\.{1,2}/.*)\\.js$": "$1",
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

	collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.d.ts", "!src/index.ts", "!src/server.ts"],
};
