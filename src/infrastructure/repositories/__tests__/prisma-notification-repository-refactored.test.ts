import { PrismaClient } from "@prisma/client";
import { NotificationType, NotificationStatus } from "../../../domain/entities/notification.js";
import { Notification } from "../../../domain/entities/notification.js";
import { PrismaNotificationRepositoryRefactored } from "../prisma-notification-repository-refactored.js";
import { NotificationMapper } from "../../mappers/notification-mapper.js";
import { v4 as uuidv4 } from "uuid";

// Mock do cliente Prisma
const mockPrismaClient = {
	notification: {
		create: jest.fn(),
		update: jest.fn(),
		findUnique: jest.fn(),
		findMany: jest.fn(),
		count: jest.fn(),
		delete: jest.fn(),
	},
	$transaction: jest.fn((callback) => callback(mockPrismaClient)),
} as unknown as PrismaClient;

// Mock para PrismaTransaction
jest.mock("../../database/prisma-transaction.js", () => ({
	PrismaTransaction: jest.fn().mockImplementation(() => ({
		execute: jest.fn().mockImplementation((callback) => callback(mockPrismaClient)),
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

describe("PrismaNotificationRepositoryRefactored", () => {
	let repository: PrismaNotificationRepositoryRefactored;

	beforeEach(() => {
		jest.clearAllMocks();
		repository = new PrismaNotificationRepositoryRefactored(mockPrismaClient);
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
			const mockUpdatedNotification = {
				id,
				type: NotificationType.EMAIL,
				content: "Teste de notificação",
				schedulingId: uuidv4(),
				status: NotificationStatus.SENT,
				sentAt: new Date(),
			};

			mockPrismaClient.notification.update.mockResolvedValue(mockUpdatedNotification);
			mockPrismaClient.notification.findUnique.mockResolvedValue(mockUpdatedNotification);

			// Spy no NotificationMapper
			const toDomainSpy = jest
				.spyOn(NotificationMapper, "toDomain")
				.mockReturnValue(
					Notification.create(
						id,
						NotificationType.EMAIL,
						"Teste de notificação",
						mockUpdatedNotification.schedulingId,
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

			expect(toDomainSpy).toHaveBeenCalled();
			expect(result).toBeDefined();
			expect(result.status).toBe(NotificationStatus.SENT);
		});

		it("deve atualizar o conteúdo usando transação", async () => {
			// Arrange
			const id = uuidv4();
			const content = "Novo conteúdo da notificação";
			const mockUpdatedNotification = {
				id,
				type: NotificationType.EMAIL,
				content,
				schedulingId: uuidv4(),
				status: NotificationStatus.PENDING,
				sentAt: new Date(),
			};

			mockPrismaClient.notification.update.mockResolvedValue(mockUpdatedNotification);
			mockPrismaClient.notification.findUnique.mockResolvedValue(mockUpdatedNotification);

			// Spy no NotificationMapper
			const toDomainSpy = jest
				.spyOn(NotificationMapper, "toDomain")
				.mockReturnValue(
					Notification.create(
						id,
						NotificationType.EMAIL,
						content,
						mockUpdatedNotification.schedulingId,
						NotificationStatus.PENDING,
						new Date(),
					),
				);

			// Act
			const result = await repository.updateContent(id, content);

			// Assert
			expect(mockPrismaClient.notification.update).toHaveBeenCalledWith({
				where: { id },
				data: { content },
			});

			expect(mockPrismaClient.notification.findUnique).toHaveBeenCalledWith({
				where: { id },
			});

			expect(toDomainSpy).toHaveBeenCalled();
			expect(result).toBeDefined();
			expect(result.content).toBe(content);
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
					sentAt: new Date(),
				},
				{
					id: uuidv4(),
					type: NotificationType.EMAIL,
					content: "Teste de notificação 2",
					schedulingId: uuidv4(),
					status: NotificationStatus.PENDING,
					sentAt: new Date(),
				},
			];

			mockPrismaClient.notification.findMany.mockResolvedValue(mockNotifications);

			// Spy no NotificationMapper
			jest
				.spyOn(NotificationMapper, "toDomain")
				.mockImplementation((prismaNotification) =>
					Notification.create(
						prismaNotification.id,
						prismaNotification.type,
						prismaNotification.content,
						prismaNotification.schedulingId,
						prismaNotification.status,
						prismaNotification.sentAt,
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
