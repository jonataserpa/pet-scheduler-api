import { jest } from "@jest/globals";
import { PrismaClient, Prisma } from "@prisma/client";
import { NotificationType, NotificationStatus } from "../../../domain/entities/notification.js";
import { Notification } from "../../../domain/entities/notification.js";
import { PrismaNotificationRepositoryRefactored } from "../prisma-notification-repository-refactored.js";
import { NotificationMapper } from "../../mappers/notification-mapper.js";
import { v4 as uuidv4 } from "uuid";
import { MockNotificationModel, MockPrismaClient, PrismaCallback } from "./mock-types.d.ts";

// Mock do cliente Prisma
const mockPrismaClient = {
	notification: {
		create: jest.fn(),
		update: jest.fn(),
		findMany: jest.fn(),
		findUnique: jest.fn(),
		count: jest.fn(),
		delete: jest.fn(),
	},
	$transaction: jest.fn((callback: PrismaCallback<unknown>) =>
		callback(mockPrismaClient as unknown as PrismaClient),
	),
};

// Usamos type assertion para o PrismaClient
const prismaClientMock = mockPrismaClient as unknown as PrismaClient;

// Mock para PrismaTransaction
jest.mock("../../database/prisma-transaction.js", () => ({
	PrismaTransaction: jest.fn().mockImplementation(() => ({
		execute: jest.fn((callback: PrismaCallback<PrismaClient>) => callback(prismaClientMock)),
		executeMultiple: jest.fn(),
	})),
}));

// Mock para o logger
jest.mock("../../../shared/utils/logger.js", () => ({
	logger: {
		info: jest.fn(),
		error: jest.fn(),
		warn: jest.fn(),
		debug: jest.fn(),
	},
}));

// Mock para o NotificationMapper
const originalToDomain = NotificationMapper.toDomain;
const originalCopyNotification = NotificationMapper.copyNotification;

