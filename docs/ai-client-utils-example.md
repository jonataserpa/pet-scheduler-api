# AI Client Utilities for MCP Tools

This document provides examples of how to use the new AI client utilities with AsyncOperationManager in MCP tools.

## Basic Usage with Direct Functions

```javascript
// In your direct function implementation:
import {
	getAnthropicClientForMCP,
	getModelConfig,
	handleClaudeError,
} from "../utils/ai-client-utils.js";

export async function someAiOperationDirect(args, log, context) {
	try {
		// Initialize Anthropic client with session from context
		const client = getAnthropicClientForMCP(context.session, log);

		// Get model configuration with defaults or session overrides
		const modelConfig = getModelConfig(context.session);

		// Make API call with proper error handling
		try {
			const response = await client.messages.create({
				model: modelConfig.model,
				max_tokens: modelConfig.maxTokens,
				temperature: modelConfig.temperature,
				messages: [{ role: "user", content: "Your prompt here" }],
			});

			return {
				success: true,
				data: response,
			};
		} catch (apiError) {
			// Use helper to get user-friendly error message
			const friendlyMessage = handleClaudeError(apiError);

			return {
				success: false,
				error: {
					code: "AI_API_ERROR",
					message: friendlyMessage,
				},
			};
		}
	} catch (error) {
		// Handle client initialization errors
		return {
			success: false,
			error: {
				code: "AI_CLIENT_ERROR",
				message: error.message,
			},
		};
	}
}
```

## Integration with AsyncOperationManager

```javascript
// In your MCP tool implementation:
import { AsyncOperationManager, StatusCodes } from "../../utils/async-operation-manager.js";
import { someAiOperationDirect } from "../../core/direct-functions/some-ai-operation.js";

export async function someAiOperation(args, context) {
	const { session, mcpLog } = context;
	const log = mcpLog || console;

	try {
		// Create operation description
		const operationDescription = `AI operation: ${args.someParam}`;

		// Start async operation
		const operation = AsyncOperationManager.createOperation(
			operationDescription,
			async (reportProgress) => {
				try {
					// Initial progress report
					reportProgress({
						progress: 0,
						status: "Starting AI operation...",
					});

					// Call direct function with session and progress reporting
					const result = await someAiOperationDirect(args, log, {
						reportProgress,
						mcpLog: log,
						session,
					});

					// Final progress update
					reportProgress({
						progress: 100,
						status: result.success ? "Operation completed" : "Operation failed",
						result: result.data,
						error: result.error,
					});

					return result;
				} catch (error) {
					// Handle errors in the operation
					reportProgress({
						progress: 100,
						status: "Operation failed",
						error: {
							message: error.message,
							code: error.code || "OPERATION_FAILED",
						},
					});
					throw error;
				}
			},
		);

		// Return immediate response with operation ID
		return {
			status: StatusCodes.ACCEPTED,
			body: {
				success: true,
				message: "Operation started",
				operationId: operation.id,
			},
		};
	} catch (error) {
		// Handle errors in the MCP tool
		log.error(`Error in someAiOperation: ${error.message}`);
		return {
			status: StatusCodes.INTERNAL_SERVER_ERROR,
			body: {
				success: false,
				error: {
					code: "OPERATION_FAILED",
					message: error.message,
				},
			},
		};
	}
}
```

## Using Research Capabilities with Perplexity

```javascript
// In your direct function:
import { getPerplexityClientForMCP, getBestAvailableAIModel } from "../utils/ai-client-utils.js";

export async function researchOperationDirect(args, log, context) {
	try {
		// Get the best AI model for this operation based on needs
		const { type, client } = await getBestAvailableAIModel(
			context.session,
			{ requiresResearch: true },
			log,
		);

		// Report which model we're using
		if (context.reportProgress) {
			await context.reportProgress({
				progress: 10,
				status: `Using ${type} model for research...`,
			});
		}

		// Make API call based on the model type
		if (type === "perplexity") {
			// Call Perplexity
			const response = await client.chat.completions.create({
				model: context.session?.env?.PERPLEXITY_MODEL || "sonar-medium-online",
				messages: [{ role: "user", content: args.researchQuery }],
				temperature: 0.1,
			});

			return {
				success: true,
				data: response.choices[0].message.content,
			};
		} else {
			// Call Claude as fallback
			// (Implementation depends on specific needs)
			// ...
		}
	} catch (error) {
		// Handle errors
		return {
			success: false,
			error: {
				code: "RESEARCH_ERROR",
				message: error.message,
			},
		};
	}
}
```

## Model Configuration Override Example

```javascript
// In your direct function:
import { getModelConfig } from "../utils/ai-client-utils.js";

// Using custom defaults for a specific operation
const operationDefaults = {
	model: "claude-3-haiku-20240307", // Faster, smaller model
	maxTokens: 1000, // Lower token limit
	temperature: 0.2, // Lower temperature for more deterministic output
};

// Get model config with operation-specific defaults
const modelConfig = getModelConfig(context.session, operationDefaults);

// Now use modelConfig in your API calls
const response = await client.messages.create({
	model: modelConfig.model,
	max_tokens: modelConfig.maxTokens,
	temperature: modelConfig.temperature,
	// Other parameters...
});
```

## Best Practices

1. **Error Handling**:

   - Always use try/catch blocks around both client initialization and API calls
   - Use `handleClaudeError` to provide user-friendly error messages
   - Return standardized error objects with code and message

2. **Progress Reporting**:

   - Report progress at key points (starting, processing, completing)
   - Include meaningful status messages
   - Include error details in progress reports when failures occur

3. **Session Handling**:

   - Always pass the session from the context to the AI client getters
   - Use `getModelConfig` to respect user settings from session

4. **Model Selection**:

   - Use `getBestAvailableAIModel` when you need to select between different models
   - Set `requiresResearch: true` when you need Perplexity capabilities

5. **AsyncOperationManager Integration**:
   - Create descriptive operation names
   - Handle all errors within the operation function
   - Return standardized results from direct functions
   - Return immediate responses with operation IDs
