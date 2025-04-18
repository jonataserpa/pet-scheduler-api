/**
 * tools/validate-dependencies.js
 * Tool for validating task dependencies
 */

import { z } from 'zod';
import {
	handleApiResult,
	createErrorResponse,
	getProjectRootFromSession
} from './utils.js';
import { validateDependenciesDirect } from '../core/task-master-core.js';
import { findTasksJsonPath } from '../core/utils/path-utils.js';

/**
 * Register the validateDependencies tool with the MCP server
 * @param {Object} server - FastMCP server instance
 */
export function registerValidateDependenciesTool(server) {
	server.addTool({
		name: 'validate_dependencies',
		description:
			'Check tasks for dependency issues (like circular references or links to non-existent tasks) without making changes.',
		parameters: z.object({
			file: z.string().optional().describe('Absolute path to the tasks file'),
			projectRoot: z
				.string()
				.describe('The directory of the project. Must be an absolute path.')
		}),
		execute: async (args, { log, session }) => {
			try {
				log.info(`Validating dependencies with args: ${JSON.stringify(args)}`);

				// Get project root from args or session
				const rootFolder =
					args.projectRoot || getProjectRootFromSession(session, log);

				if (!rootFolder) {
					return createErrorResponse(
						'Could not determine project root. Please provide it explicitly or ensure your session contains valid root information.'
					);
				}

				let tasksJsonPath;
				try {
					tasksJsonPath = findTasksJsonPath(
						{ projectRoot: rootFolder, file: args.file },
						log
					);
				} catch (error) {
					log.error(`Error finding tasks.json: ${error.message}`);
					return createErrorResponse(
						`Failed to find tasks.json: ${error.message}`
					);
				}

				const result = await validateDependenciesDirect(
					{
						tasksJsonPath: tasksJsonPath
					},
					log
				);

				if (result.success) {
					log.info(
						`Successfully validated dependencies: ${result.data.message}`
					);
				} else {
					log.error(`Failed to validate dependencies: ${result.error.message}`);
				}

				return handleApiResult(result, log, 'Error validating dependencies');
			} catch (error) {
				log.error(`Error in validateDependencies tool: ${error.message}`);
				return createErrorResponse(error.message);
			}
		}
	});
}
