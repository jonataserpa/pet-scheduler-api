// @ts-nocheck
import { jest } from "@jest/globals";
import { PrismaClient } from "@prisma/client";
import {
	Notification,
	NotificationType,
	NotificationStatus,
} from "../../../domain/entities/notification.js";
import { NotificationCache } from "../../../infrastructure/cache/notification-cache.js";
import { PrismaNotificationRepositoryCached } from "../prisma-notification-repository-cached.js";
import { v4 as uuidv4 } from "uuid";
import { PerformanceMonitor } from "../../../infrastructure/monitoring/performance-monitor.js";
import { NotificationRepository } from "../../../domain/repositories/notification-repository.js";
import { NotificationFilter } from "../../../domain/repositories/notification-repository";
import { PrismaNotificationRepositoryRefactored } from "../prisma-notification-repository-refactored";

// Mock do PerformanceMonitor
jest.mock("../../../infrastructure/monitoring/performance-monitor.js", () => ({
	PerformanceMonitor: jest.fn().mockImplementation(() => ({
		measure: jest.fn().mockImplementation((_, fn) => fn()),
		getMetrics: jest.fn().mockReturnValue({}),
	})),
}));

// Mock do Cache
const mockCache = {
	getNotification: jest.fn(),
	setNotification: jest.fn(),
	invalidateNotification: jest.fn(),
	getNotificationList: jest.fn(),
	setNotificationList: jest.fn(),
	invalidateAllLists: jest.fn(),
	connect: jest.fn().mockResolvedValue(true),
	disconnect: jest.fn().mockResolvedValue(true),
	isConnected: jest.fn().mockReturnValue(true),
};

// Mock para o Prisma Client
const mockNotificationModel = {
	findUnique: jest.fn(),
	findMany: jest.fn(),
	create: jest.fn(),
	update: jest.fn(),
	delete: jest.fn(),
};

// Criando uma estrutura completa para o mock do PrismaClient
const mockPrismaClient = {
	notification: mockNotificationModel,
	$transaction: jest.fn().mockImplementation((callback) => {
		if (typeof callback === "function") {
			return callback(mockPrismaClient);
		}
		return Promise.resolve(Array.isArray(callback) ? callback.map((p) => p) : callback);
	}),
} as unknown as PrismaClient;

// Mock para a implementação real do repositório base
jest.mock("../prisma-notification-repository-refactored");
const MockPrismaNotificationRepositoryRefactored =
	PrismaNotificationRepositoryRefactored as jest.MockedClass<
		typeof PrismaNotificationRepositoryRefactored
	>;

// Mock do repositório base para espiar operações
const baseRepositoryMock = {
	create: jest.fn(),
	findById: jest.fn(),
	findAll: jest.fn(),
	findPendingNotifications: jest.fn(),
	markAsSent: jest.fn(),
	markAsDelivered: jest.fn(),
	markAsFailed: jest.fn(),
	updateContent: jest.fn(),
	delete: jest.fn(),
	findBySchedulingId: jest.fn(),
	retry: jest.fn(),
	save: jest.fn(),
	count: jest.fn(),
};

// Configurando os métodos do mock para repositório base
MockPrismaNotificationRepositoryRefactored.prototype.create = baseRepositoryMock.create;
MockPrismaNotificationRepositoryRefactored.prototype.findById = baseRepositoryMock.findById;
MockPrismaNotificationRepositoryRefactored.prototype.findAll = baseRepositoryMock.findAll;
MockPrismaNotificationRepositoryRefactored.prototype.findPendingNotifications =
	baseRepositoryMock.findPendingNotifications;
MockPrismaNotificationRepositoryRefactored.prototype.markAsSent = baseRepositoryMock.markAsSent;
MockPrismaNotificationRepositoryRefactored.prototype.markAsDelivered =
	baseRepositoryMock.markAsDelivered;
MockPrismaNotificationRepositoryRefactored.prototype.markAsFailed = baseRepositoryMock.markAsFailed;
MockPrismaNotificationRepositoryRefactored.prototype.updateContent =
	baseRepositoryMock.updateContent;
