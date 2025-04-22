import { PrismaClient } from "@prisma/client";
import { NotificationType, NotificationStatus } from "../../../domain/entities/notification.js";
import { Notification } from "../../../domain/entities/notification.js";
import { PrismaNotificationRepository } from "../prisma-notification-repository.js";
import { v4 as uuidv4 } from "uuid";
import { jest, describe, it, expect, beforeEach } from "@jest/globals";

// Mocking the modules
jest.mock("@prisma/client");
jest.mock("../../database/prisma-transaction.js");

describe("PrismaNotificationRepository", () => {
	let repository: PrismaNotificationRepository;
	let prismaClient: any;

	beforeEach(() => {
		// Limpar todos os mocks
		jest.clearAllMocks();

		// Criar uma nova instância do mock do PrismaClient
		prismaClient = {
			notification: {
				create: jest.fn(),
				update: jest.fn(),
				findUnique: jest.fn(),
				findMany: jest.fn(),
				count: jest.fn(),
				delete: jest.fn(),
			},
			$transaction: jest.fn((callback: any) => callback(prismaClient)),
		};

		// Criar a instância do repositório a ser testada usando o mock
		repository = new PrismaNotificationRepository(prismaClient);
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

			prismaClient.notification.create.mockResolvedValue(mockNotification);

			// Act
			const result = await repository.create(id, type, content, schedulingId);

			// Assert
			expect(prismaClient.notification.create).toHaveBeenCalledWith({
				data: {
					id,
					type,
					content,
					schedulingId,
					status: NotificationStatus.PENDING,
					sentAt: expect.any(Date),
				},
			});

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
			await expect(repository.create(id, type, "", uuidv4())).rejects.toThrow(
				"Conteúdo da notificação é obrigatório",
			);
			await expect(repository.create(id, type, "Content", "")).rejects.toThrow(
				"ID do agendamento é obrigatório",
			);
			await expect(repository.create("", type, "Content", uuidv4())).rejects.toThrow(
				"ID da notificação é obrigatório",
			);
		});
	});

	describe("findById", () => {
		it("deve encontrar uma notificação pelo ID", async () => {
			// Arrange
			const id = uuidv4();
			const mockNotification = {
				id,
				type: NotificationType.EMAIL,
				content: "Teste de notificação",
				schedulingId: uuidv4(),
				status: NotificationStatus.PENDING,
				sentAt: new Date(),
			};

			prismaClient.notification.findUnique.mockResolvedValue(mockNotification);

			// Act
			const result = await repository.findById(id);

			// Assert
			expect(prismaClient.notification.findUnique).toHaveBeenCalledWith({
				where: { id },
			});

			expect(result).toBeDefined();
			expect(result?.id).toBe(id);
		});

		it("deve retornar null quando não encontrar a notificação", async () => {
			// Arrange
			const id = uuidv4();
			prismaClient.notification.findUnique.mockResolvedValue(null);

			// Act
			const result = await repository.findById(id);

			// Assert
			expect(prismaClient.notification.findUnique).toHaveBeenCalledWith({
				where: { id },
			});

			expect(result).toBeNull();
		});

		it("deve lançar erro quando ID é vazio", async () => {
			// Act & Assert
			await expect(repository.findById("")).rejects.toThrow(
				"ID da notificação é obrigatório para busca",
			);
		});
	});

	describe("findAll", () => {
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

			prismaClient.notification.findMany.mockResolvedValue(mockNotifications);

			// Act
			const result = await repository.findAll(filter, 10, 0);

			// Assert
			expect(prismaClient.notification.findMany).toHaveBeenCalled();
			expect(result).toHaveLength(2);
			expect(result[0].type).toBe(NotificationType.EMAIL);
			expect(result[0].status).toBe(NotificationStatus.PENDING);
		});
	});

	describe("operações de status usando transações", () => {
		it("deve marcar uma notificação como enviada", async () => {
			// Arrange
			const id = uuidv4();

			// Mock inicial da notificação com status PENDING
			const mockPendingNotification = {
				id,
				type: NotificationType.EMAIL,
				content: "Teste de notificação",
				schedulingId: uuidv4(),
				status: NotificationStatus.PENDING,
				sentAt: null,
			};

			// Mock da notificação após atualização com status SENT
			const mockUpdatedNotification = {
				...mockPendingNotification,
				status: NotificationStatus.SENT,
				sentAt: new Date(),
			};

			// Configura mock do findUnique para retornar primeiro PENDING, depois SENT
			prismaClient.notification.findUnique
				.mockResolvedValueOnce(mockPendingNotification) // Primeira chamada: PENDING
				.mockResolvedValueOnce(mockUpdatedNotification); // Segunda chamada (após update): SENT

			prismaClient.notification.update.mockResolvedValue(mockUpdatedNotification);

			// Spy para verificar que .toObject() é chamado na criação de uma cópia
			const toObjectSpy = jest.spyOn(Notification.prototype, "toObject");

			// Act
			const result = await repository.markAsSent(id);

			// Assert
			expect(prismaClient.$transaction).toHaveBeenCalled();
			expect(prismaClient.notification.update).toHaveBeenCalledWith({
				where: { id },
				data: {
					status: NotificationStatus.SENT,
				},
			});

			expect(result).toBeDefined();
			expect(result.status).toBe(NotificationStatus.SENT);
			expect(toObjectSpy).toHaveBeenCalled();

			toObjectSpy.mockRestore();
		});

		it("deve marcar uma notificação como falha e validar o motivo", async () => {
			// Arrange
			const id = uuidv4();
			const failureReason = "Falha no envio do email";

			// Mock inicial da notificação com status PENDING
			const mockPendingNotification = {
				id,
				type: NotificationType.EMAIL,
				content: "Teste de notificação",
				schedulingId: uuidv4(),
				status: NotificationStatus.PENDING,
				sentAt: null,
				failureReason: null,
				failedAt: null,
			};

			// Mock da notificação após atualização com status FAILED
			const mockUpdatedNotification = {
				...mockPendingNotification,
				status: NotificationStatus.FAILED,
				failureReason,
				failedAt: new Date(),
			};

			// Configura mock do findUnique para retornar primeiro PENDING, depois FAILED
			prismaClient.notification.findUnique
				.mockResolvedValueOnce(mockPendingNotification) // Primeira chamada: PENDING
				.mockResolvedValueOnce(mockUpdatedNotification); // Segunda chamada (após update): FAILED

			prismaClient.notification.update.mockResolvedValue(mockUpdatedNotification);

			// Act
			const result = await repository.markAsFailed(id, failureReason);

			// Assert
			expect(prismaClient.$transaction).toHaveBeenCalled();
			expect(prismaClient.notification.update).toHaveBeenCalledWith({
				where: { id },
				data: {
					status: NotificationStatus.FAILED,
				},
			});

			expect(result).toBeDefined();
			expect(result.status).toBe(NotificationStatus.FAILED);
			expect(result.failureReason).toBe(failureReason);
		});
	});

	describe("updateContent", () => {
		it("deve atualizar o conteúdo usando transação", async () => {
			// Arrange
			const id = uuidv4();
			const newContent = "Novo conteúdo da notificação";
			const mockUpdatedNotification = {
				id,
				type: NotificationType.EMAIL,
				content: newContent,
				schedulingId: uuidv4(),
				status: NotificationStatus.PENDING,
				sentAt: new Date(),
			};

			prismaClient.notification.update.mockResolvedValue(mockUpdatedNotification);
			prismaClient.notification.findUnique.mockResolvedValue(mockUpdatedNotification);

			// Act
			const result = await repository.updateContent(id, newContent);

			// Assert
			expect(prismaClient.$transaction).toHaveBeenCalled();
			expect(prismaClient.notification.update).toHaveBeenCalledWith({
				where: { id },
				data: { content: newContent },
			});

			expect(result).toBeDefined();
			expect(result.content).toBe(newContent);
		});
	});

	describe("delete", () => {
		it("deve excluir uma notificação pelo ID", async () => {
			// Arrange
			const id = uuidv4();
			prismaClient.notification.delete.mockResolvedValue({});

			// Act
			await repository.delete(id);

			// Assert
			expect(prismaClient.notification.delete).toHaveBeenCalledWith({
				where: { id },
			});
		});

		it("deve lançar erro quando tentar excluir com ID vazio", async () => {
			// Act & Assert
			await expect(repository.delete("")).rejects.toThrow(
				"ID da notificação é obrigatório para exclusão",
			);
		});
	});
});
