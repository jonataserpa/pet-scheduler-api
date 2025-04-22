import { PrismaClient } from "@prisma/client";
import {
	LoginHistory,
	AuthMethod as DomainAuthMethod,
} from "../../domain/entities/login-history.js";
import {
	LoginHistoryFilter,
	LoginHistoryRepository,
} from "../../domain/repositories/login-history-repository.js";
import { logger } from "../../shared/utils/logger.js";

/**
 * Implementação do repositório de histórico de login usando Prisma
 */
export class PrismaLoginHistoryRepository implements LoginHistoryRepository {
	private readonly prisma: PrismaClient;

	constructor(prisma: PrismaClient) {
		this.prisma = prisma;
	}

	/**
	 * Mapeia um status de login do domínio para o prisma
	 */
	private mapDomainStatusToPrisma(
		status: string,
	): "SUCCESS" | "FAILED" | "LOCKED" | "PASSWORD_RESET" | "SUSPICIOUS" {
		switch (status) {
			case "success":
				return "SUCCESS";
			case "failed":
				return "FAILED";
			case "locked":
				return "LOCKED";
			case "password_reset":
				return "PASSWORD_RESET";
			case "suspicious":
				return "SUSPICIOUS";
			default:
				return "FAILED";
		}
	}

	/**
	 * Mapeia um status de login do prisma para o domínio
	 */
	private mapPrismaStatusToDomain(
		status: string,
	): "success" | "failed" | "locked" | "password_reset" | "suspicious" {
		switch (status) {
			case "SUCCESS":
				return "success";
			case "FAILED":
				return "failed";
			case "LOCKED":
				return "locked";
			case "PASSWORD_RESET":
				return "password_reset";
			case "SUSPICIOUS":
				return "suspicious";
			default:
				return "failed";
		}
	}

	/**
	 * Mapeia um método de autenticação do domínio para o prisma
	 */
	private mapDomainAuthMethodToPrisma(
		authMethod: DomainAuthMethod,
	): "PASSWORD" | "GOOGLE" | "FACEBOOK" | "GITHUB" | "TOKEN" | "RECOVERY" {
		switch (authMethod) {
			case "password":
				return "PASSWORD";
			case "google":
				return "GOOGLE";
			case "facebook":
				return "FACEBOOK";
			case "github":
				return "GITHUB";
			case "token":
				return "TOKEN";
			case "recovery":
				return "RECOVERY";
			default:
				return "PASSWORD";
		}
	}

	/**
	 * Mapeia um método de autenticação do prisma para o domínio
	 */
	private mapPrismaAuthMethodToDomain(
		authMethod: string,
	): "password" | "google" | "facebook" | "github" | "token" | "recovery" {
		switch (authMethod) {
			case "PASSWORD":
				return "password";
			case "GOOGLE":
				return "google";
			case "FACEBOOK":
				return "facebook";
			case "GITHUB":
				return "github";
			case "TOKEN":
				return "token";
			case "RECOVERY":
				return "recovery";
			default:
				return "password";
		}
	}

	/**
	 * Salva um registro de histórico de login
	 */
	async save(loginHistory: LoginHistory): Promise<void> {
		try {
			await this.prisma.loginHistory.create({
				data: {
					id: loginHistory.id,
					userId: loginHistory.userId,
					email: loginHistory.email,
					status: this.mapDomainStatusToPrisma(loginHistory.status),
					timestamp: loginHistory.timestamp,
					ipAddress: loginHistory.ipAddress,
					userAgent: loginHistory.userAgent,
					authMethod: this.mapDomainAuthMethodToPrisma(loginHistory.authMethod),
					details: loginHistory.details as any,
					location: loginHistory.location as any,
				},
			});
		} catch (error) {
			logger.error("Erro ao salvar histórico de login", { error, loginHistory });
			throw error;
		}
	}

