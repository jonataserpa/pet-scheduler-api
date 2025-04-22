export default {
	presets: [
		[
			"@babel/preset-env",
			{
				targets: {
					node: "current",
				},
				modules: false,
			},
		],
		"@babel/preset-typescript",
	],
	plugins: [
		[
			"module-resolver",
			{
				root: ["./src"],
				alias: {
					"@domain": "./src/domain",
					"@application": "./src/application",
					"@infrastructure": "./src/infrastructure",
					"@presentation": "./src/presentation",
					"@shared": "./src/shared",
				},
			},
		],
	],
};
