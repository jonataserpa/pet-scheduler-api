import { NotificationStatus as PrismaNotificationStatus } from "@prisma/client";
import { Notification } from "../../../domain/entities/notification.js";
import { Result } from "../../../shared/utils/result.js";
import { NotificationMapper } from "../../mappers/notification-mapper.js";
import { NotificationValidator } from "../../validators/notification-validator.js";
import { PrismaTransaction } from "../../database/prisma-transaction.js";
import { logger } from "../../../shared/utils/logger.js";

/**
 * Classe que encapsula operações de mudança de status de notificações
 */
export class NotificationStatusOperations {
	constructor(private readonly prismaTransaction: PrismaTransaction) {}

	/**
	 * Aplica uma operação de mudança de status usando transação e métodos de domínio
	 * @param id ID da notificação
	 * @param status Novo status do Prisma
	 * @param domainOperation Operação de domínio a ser aplicada na entidade
	 * @param contextName Nome do contexto para logs
	 * @param metadata Metadados adicionais para logs
	 */
	async applyStatusChange<T extends Record<string, unknown>>(
		id: string,
		status: PrismaNotificationStatus,
		domainOperation: (notification: Notification) => void,
		contextName: string,
		metadata: T,
	): Promise<Result<Notification>> {
		// Validar o ID
		const validationResult = Result.try(() => NotificationValidator.validateId(id));
		if (validationResult.isFailure) {
			return Result.fail(validationResult.error);
		}

		// Executar o update e o findById em uma transação para garantir atomicidade
		const result = await Result.tryAsync(async () => {
			return await this.prismaTransaction.execute(async (prisma) => {
				// Primeiro atualizamos o status no banco
				await prisma.notification.update({
					where: { id },
					data: { status },
				});

				// Depois buscamos a notificação atualizada
				const notification = await prisma.notification.findUnique({
					where: { id },
				});

				if (!notification) {
					throw new Error(`Notificação não encontrada: ${id}`);
				}

				// Mapeamos para o domínio
				const domainNotification = NotificationMapper.toDomain(notification);

				// Criamos uma cópia para aplicar a operação de domínio
				const notificationCopy = NotificationMapper.copyNotification(domainNotification);

				// Aplicamos a operação de domínio
				domainOperation(notificationCopy);

				return notificationCopy;
			});
		});

		if (result.isFailure) {
			logger.error(`Erro em ${contextName}:`, {
				error: result.error,
				id,
				...metadata,
			});
		}

		return result;
	}

	/**
	 * Marca uma notificação como enviada
	 */
	async markAsSent(id: string, sentAt?: Date): Promise<Result<Notification>> {
		return this.applyStatusChange(
			id,
			PrismaNotificationStatus.SENT,
			(notification) => notification.markAsSent(sentAt || new Date()),
			"markAsSent",
			{ sentAt },
		);
	}

	/**
	 * Marca uma notificação como entregue
	 */
	async markAsDelivered(id: string, deliveredAt?: Date): Promise<Result<Notification>> {
		return this.applyStatusChange(
			id,
			PrismaNotificationStatus.DELIVERED,
			(notification) => notification.markAsDelivered(deliveredAt || new Date()),
			"markAsDelivered",
			{ deliveredAt },
		);
	}

	/**
	 * Marca uma notificação como falha
	 */
	async markAsFailed(id: string, reason: string, failedAt?: Date): Promise<Result<Notification>> {
		// Validar motivo
		const validationResult = Result.try(() => NotificationValidator.validateFailureReason(reason));
		if (validationResult.isFailure) {
			return Result.fail(validationResult.error);
		}

		return this.applyStatusChange(
			id,
			PrismaNotificationStatus.FAILED,
			(notification) => notification.markAsFailed(reason, failedAt || new Date()),
			"markAsFailed",
			{ reason, failedAt },
		);
	}

	/**
	 * Prepara uma notificação para nova tentativa de envio
	 */
	async retry(id: string): Promise<Result<Notification>> {
		return this.applyStatusChange(
			id,
			PrismaNotificationStatus.PENDING,
			(notification) => notification.retry(),
			"retry",
			{},
		);
	}

	/**
	 * Atualiza o conteúdo de uma notificação
	 */
	async updateContent(id: string, content: string): Promise<Result<Notification>> {
		// Validar ID e conteúdo
		const validationResult = Result.try(() => {
			NotificationValidator.validateId(id);
			NotificationValidator.validateContent(content);
		});

		if (validationResult.isFailure) {
			return Result.fail(validationResult.error);
		}

		const result = await Result.tryAsync(async () => {
			return await this.prismaTransaction.execute(async (prisma) => {
				// Primeiro atualizamos o conteúdo no banco
				await prisma.notification.update({
					where: { id },
					data: { content },
				});

				// Depois buscamos a notificação atualizada
				const notification = await prisma.notification.findUnique({
					where: { id },
				});

				if (!notification) {
					throw new Error(`Notificação não encontrada: ${id}`);
				}

				// Mapeamos para o domínio
				const domainNotification = NotificationMapper.toDomain(notification);

				// Criamos uma cópia para aplicar a operação de domínio
				const notificationCopy = NotificationMapper.copyNotification(domainNotification);

				// Aplicamos a operação de domínio
				notificationCopy.updateContent(content);

				return notificationCopy;
			});
		});

		if (result.isFailure) {
			logger.error(`Erro em updateContent:`, {
				error: result.error,
				id,
				content,
			});
		}

		return result;
	}
}
