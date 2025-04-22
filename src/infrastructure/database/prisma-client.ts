import { PrismaClient, Prisma } from "@prisma/client";
import { logger } from "../../shared/utils/logger.js";

// Tipos para os eventos do Prisma
type QueryEvent = {
	query: string;
	params: string;
	duration: number;
	target: string;
};

type LogEvent = {
	message: string;
	target: string;
};

// Extensão do PrismaClient com logs
class PrismaClientWithLogs extends PrismaClient {
	constructor() {
		super({
			log: [
				{
					emit: "event",
					level: "query",
				},
				{
					emit: "event",
					level: "error",
				},
				{
					emit: "event",
					level: "info",
				},
				{
					emit: "event",
					level: "warn",
				},
			],
		});

		// Tipagem para compatibilidade com Prisma 5.10.0
		// @ts-expect-error: Prisma Events Typings
		this.$on("query", (e: QueryEvent) => {
			logger.debug("Prisma Query", {
				query: e.query,
				params: e.params,
				duration: `${e.duration}ms`,
			});
		});

		// @ts-expect-error: Prisma Events Typings
		this.$on("error", (e: LogEvent) => {
			logger.error("Prisma Error", {
				message: e.message,
				target: e.target,
			});
		});

		// @ts-expect-error: Prisma Events Typings
		this.$on("info", (e: LogEvent) => {
			logger.info("Prisma Info", {
				message: e.message,
				target: e.target,
			});
		});

		// @ts-expect-error: Prisma Events Typings
		this.$on("warn", (e: LogEvent) => {
			logger.warn("Prisma Warn", {
				message: e.message,
				target: e.target,
			});
		});
	}

	// Helper para executar operações em uma transação
	async executeInTransaction<T>(
		callback: (prisma: Prisma.TransactionClient) => Promise<T>,
	): Promise<T> {
		return this.$transaction(async (prisma: Prisma.TransactionClient) => {
			return callback(prisma);
		});
	}
}

// Singleton do cliente Prisma
const prismaClient = new PrismaClientWithLogs();

// Função para garantir a conexão com o banco de dados
export async function connectDatabase(): Promise<void> {
	try {
		await prismaClient.$connect();
		logger.info("✅ Conexão com o banco de dados estabelecida");
	} catch (error) {
		logger.error("❌ Falha ao conectar com o banco de dados:", error);
		throw error;
	}
}

// Função para desconectar do banco de dados
export async function disconnectDatabase(): Promise<void> {
	try {
		await prismaClient.$disconnect();
		logger.info("🔌 Desconectado do banco de dados");
	} catch (error) {
		logger.error("❌ Falha ao desconectar do banco de dados:", error);
		throw error;
	}
}

// Exporta o cliente Prisma para uso global
export { prismaClient };
