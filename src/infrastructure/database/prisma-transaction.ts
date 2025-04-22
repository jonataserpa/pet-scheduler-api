import { PrismaClient, Prisma } from "@prisma/client";
import { logger } from "../../shared/utils/logger.js";

/**
 * Gerenciador de transação para o Prisma
 */
export class PrismaTransaction {
	private readonly prisma: PrismaClient;

	constructor(prisma: PrismaClient) {
		this.prisma = prisma;
	}

	/**
	 * Executa uma operação dentro de uma transação
	 * @param operation Função que recebe um cliente de transação e retorna uma Promise
	 * @returns Resultado da operação
	 */
	async execute<T>(operation: (prisma: Prisma.TransactionClient) => Promise<T>): Promise<T> {
		try {
			const result = await this.prisma.$transaction(operation);
			return result;
		} catch (error) {
			logger.error("Erro durante a transação do Prisma:", error);
			throw error;
		}
	}

	/**
	 * Executa várias operações de forma atômica dentro de uma transação
	 * @param operations Lista de operações para executar na transação
	 * @returns Array com os resultados de cada operação
	 */
	async executeMultiple<T extends unknown[]>(
		operations: ((prisma: Prisma.TransactionClient) => Promise<any>)[],
	): Promise<T> {
		return this.execute(async (prisma: Prisma.TransactionClient) => {
			const results: any[] = [];

			for (const operation of operations) {
				const result = await operation(prisma);
				results.push(result);
			}

			return results as T;
		});
	}
}

/**
 * Factory para criar transações do Prisma
 */
export function createPrismaTransaction(prisma: PrismaClient): PrismaTransaction {
	return new PrismaTransaction(prisma);
}
