import { RequestHandler } from "express";
import { AuthenticatedRequest } from "./auth-middleware.js";

/**
 * Converte um handler que recebe AuthenticatedRequest para um RequestHandler padrão do Express
 * Isso resolve problemas de tipagem ao usar middleware de autenticação
 */
export function asAuthHandler(
	handler: (req: AuthenticatedRequest, res: any, next: any) => any,
): RequestHandler {
	return handler as unknown as RequestHandler;
}