MockPrismaNotificationRepositoryRefactored.prototype.delete = baseRepositoryMock.delete;
MockPrismaNotificationRepositoryRefactored.prototype.findBySchedulingId =
	baseRepositoryMock.findBySchedulingId;
MockPrismaNotificationRepositoryRefactored.prototype.retry = baseRepositoryMock.retry;
MockPrismaNotificationRepositoryRefactored.prototype.save = baseRepositoryMock.save;
MockPrismaNotificationRepositoryRefactored.prototype.count = baseRepositoryMock.count;

describe("PrismaNotificationRepositoryCached", () => {
	let repository: NotificationRepository;
	let monitor: PerformanceMonitor;

	beforeEach(() => {
		jest.clearAllMocks();
		monitor = new PerformanceMonitor();

		// O primeiro parâmetro não importa mais
		repository = new PrismaNotificationRepositoryCached(
			mockPrismaClient,
			mockCache as unknown as NotificationCache,
			monitor,
		);
	});

	describe("findById", () => {
		it("deve retornar notificação do cache quando disponível", async () => {
			// Arrange
			const notificationId = "928a18b3-0d0b-4cf2-8dc6-332a09ea5177";
			const cachedNotification = {
				id: notificationId,
				type: "EMAIL",
				content: { subject: "Test", body: "Test body" },
				status: "PENDING",
				schedulingId: "6ff0d5c6-e8a6-4f91-9216-adbdf7afaa73",
				createdAt: new Date(),
				updatedAt: new Date(),
			} as Notification;

			mockCache.getNotification.mockResolvedValue(cachedNotification);

			// Act
			const result = await repository.findById(notificationId);

			// Assert
			expect(mockCache.getNotification).toHaveBeenCalledWith(notificationId);
			expect(baseRepositoryMock.findById).not.toHaveBeenCalled();
			expect(result).toEqual(cachedNotification);
		});

		it("deve buscar do repositório base e atualizar cache quando não estiver em cache", async () => {
			// Arrange
			const notificationId = "928a18b3-0d0b-4cf2-8dc6-332a09ea5177";
			const dbNotification = {
				id: notificationId,
				type: "EMAIL",
				content: { subject: "Test", body: "Test body" },
				status: "PENDING",
				schedulingId: "6ff0d5c6-e8a6-4f91-9216-adbdf7afaa73",
				createdAt: new Date(),
				updatedAt: new Date(),
			} as Notification;

			mockCache.getNotification.mockResolvedValue(null);
			baseRepositoryMock.findById.mockResolvedValue(dbNotification);

			// Act
			const result = await repository.findById(notificationId);

			// Assert
			expect(mockCache.getNotification).toHaveBeenCalledWith(notificationId);
			expect(baseRepositoryMock.findById).toHaveBeenCalledWith(notificationId);
			expect(mockCache.setNotification).toHaveBeenCalledWith(dbNotification);
			expect(result).toEqual(dbNotification);
		});
	});

	describe("create", () => {
		it("deve criar notificação e atualizar cache", async () => {
			// Arrange
			const notificationId = "25667904-389b-47dc-8303-6eefaa967186";
			const notificationType = "EMAIL";
			const content = { subject: "Test", body: "Test body" };
			const schedulingId = "6ff0d5c6-e8a6-4f91-9216-adbdf7afaa73";

			const createdNotification = {
				id: notificationId,
				type: notificationType,
				content,
				status: "PENDING",
				schedulingId,
				createdAt: new Date(),
				updatedAt: new Date(),
			} as Notification;

			baseRepositoryMock.create.mockResolvedValue(createdNotification);

			// Act
			const result = await repository.create(
				notificationId,
				notificationType,
				content,
				schedulingId,
			);

			// Assert
			expect(baseRepositoryMock.create).toHaveBeenCalledWith(
				notificationId,
				notificationType,
				content,
				schedulingId,
				"PENDING",
			);
			expect(mockCache.setNotification).toHaveBeenCalledWith(createdNotification);
			expect(result).toEqual(createdNotification);
		});
	});

	describe("findAll", () => {
		it("deve retornar lista do cache quando disponível", async () => {
			// Arrange
			const filter = { type: "EMAIL" } as NotificationFilter;
			const limit = 10;
			const offset = 0;

			const cachedNotifications = [
				{
					id: "id1",
					type: "EMAIL",
					content: { subject: "Test 1", body: "Test body 1" },
					status: "PENDING",
					schedulingId: "scheduling1",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: "id2",
					type: "EMAIL",
					content: { subject: "Test 2", body: "Test body 2" },
					status: "PENDING",
					schedulingId: "scheduling2",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			] as Notification[];

			mockCache.getNotificationList.mockResolvedValue(cachedNotifications);

			// Act
			const result = await repository.findAll(filter, limit, offset);

			// Assert
			expect(mockCache.getNotificationList).toHaveBeenCalledWith({ ...filter, limit, offset });
			expect(baseRepositoryMock.findAll).not.toHaveBeenCalled();
			expect(result).toEqual(cachedNotifications);
		});

		it("deve buscar do repositório base e atualizar cache quando não estiver em cache", async () => {
			// Arrange
			const filter = { type: "EMAIL" } as NotificationFilter;
			const limit = 10;
			const offset = 0;

			const dbNotifications = [
				{
					id: "id1",
					type: "EMAIL",
					content: { subject: "Test 1", body: "Test body 1" },
					status: "PENDING",
					schedulingId: "scheduling1",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: "id2",
					type: "EMAIL",
					content: { subject: "Test 2", body: "Test body 2" },
					status: "PENDING",
					schedulingId: "scheduling2",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			] as Notification[];

			mockCache.getNotificationList.mockResolvedValue(null);
			baseRepositoryMock.findAll.mockResolvedValue(dbNotifications);

			// Act
			const result = await repository.findAll(filter, limit, offset);

			// Assert
			expect(mockCache.getNotificationList).toHaveBeenCalledWith({ ...filter, limit, offset });
			expect(baseRepositoryMock.findAll).toHaveBeenCalledWith(filter, limit, offset);
			expect(mockCache.setNotificationList).toHaveBeenCalledWith(
				dbNotifications,
				{ ...filter, limit, offset },
				60,
			);
			expect(result).toEqual(dbNotifications);
		});
	});

	describe("operações de mudança de status", () => {
		it("deve atualizar o cache após marcar como enviada", async () => {
			// Arrange
			const notificationId = "7f6c32ae-7194-4563-866d-9d42effa5cda";
			const updatedNotification = {
				id: notificationId,
				type: "EMAIL",
				content: { subject: "Test", body: "Test body" },
				status: "SENT",
				schedulingId: "scheduling1",
				createdAt: new Date(),
				updatedAt: new Date(),
				sentAt: new Date(),
			} as Notification;

			baseRepositoryMock.markAsSent.mockResolvedValue(updatedNotification);

			// Act
			const result = await repository.markAsSent(notificationId);

			// Assert
			expect(baseRepositoryMock.markAsSent).toHaveBeenCalledWith(notificationId, undefined);
			expect(mockCache.setNotification).toHaveBeenCalledWith(updatedNotification);
			expect(mockCache.invalidateAllLists).toHaveBeenCalled();
			expect(result).toEqual(updatedNotification);
		});

		it("deve atualizar o cache após marcar como entregue", async () => {
			// Arrange
			const notificationId = "7f6c32ae-7194-4563-866d-9d42effa5cda";
			const deliveredAt = new Date();
			const updatedNotification = {
				id: notificationId,
				type: "EMAIL",
				content: { subject: "Test", body: "Test body" },
				status: "DELIVERED",
				schedulingId: "scheduling1",
				createdAt: new Date(),
				updatedAt: new Date(),
				sentAt: new Date(),
				deliveredAt: deliveredAt,
			} as Notification;

			baseRepositoryMock.markAsDelivered.mockResolvedValue(updatedNotification);

			// Act
			const result = await repository.markAsDelivered(notificationId, deliveredAt);

			// Assert
			expect(baseRepositoryMock.markAsDelivered).toHaveBeenCalledWith(notificationId, deliveredAt);
			expect(mockCache.setNotification).toHaveBeenCalledWith(updatedNotification);
			expect(mockCache.invalidateAllLists).toHaveBeenCalled();
			expect(result).toEqual(updatedNotification);
		});

		it("deve atualizar o cache após marcar como falha", async () => {
			// Arrange
			const notificationId = "7f6c32ae-7194-4563-866d-9d42effa5cda";
			const failedAt = new Date();
			const reason = "Erro no serviço de email";
			const updatedNotification = {
				id: notificationId,
				type: "EMAIL",
				content: { subject: "Test", body: "Test body" },
				status: "FAILED",
				schedulingId: "scheduling1",
				createdAt: new Date(),
				updatedAt: new Date(),
				failedAt: failedAt,
				failureReason: reason,
			} as Notification;

			baseRepositoryMock.markAsFailed.mockResolvedValue(updatedNotification);

			// Act
			const result = await repository.markAsFailed(notificationId, reason, failedAt);

			// Assert
			expect(baseRepositoryMock.markAsFailed).toHaveBeenCalledWith(
				notificationId,
				reason,
				failedAt,
			);
			expect(mockCache.setNotification).toHaveBeenCalledWith(updatedNotification);
			expect(mockCache.invalidateAllLists).toHaveBeenCalled();
			expect(result).toEqual(updatedNotification);
		});

		it("deve atualizar o cache após preparar para reenvio", async () => {
			// Arrange
			const notificationId = "7f6c32ae-7194-4563-866d-9d42effa5cda";
			const updatedNotification = {
				id: notificationId,
				type: "EMAIL",
				content: { subject: "Test", body: "Test body" },
				status: "PENDING",
				schedulingId: "scheduling1",
				createdAt: new Date(),
				updatedAt: new Date(),
				retriedAt: new Date(),
			} as Notification;

			baseRepositoryMock.retry.mockResolvedValue(updatedNotification);

			// Act
			const result = await repository.retry(notificationId);

			// Assert
			expect(baseRepositoryMock.retry).toHaveBeenCalledWith(notificationId);
			expect(mockCache.setNotification).toHaveBeenCalledWith(updatedNotification);
			expect(mockCache.invalidateAllLists).toHaveBeenCalled();
			expect(result).toEqual(updatedNotification);
		});
	});

	describe("delete", () => {
		it("deve excluir a notificação e limpar o cache", async () => {
			// Arrange
			const notificationId = "6137bb63-e5af-419a-9677-f4c16ed147e6";

			baseRepositoryMock.delete.mockResolvedValue(undefined);

			// Act
			await repository.delete(notificationId);

			// Assert
			expect(baseRepositoryMock.delete).toHaveBeenCalledWith(notificationId);
			expect(mockCache.invalidateNotification).toHaveBeenCalledWith(notificationId);
			expect(mockCache.invalidateAllLists).toHaveBeenCalled();
		});
	});

	describe("findPendingNotifications", () => {
		it("deve sempre buscar do repositório base (não usar cache)", async () => {
			// Arrange
			const limit = 10;
			const pendingNotifications = [
				{
					id: "id1",
					type: "EMAIL",
					content: { subject: "Test 1", body: "Test body 1" },
					status: "PENDING",
					schedulingId: "scheduling1",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: "id2",
					type: "EMAIL",
					content: { subject: "Test 2", body: "Test body 2" },
					status: "PENDING",
					schedulingId: "scheduling2",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			] as Notification[];

			baseRepositoryMock.findPendingNotifications.mockResolvedValue(pendingNotifications);

			// Act
			const result = await repository.findPendingNotifications(limit);

			// Assert
			expect(baseRepositoryMock.findPendingNotifications).toHaveBeenCalledWith(limit);
			expect(mockCache.getNotificationList).not.toHaveBeenCalled();
			expect(result).toEqual(pendingNotifications);
		});
	});

	describe("findBySchedulingId", () => {
		it("deve retornar notificações do cache quando disponíveis", async () => {
			// Arrange
			const schedulingId = "6ff0d5c6-e8a6-4f91-9216-adbdf7afaa73";
			const cachedNotifications = [
				{
					id: "id1",
					type: "EMAIL",
					content: { subject: "Test 1", body: "Test body 1" },
					status: "PENDING",
					schedulingId: schedulingId,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: "id2",
					type: "EMAIL",
					content: { subject: "Test 2", body: "Test body 2" },
					status: "PENDING",
					schedulingId: schedulingId,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			] as Notification[];

			mockCache.getNotificationList.mockResolvedValue(cachedNotifications);

			// Act
			const result = await repository.findBySchedulingId(schedulingId);

			// Assert
			expect(mockCache.getNotificationList).toHaveBeenCalledWith({ schedulingId });
			expect(baseRepositoryMock.findBySchedulingId).not.toHaveBeenCalled();
			expect(result).toEqual(cachedNotifications);
		});

		it("deve buscar do repositório base e atualizar cache quando não estiver em cache", async () => {
			// Arrange
			const schedulingId = "6ff0d5c6-e8a6-4f91-9216-adbdf7afaa73";
			const dbNotifications = [
				{
					id: "id1",
					type: "EMAIL",
					content: { subject: "Test 1", body: "Test body 1" },
					status: "PENDING",
					schedulingId: schedulingId,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: "id2",
					type: "EMAIL",
					content: { subject: "Test 2", body: "Test body 2" },
					status: "PENDING",
					schedulingId: schedulingId,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			] as Notification[];

			mockCache.getNotificationList.mockResolvedValue(null);
			baseRepositoryMock.findBySchedulingId.mockResolvedValue(dbNotifications);

			// Act
			const result = await repository.findBySchedulingId(schedulingId);

			// Assert
			expect(mockCache.getNotificationList).toHaveBeenCalledWith({ schedulingId });
			expect(baseRepositoryMock.findBySchedulingId).toHaveBeenCalledWith(schedulingId);
			expect(mockCache.setNotificationList).toHaveBeenCalledWith(dbNotifications, { schedulingId });
			expect(result).toEqual(dbNotifications);
		});
	});

	describe("updateContent", () => {
		it("deve atualizar o conteúdo da notificação e o cache", async () => {
			// Arrange
			const notificationId = "7f6c32ae-7194-4563-866d-9d42effa5cda";
			const newContent = "Novo conteúdo da notificação";
			const updatedNotification = {
				id: notificationId,
				type: "EMAIL",
				content: newContent,
				status: "PENDING",
				schedulingId: "scheduling1",
				createdAt: new Date(),
				updatedAt: new Date(),
			} as Notification;

			baseRepositoryMock.updateContent.mockResolvedValue(updatedNotification);

			// Act
			const result = await repository.updateContent(notificationId, newContent);

			// Assert
			expect(baseRepositoryMock.updateContent).toHaveBeenCalledWith(notificationId, newContent);
			expect(mockCache.setNotification).toHaveBeenCalledWith(updatedNotification);
			expect(mockCache.invalidateAllLists).toHaveBeenCalled();
			expect(result).toEqual(updatedNotification);
		});
	});

	describe("save", () => {
		it("deve salvar uma notificação e atualizar o cache", async () => {
			// Arrange
			const notification = {
				id: "25667904-389b-47dc-8303-6eefaa967186",
				type: "EMAIL",
				content: { subject: "Test", body: "Test body" },
				status: "PENDING",
				schedulingId: "6ff0d5c6-e8a6-4f91-9216-adbdf7afaa73",
				createdAt: new Date(),
				updatedAt: new Date(),
			} as Notification;

			const savedNotification = { ...notification };
			baseRepositoryMock.save.mockResolvedValue(savedNotification);

			// Act
			const result = await repository.save(notification);

			// Assert
			expect(baseRepositoryMock.save).toHaveBeenCalledWith(notification);
			expect(mockCache.setNotification).toHaveBeenCalledWith(savedNotification);
			expect(mockCache.invalidateAllLists).toHaveBeenCalled();
			expect(result).toEqual(savedNotification);
		});
	});

	describe("count", () => {
		it("deve contar notificações direto do repositório base (ignorar cache)", async () => {
			// Arrange
			const filter = { type: "EMAIL" } as NotificationFilter;
			baseRepositoryMock.count.mockResolvedValue(25);

			// Act
			const result = await repository.count(filter);

			// Assert
			expect(baseRepositoryMock.count).toHaveBeenCalledWith(filter);
			expect(mockCache.getNotificationList).not.toHaveBeenCalled();
			expect(result).toBe(25);
		});
	});
});