describe("PrismaNotificationRepositoryRefactored", () => {
	let repository: PrismaNotificationRepositoryRefactored;

	beforeEach(() => {
		jest.clearAllMocks();
		// Restaurar implementações originais dos métodos mockados
		if (jest.isMockFunction(NotificationMapper.toDomain)) {
			NotificationMapper.toDomain = originalToDomain;
		}
		if (jest.isMockFunction(NotificationMapper.copyNotification)) {
			NotificationMapper.copyNotification = originalCopyNotification;
		}
		repository = new PrismaNotificationRepositoryRefactored(prismaClientMock);
	});

	describe("create", () => {
		it("deve criar uma nova notificação", async () => {
			// Arrange
			const id = uuidv4();
			const type = NotificationType.EMAIL;
			const content = "Teste de notificação";
			const schedulingId = uuidv4();

			const mockNotification = {
				id,
				type,
				content,
				schedulingId,
				status: NotificationStatus.PENDING,
				sentAt: new Date(),
			};

			mockPrismaClient.notification.create.mockResolvedValue(mockNotification);

			// Spy no NotificationMapper
			const toDomainSpy = jest
				.spyOn(NotificationMapper, "toDomain")
				.mockReturnValue(
					Notification.create(
						id,
						type,
						content,
						schedulingId,
						NotificationStatus.PENDING,
						new Date(),
					),
				);

			// Act
			const result = await repository.create(id, type, content, schedulingId);

			// Assert
			expect(mockPrismaClient.notification.create).toHaveBeenCalledWith({
				data: {
					id,
					type,
					content,
					schedulingId,
					status: NotificationStatus.PENDING,
					sentAt: expect.any(Date),
				},
			});

			expect(toDomainSpy).toHaveBeenCalled();
			expect(result).toBeDefined();
			expect(result.id).toBe(id);
			expect(result.type).toBe(type);
			expect(result.content).toBe(content);
			expect(result.schedulingId).toBe(schedulingId);
			expect(result.status).toBe(NotificationStatus.PENDING);
		});

		it("deve lançar erro quando criar com dados inválidos", async () => {
			// Arrange
			const id = uuidv4();
			const type = NotificationType.EMAIL;

			// Act & Assert
			await expect(repository.create(id, type, "", uuidv4())).rejects.toThrow();
			await expect(repository.create(id, type, "Content", "")).rejects.toThrow();
			await expect(repository.create("", type, "Content", uuidv4())).rejects.toThrow();
		});
	});

	describe("operações de status", () => {
		it("deve marcar uma notificação como enviada", async () => {
			// Arrange
			const id = uuidv4();
			const mockNotificationPending = {
				id,
				type: NotificationType.EMAIL,
				content: "Teste de notificação",
				schedulingId: uuidv4(),
				status: NotificationStatus.PENDING,
				sentAt: null,
			};

			const mockNotificationSent = {
				...mockNotificationPending,
				status: NotificationStatus.SENT,
				sentAt: new Date(),
			};

			// Mock inicial retorna notificação PENDING
			mockPrismaClient.notification.findUnique.mockResolvedValue(mockNotificationPending);
			// Mock update retorna a notificação já com SENT
			mockPrismaClient.notification.update.mockResolvedValue(mockNotificationSent);

			// Primeiro retorna PENDING, depois SENT
			jest
				.spyOn(NotificationMapper, "toDomain")
				.mockImplementationOnce(() =>
					Notification.create(
						id,
						NotificationType.EMAIL,
						"Teste de notificação",
						mockNotificationPending.schedulingId,
						NotificationStatus.PENDING,
						undefined,
					),
				)
				.mockImplementationOnce(() =>
					Notification.create(
						id,
						NotificationType.EMAIL,
						"Teste de notificação",
						mockNotificationPending.schedulingId,
						NotificationStatus.SENT,
						new Date(),
					),
				);

			// Act
			const result = await repository.markAsSent(id);

			// Assert
			expect(mockPrismaClient.notification.update).toHaveBeenCalledWith({
				where: { id },
				data: {
					status: NotificationStatus.SENT,
				},
			});

			expect(mockPrismaClient.notification.findUnique).toHaveBeenCalledWith({
				where: { id },
			});

			expect(result).toBeDefined();
			expect(result.status).toBe(NotificationStatus.SENT);
		});

		it("deve atualizar o conteúdo usando transação quando status é PENDING", async () => {
			// Arrange
			const id = uuidv4();
			const oldContent = "Conteúdo original";
			const newContent = "Novo conteúdo da notificação";

			// Preparar uma notificação com status PENDING no banco
			const pendingNotification = {
				id,
				type: "EMAIL",
				content: oldContent,
				schedulingId: uuidv4(),
				status: "PENDING",
				sentAt: null,
			};

			// Preparar a notificação com o conteúdo atualizado
			const updatedNotification = {
				...pendingNotification,
				content: newContent,
			};

			// Configurar os mocks do Prisma
			// Simulando consultas do banco: primeiro retorna a notificação com status PENDING
			mockPrismaClient.notification.findUnique.mockResolvedValue(pendingNotification);
			mockPrismaClient.notification.update.mockResolvedValue(updatedNotification);

			// Mock da entidade de domínio para simular exatamente a validação real
			// Primeiro, criamos uma notificação de domínio para o teste
			const pendingDomainNotification = Notification.create(
				id,
				NotificationType.EMAIL,
				oldContent,
				pendingNotification.schedulingId,
				NotificationStatus.PENDING,
				null,
			);

			// Mock apenas o método toDomain para retornar nossa instância de domínio controlada
			jest.spyOn(NotificationMapper, "toDomain").mockReturnValue(pendingDomainNotification);

			// Não mockamos copyNotification para usar a implementação real
			// Então toDomain retorna uma notificação com status PENDING e updateContent vai funcionar

			// Act - Chamar o método que estamos testando
			const result = await repository.updateContent(id, newContent);

			// Assert - Verificar os resultados esperados
			expect(mockPrismaClient.notification.findUnique).toHaveBeenCalledWith({
				where: { id },
			});

			expect(mockPrismaClient.notification.update).toHaveBeenCalledWith({
				where: { id },
				data: { content: newContent },
			});

			// Verificar que temos o resultado esperado
			expect(result).toBeDefined();
			expect(result.id).toBe(id);
			expect(result.content).toBe(newContent);
			expect(result.status).toBe(NotificationStatus.PENDING);
		});
	});

	describe("findAll e count", () => {
		it("deve buscar notificações com filtros", async () => {
			// Arrange
			const filter = {
				type: NotificationType.EMAIL,
				status: NotificationStatus.PENDING,
			};

			const mockNotifications = [
				{
					id: uuidv4(),
					type: NotificationType.EMAIL,
					content: "Teste de notificação 1",
					schedulingId: uuidv4(),
					status: NotificationStatus.PENDING,
					sentAt: null,
				},
				{
					id: uuidv4(),
					type: NotificationType.EMAIL,
					content: "Teste de notificação 2",
					schedulingId: uuidv4(),
					status: NotificationStatus.PENDING,
					sentAt: null,
				},
			];

			mockPrismaClient.notification.findMany.mockResolvedValue(mockNotifications);

			// Spy no NotificationMapper
			jest
				.spyOn(NotificationMapper, "toDomain")
				.mockImplementation((prismaNotification) =>
					Notification.create(
						prismaNotification.id,
						prismaNotification.type as NotificationType,
						prismaNotification.content,
						prismaNotification.schedulingId,
						prismaNotification.status as NotificationStatus,
						undefined,
					),
				);

			// Act
			const result = await repository.findAll(filter, 10, 0);

			// Assert
			expect(mockPrismaClient.notification.findMany).toHaveBeenCalled();
			expect(result).toHaveLength(2);
		});

		it("deve contar notificações com filtros", async () => {
			// Arrange
			const filter = {
				type: NotificationType.EMAIL,
				status: NotificationStatus.PENDING,
			};

			mockPrismaClient.notification.count.mockResolvedValue(5);

			// Act
			const result = await repository.count(filter);

			// Assert
			expect(mockPrismaClient.notification.count).toHaveBeenCalled();
			expect(result).toBe(5);
		});
	});
});
