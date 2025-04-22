import { jest } from "@jest/globals";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { LoginHistory, LoginStatus, AuthMethod } from "../../../domain/entities/login-history.js";
import { PrismaLoginHistoryRepository } from "../prisma-login-history-repository.js";
import { PrismaCallbackSync } from "./mock-types.d.ts";

// Definindo tipo para facilitar o uso do callback
type PrismaCallback<T> = (prisma: PrismaClient) => T;

// Mock do cliente Prisma
jest.mock("@prisma/client", () => {
	// Criar mocks com funções Jest
	const mockCreate = jest.fn();
	const mockFindUnique = jest.fn();
	const mockFindMany = jest.fn();
	const mockCount = jest.fn();

	return {
		PrismaClient: jest.fn().mockImplementation(() => ({
			loginHistory: {
				create: mockCreate,
				findUnique: mockFindUnique,
				findMany: mockFindMany,
				count: mockCount,
			},
			$transaction: jest.fn((callback: PrismaCallback<any>) =>
				callback({
					loginHistory: {
						create: mockCreate,
						findUnique: mockFindUnique,
						findMany: mockFindMany,
						count: mockCount,
					},
				}),
			),
		})),
	};
});

// Constantes para os status em ambos os formatos (domínio e Prisma)
const DOMAIN_STATUS = {
	SUCCESS: "success",
	FAILED: "failed",
	SUSPICIOUS: "suspicious",
};

const PRISMA_STATUS = {
	SUCCESS: "SUCCESS",
	FAILED: "FAILED",
	SUSPICIOUS: "SUSPICIOUS",
};

// Constantes para os métodos de autenticação em ambos os formatos
const DOMAIN_AUTH_METHODS = {
	PASSWORD: "password",
	GOOGLE: "google",
	FACEBOOK: "facebook",
	GITHUB: "github",
	TOKEN: "token",
	RECOVERY: "recovery",
};

const PRISMA_AUTH_METHODS = {
	PASSWORD: "PASSWORD",
	GOOGLE: "GOOGLE",
	FACEBOOK: "FACEBOOK",
	GITHUB: "GITHUB",
	TOKEN: "TOKEN",
	RECOVERY: "RECOVERY",
};

// Mock do LoginHistory antes da importação
jest.mock("../../../domain/entities/login-history.js", () => ({
	LoginHistory: {
		create: jest
			.fn()
			.mockImplementation(
				(
					id,
					userId,
					email,
					status,
					timestamp,
					ipAddress,
					userAgent,
					location,
					authMethod,
					details,
				) => ({
					id,
					userId,
					email,
					status,
					timestamp,
					ipAddress,
					userAgent,
					location,
					authMethod,
					details,
					toObject: () => ({
						id,
						userId,
						email,
						status,
						timestamp,
						ipAddress,
						userAgent,
						location,
						authMethod,
						details,
					}),
				}),
			),
		createSuccessLogin: jest.fn(),
		createFailedLogin: jest.fn(),
		createSuspiciousLogin: jest.fn(),
	},
	AuthMethod: {
		PASSWORD: "password",
		GOOGLE: "google",
		FACEBOOK: "facebook",
		GITHUB: "github",
		TOKEN: "token",
		RECOVERY: "recovery",
	},
}));

// Mock do login-history-repository
jest.mock("../../../domain/repositories/login-history-repository.js", () => ({
	LoginHistoryRepository: jest.fn(),
}));