	/**
	 * Recupera históricos de login de acordo com os filtros fornecidos
	 */
	async findAll(
		filter: LoginHistoryFilter,
		limit?: number,
		offset?: number,
	): Promise<LoginHistory[]> {
		try {
			const { email, userId, status, ipAddress, startDate, endDate } = filter;

			const loginHistories = await this.prisma.loginHistory.findMany({
				where: {
					email: email ? { equals: email } : undefined,
					userId: userId ? { equals: userId } : undefined,
					status: status ? { equals: this.mapDomainStatusToPrisma(status) } : undefined,
					ipAddress: ipAddress ? { equals: ipAddress } : undefined,
					timestamp: {
						gte: startDate,
						lte: endDate,
					},
				},
				take: limit,
				skip: offset,
				orderBy: {
					timestamp: "desc",
				},
			});

			return loginHistories.map((history: any) => this.mapToDomain(history));
		} catch (error) {
			logger.error("Erro ao buscar históricos de login", { error, filter });
			throw error;
		}
	}

	/**
	 * Recupera um histórico de login por ID
	 */
	async findById(id: string): Promise<LoginHistory | null> {
		try {
			const loginHistory = await this.prisma.loginHistory.findUnique({
				where: { id },
			});

			if (!loginHistory) {
				return null;
			}

			return this.mapToDomain(loginHistory);
		} catch (error) {
			logger.error("Erro ao buscar histórico de login por ID", { error, id });
			throw error;
		}
	}

	/**
	 * Recupera os últimos históricos de login para um determinado email
	 */
	async findRecentByEmail(email: string, limit: number): Promise<LoginHistory[]> {
		try {
			const loginHistories = await this.prisma.loginHistory.findMany({
				where: { email },
				take: limit,
				orderBy: {
					timestamp: "desc",
				},
			});

			return loginHistories.map((history: any) => this.mapToDomain(history));
		} catch (error) {
			logger.error("Erro ao buscar históricos recentes por email", { error, email, limit });
			throw error;
		}
	}

	/**
	 * Recupera os últimos históricos de login para um determinado usuário
	 */
	async findRecentByUserId(userId: string, limit: number): Promise<LoginHistory[]> {
		try {
			const loginHistories = await this.prisma.loginHistory.findMany({
				where: { userId },
				take: limit,
				orderBy: {
					timestamp: "desc",
				},
			});

			return loginHistories.map((history: any) => this.mapToDomain(history));
		} catch (error) {
			logger.error("Erro ao buscar históricos recentes por userId", { error, userId, limit });
			throw error;
		}
	}

	/**
	 * Conta o número de falhas de login para um determinado email em um período de tempo
	 */
	async countFailedAttempts(email: string, timeWindowMinutes: number): Promise<number> {
		try {
			const windowStartTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

			const count = await this.prisma.loginHistory.count({
				where: {
					email,
					status: "FAILED",
					timestamp: {
						gte: windowStartTime,
					},
				},
			});

			return count;
		} catch (error) {
			logger.error("Erro ao contar tentativas falhas", { error, email, timeWindowMinutes });
			throw error;
		}
	}

	/**
	 * Verifica se um determinado IP está sendo usado em muitas tentativas de login falhas
	 */
	async isSuspiciousIpActivity(
		ipAddress: string,
		timeWindowMinutes: number,
		threshold: number,
	): Promise<boolean> {
		try {
			const windowStartTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

			const count = await this.prisma.loginHistory.count({
				where: {
					ipAddress,
					status: "FAILED",
					timestamp: {
						gte: windowStartTime,
					},
				},
			});

			return count >= threshold;
		} catch (error) {
			logger.error("Erro ao verificar atividade suspeita de IP", {
				error,
				ipAddress,
				timeWindowMinutes,
				threshold,
			});
			throw error;
		}
	}

	/**
	 * Mapeia um objeto do Prisma para uma entidade de domínio
	 */
	private mapToDomain(prismaLoginHistory: any): LoginHistory {
		return LoginHistory.create(
			prismaLoginHistory.id,
			prismaLoginHistory.userId,
			prismaLoginHistory.email,
			this.mapPrismaStatusToDomain(prismaLoginHistory.status),
			prismaLoginHistory.timestamp,
			prismaLoginHistory.ipAddress,
			prismaLoginHistory.userAgent,
			prismaLoginHistory.location || null,
			this.mapPrismaAuthMethodToDomain(prismaLoginHistory.authMethod),
			prismaLoginHistory.details || null,
		);
	}
}