describe("PrismaLoginHistoryRepository", () => {
	let repository: PrismaLoginHistoryRepository;
	let prismaClient: PrismaClient;

	beforeEach(() => {
		jest.clearAllMocks();
		// Recria o mock para cada teste
		prismaClient = {
			loginHistory: {
				create: jest.fn(),
				findUnique: jest.fn(),
				findMany: jest.fn(),
				count: jest.fn(),
			},
			$transaction: jest.fn((callback: PrismaCallback<any>) => callback(prismaClient)),
		};

		// Assegura que estamos usando diretamente os mocks do Jest
		repository = new PrismaLoginHistoryRepository(prismaClient);
	});

	describe("save", () => {
		it("deve salvar um histórico de login com sucesso", async () => {
			// Arrange
			const id = uuidv4();
			const userId = uuidv4();
			const email = "user@example.com";
			// Uso do status no formato do domínio (minúsculas)
			const status = DOMAIN_STATUS.SUCCESS;
			const ipAddress = "192.168.1.1";
			const userAgent = "Mozilla/5.0";
			const timestamp = new Date();
			// Uso do authMethod no formato do domínio (minúsculas)
			const authMethod = DOMAIN_AUTH_METHODS.PASSWORD;
			const details = { reason: "Login bem-sucedido" };
			const location = { country: "Brasil", city: "São Paulo" };

			const loginHistory = LoginHistory.create(
				id,
				userId,
				email,
				status as any,
				timestamp,
				ipAddress,
				userAgent,
				location,
				authMethod as any,
				details,
			);

			const mockCreatedLoginHistory = {
				id,
				userId,
				email,
				// Aqui esperamos o valor já convertido para o formato do Prisma
				status: PRISMA_STATUS.SUCCESS,
				timestamp,
				ipAddress,
				userAgent,
				// Aqui esperamos o valor já convertido para o formato do Prisma
				authMethod: PRISMA_AUTH_METHODS.PASSWORD,
				details,
				location,
			};

			prismaClient.loginHistory.create.mockResolvedValue(mockCreatedLoginHistory);

			// Act
			await repository.save(loginHistory);

			// Assert
			// Verificamos que no Prisma, os valores enviados são em maiúsculas (formato do Prisma)
			expect(prismaClient.loginHistory.create).toHaveBeenCalledWith({
				data: {
					id,
					userId,
					email,
					status: PRISMA_STATUS.SUCCESS,
					timestamp,
					ipAddress,
					userAgent,
					authMethod: PRISMA_AUTH_METHODS.PASSWORD,
					details,
					location,
				},
			});
		});
	});

	describe("findAll", () => {
		it("deve retornar históricos de login de acordo com os filtros", async () => {
			// Arrange
			const mockLoginHistories = [
				{
					id: uuidv4(),
					userId: uuidv4(),
					email: "user1@example.com",
					status: PRISMA_STATUS.SUCCESS,
					timestamp: new Date(),
					ipAddress: "192.168.1.1",
					userAgent: "Mozilla/5.0",
					authMethod: PRISMA_AUTH_METHODS.PASSWORD,
					details: null,
					location: null,
				},
				{
					id: uuidv4(),
					userId: uuidv4(),
					email: "user2@example.com",
					status: PRISMA_STATUS.FAILED,
					timestamp: new Date(),
					ipAddress: "192.168.1.2",
					userAgent: "Chrome/90.0",
					authMethod: PRISMA_AUTH_METHODS.PASSWORD,
					details: { reason: "Senha incorreta" },
					location: null,
				},
			];

			prismaClient.loginHistory.findMany.mockResolvedValue(mockLoginHistories);

			// Act
			// Passamos o status no formato do domínio (minúsculas)
			const result = await repository.findAll({ status: DOMAIN_STATUS.SUCCESS as any }, 1, 10);

			// Capture o valor real passado para o mock para verificação
			const actualCall = prismaClient.loginHistory.findMany.mock.calls[0][0];
			expect(prismaClient.loginHistory.findMany).toHaveBeenCalled();
			expect(actualCall).toEqual(
				expect.objectContaining({
					where: expect.any(Object),
					orderBy: { timestamp: "desc" },
				}),
			);

			expect(result).toHaveLength(2);
			expect(result[0].email).toBe("user1@example.com");
		});
	});

	describe("findById", () => {
		it("deve retornar um histórico de login por ID", async () => {
			// Arrange
			const id = uuidv4();
			const mockLoginHistory = {
				id,
				userId: uuidv4(),
				email: "user@example.com",
				status: PRISMA_STATUS.SUCCESS,
				timestamp: new Date(),
				ipAddress: "192.168.1.1",
				userAgent: "Mozilla/5.0",
				authMethod: PRISMA_AUTH_METHODS.PASSWORD,
				details: null,
				location: null,
			};

			prismaClient.loginHistory.findUnique.mockResolvedValue(mockLoginHistory);

			// Act
			const result = await repository.findById(id);

			// Assert
			expect(prismaClient.loginHistory.findUnique).toHaveBeenCalledWith({
				where: { id },
			});

			expect(result?.id).toBe(id);
			expect(result?.email).toBe("user@example.com");
		});

		it("deve retornar null quando o histórico não existe", async () => {
			// Arrange
			const id = uuidv4();
			prismaClient.loginHistory.findUnique.mockResolvedValue(null);

			// Act
			const result = await repository.findById(id);

			// Assert
			expect(prismaClient.loginHistory.findUnique).toHaveBeenCalledWith({
				where: { id },
			});

			expect(result).toBeNull();
		});
	});

	describe("countFailedAttempts", () => {
		it("deve contar tentativas falhas corretamente", async () => {
			// Arrange
			const email = "user@example.com";
			const timeWindowMinutes = 30;

			prismaClient.loginHistory.count.mockResolvedValue(3);

			// Act
			const result = await repository.countFailedAttempts(email, timeWindowMinutes);

			// Assert
			// Verificamos apenas que o método foi chamado, sem validar os parâmetros exatos
			expect(prismaClient.loginHistory.count).toHaveBeenCalled();
			const callArgs = prismaClient.loginHistory.count.mock.calls[0][0];
			expect(callArgs.where.email).toBe(email);
			expect(callArgs.where.status).toBe(PRISMA_STATUS.FAILED);
			expect(callArgs.where.timestamp.gte).toBeInstanceOf(Date);

			expect(result).toBe(3);
		});
	});

	describe("isSuspiciousIpActivity", () => {
		it("deve identificar atividade suspeita quando o número de falhas excede o limite", async () => {
			// Arrange
			const ipAddress = "192.168.1.1";
			const timeWindowMinutes = 30;
			const threshold = 5;

			prismaClient.loginHistory.count.mockResolvedValue(7);

			// Act
			const result = await repository.isSuspiciousIpActivity(
				ipAddress,
				timeWindowMinutes,
				threshold,
			);

			// Assert
			// Verificamos apenas que o método foi chamado, sem validar os parâmetros exatos
			expect(prismaClient.loginHistory.count).toHaveBeenCalled();
			const callArgs = prismaClient.loginHistory.count.mock.calls[0][0];
			expect(callArgs.where.ipAddress).toBe(ipAddress);
			expect(callArgs.where.status).toBe(PRISMA_STATUS.FAILED);
			expect(callArgs.where.timestamp.gte).toBeInstanceOf(Date);

			expect(result).toBe(true);
		});

		it("não deve identificar atividade suspeita quando o número de falhas é menor que o limite", async () => {
			// Arrange
			const ipAddress = "192.168.1.1";
			const timeWindowMinutes = 30;
			const threshold = 5;

			prismaClient.loginHistory.count.mockResolvedValue(3);

			// Act
			const result = await repository.isSuspiciousIpActivity(
				ipAddress,
				timeWindowMinutes,
				threshold,
			);

			// Assert
			expect(result).toBe(false);
		});
	});
});
