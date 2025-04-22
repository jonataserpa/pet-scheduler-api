import {
	NotificationType as PrismaNotificationType,
	NotificationStatus as PrismaNotificationStatus,
	Notification as PrismaNotification,
} from "@prisma/client";
import {
	Notification,
	NotificationType,
	NotificationStatus,
} from "../../domain/entities/notification.js";
import {
	NotificationFilter,
	NotificationRepository,
} from "../../domain/repositories/notification-repository.js";
import { PrismaRepositoryBase } from "./base/prisma-repository-base.js";

/**
 * Tipo que representa o resultado de consultas de notificação do Prisma
 */
type PrismaNotificationResult = PrismaNotification;

/**
 * Implementação do repositório de notificações usando Prisma
 */
export class PrismaNotificationRepository
	extends PrismaRepositoryBase
	implements NotificationRepository
{
	/**
	 * Mapeia o tipo de notificação do domínio para o formato do Prisma
	 */
	private mapDomainTypeToPrisma(type: NotificationType): PrismaNotificationType {
		switch (type) {
			case NotificationType.EMAIL:
				return PrismaNotificationType.EMAIL;
			case NotificationType.SMS:
				return PrismaNotificationType.SMS;
			case NotificationType.WHATSAPP:
				return PrismaNotificationType.WHATSAPP;
			default:
				throw new Error(`Tipo de notificação inválido: ${type}`);
		}
	}

	/**
	 * Mapeia o status da notificação do domínio para o formato do Prisma
	 */
	private mapDomainStatusToPrisma(status: NotificationStatus): PrismaNotificationStatus {
		switch (status) {
			case NotificationStatus.PENDING:
				return PrismaNotificationStatus.PENDING;
			case NotificationStatus.SENT:
				return PrismaNotificationStatus.SENT;
			case NotificationStatus.FAILED:
				return PrismaNotificationStatus.FAILED;
			case NotificationStatus.DELIVERED:
				return PrismaNotificationStatus.DELIVERED;
			default:
				throw new Error(`Status de notificação inválido: ${status}`);
		}
	}

	/**
	 * Mapeia o tipo de notificação do Prisma para o formato do domínio
	 */
	private mapPrismaTypeToDomain(type: PrismaNotificationType): NotificationType {
		switch (type) {
			case PrismaNotificationType.EMAIL:
				return NotificationType.EMAIL;
			case PrismaNotificationType.SMS:
				return NotificationType.SMS;
			case PrismaNotificationType.WHATSAPP:
				return NotificationType.WHATSAPP;
			default:
				throw new Error(`Tipo de notificação inválido: ${type}`);
		}
	}

	/**
	 * Mapeia o status da notificação do Prisma para o formato do domínio
	 */
	private mapPrismaStatusToDomain(status: PrismaNotificationStatus): NotificationStatus {
		switch (status) {
			case PrismaNotificationStatus.PENDING:
				return NotificationStatus.PENDING;
			case PrismaNotificationStatus.SENT:
				return NotificationStatus.SENT;
			case PrismaNotificationStatus.FAILED:
				return NotificationStatus.FAILED;
			case PrismaNotificationStatus.DELIVERED:
				return NotificationStatus.DELIVERED;
			default:
				throw new Error(`Status de notificação inválido: ${status}`);
		}
	}

	/**
	 * Valida os dados da notificação antes de persistir
	 * @throws Error se os dados forem inválidos
	 */
	private validateNotificationData(id: string, content: string, schedulingId: string): void {
		if (!id || id.trim() === "") {
			throw new Error("ID da notificação é obrigatório");
		}

		if (!content || content.trim() === "") {
			throw new Error("Conteúdo da notificação é obrigatório");
		}

		if (!schedulingId || schedulingId.trim() === "") {
			throw new Error("ID do agendamento é obrigatório");
		}
	}

	/**
	 * Salva uma notificação (cria ou atualiza)
	 */
	async save(notification: Notification): Promise<Notification> {
		try {
			this.validateNotificationData(
				notification.id,
				notification.content,
				notification.schedulingId,
			);

			const updatedNotification = await this.prisma.notification.update({
				where: { id: notification.id },
				data: {
					content: notification.content,
					status: this.mapDomainStatusToPrisma(notification.status),
				},
			});

			return this.mapToDomain(updatedNotification);
		} catch (error) {
			return this.handleError(error, "save", { notificationId: notification.id });
		}
	}

	/**
	 * Cria uma nova notificação
	 */
	async create(
		id: string,
		type: NotificationType,
		content: string,
		schedulingId: string,
		status: NotificationStatus = NotificationStatus.PENDING,
	): Promise<Notification> {
		try {
			this.validateNotificationData(id, content, schedulingId);

			const createdNotification = await this.prisma.notification.create({
				data: {
					id,
					type: this.mapDomainTypeToPrisma(type),
					content,
					status: this.mapDomainStatusToPrisma(status),
					schedulingId,
					sentAt: new Date(), // Definido como padrão no esquema Prisma
				},
			});

			return this.mapToDomain(createdNotification);
		} catch (error) {
			return this.handleError(error, "create", { id, type, schedulingId });
		}
	}

	/**
	 * Encontra uma notificação pelo ID
	 */
	async findById(id: string): Promise<Notification | null> {
		try {
			if (!id || id.trim() === "") {
				throw new Error("ID da notificação é obrigatório para busca");
			}

			const notification = await this.prisma.notification.findUnique({
				where: { id },
			});

			if (!notification) {
				return null;
			}

			return this.mapToDomain(notification);
		} catch (error) {
			return this.handleError(error, "findById", { id });
		}
	}

	/**
	 * Procura notificações que correspondam aos filtros fornecidos
	 */
	async findAll(
		filter: NotificationFilter,
		limit?: number,
		offset?: number,
	): Promise<Notification[]> {
		try {
			const { id, type, status, schedulingId, startDate, endDate } = filter;

			const notifications = await this.prisma.notification.findMany({
				where: {
					id: id ? { equals: id } : undefined,
					type: type ? { equals: this.mapDomainTypeToPrisma(type) } : undefined,
					status: status ? { equals: this.mapDomainStatusToPrisma(status) } : undefined,
					schedulingId: schedulingId ? { equals: schedulingId } : undefined,
					sentAt: {
						gte: startDate,
						lte: endDate,
					},
				},
				take: limit,
				skip: offset,
				orderBy: {
					sentAt: "desc",
				},
			});

			return notifications.map((notification) => this.mapToDomain(notification));
		} catch (error) {
			return this.handleError(error, "findAll", filter as unknown as Record<string, unknown>);
		}
	}

	/**
	 * Encontra notificações pendentes para envio
	 */
	async findPendingNotifications(limit?: number): Promise<Notification[]> {
		try {
			const notifications = await this.prisma.notification.findMany({
				where: {
					status: { equals: PrismaNotificationStatus.PENDING },
				},
				take: limit,
				orderBy: {
					sentAt: "asc",
				},
			});

			return notifications.map((notification) => this.mapToDomain(notification));
		} catch (error) {
			return this.handleError(error, "findPendingNotifications", { limit });
		}
	}

	/**
	 * Encontra notificações por agendamento
	 */
	async findBySchedulingId(schedulingId: string): Promise<Notification[]> {
		try {
			if (!schedulingId || schedulingId.trim() === "") {
				throw new Error("ID do agendamento é obrigatório para busca");
			}

			const notifications = await this.prisma.notification.findMany({
				where: {
					schedulingId,
				},
				orderBy: {
					sentAt: "desc",
				},
			});

			return notifications.map((notification) => this.mapToDomain(notification));
		} catch (error) {
			return this.handleError(error, "findBySchedulingId", { schedulingId });
		}
	}

	/**
	 * Aplica uma operação de mudança de status usando transação e métodos de domínio
	 * @param id ID da notificação
	 * @param status Novo status do Prisma
	 * @param domainOperation Operação de domínio a ser aplicada na entidade
	 * @param contextName Nome do contexto para logs
	 * @param metadata Metadados adicionais para logs
	 */
	private async applyStatusChange<T extends Record<string, unknown>>(
		id: string,
		status: PrismaNotificationStatus,
		domainOperation: (notification: Notification) => void,
		contextName: string,
		metadata: T,
	): Promise<Notification> {
		try {
			if (!id || id.trim() === "") {
				throw new Error("ID da notificação é obrigatório");
			}

			// Executar o update e o findById em uma transação para garantir atomicidade
			return await this.executeInTransaction(async (prisma) => {
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
				const domainNotification = this.mapToDomain(notification);

				// Criamos uma cópia para aplicar a operação de domínio
				const notificationCopy = this.copyNotification(domainNotification);

				// Aplicamos a operação de domínio
				domainOperation(notificationCopy);

				return notificationCopy;
			});
		} catch (error) {
			return this.handleError(error, contextName, { id, ...metadata });
		}
	}

	/**
	 * Marca uma notificação como enviada
	 */
	async markAsSent(id: string, sentAt?: Date): Promise<Notification> {
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
	async markAsDelivered(id: string, deliveredAt?: Date): Promise<Notification> {
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
	async markAsFailed(id: string, reason: string, failedAt?: Date): Promise<Notification> {
		if (!reason || reason.trim() === "") {
			throw new Error("Motivo da falha é obrigatório");
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
	async retry(id: string): Promise<Notification> {
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
	async updateContent(id: string, content: string): Promise<Notification> {
		try {
			if (!id || id.trim() === "") {
				throw new Error("ID da notificação é obrigatório");
			}

			if (!content || content.trim() === "") {
				throw new Error("Conteúdo da notificação é obrigatório");
			}

			return await this.executeInTransaction(async (prisma) => {
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
				const domainNotification = this.mapToDomain(notification);

				// Criamos uma cópia para aplicar a operação de domínio
				const notificationCopy = this.copyNotification(domainNotification);

				// Aplicamos a operação de domínio
				notificationCopy.updateContent(content);

				return notificationCopy;
			});
		} catch (error) {
			return this.handleError(error, "updateContent", { id, content });
		}
	}

	/**
	 * Conta o número total de notificações que correspondem aos filtros
	 */
	async count(filter: NotificationFilter): Promise<number> {
		try {
			const { id, type, status, schedulingId, startDate, endDate } = filter;

			const count = await this.prisma.notification.count({
				where: {
					id: id ? { equals: id } : undefined,
					type: type ? { equals: this.mapDomainTypeToPrisma(type) } : undefined,
					status: status ? { equals: this.mapDomainStatusToPrisma(status) } : undefined,
					schedulingId: schedulingId ? { equals: schedulingId } : undefined,
					sentAt: {
						gte: startDate,
						lte: endDate,
					},
				},
			});

			return count;
		} catch (error) {
			return this.handleError(error, "count", filter as unknown as Record<string, unknown>);
		}
	}

	/**
	 * Exclui uma notificação pelo ID
	 */
	async delete(id: string): Promise<void> {
		try {
			if (!id || id.trim() === "") {
				throw new Error("ID da notificação é obrigatório para exclusão");
			}

			await this.prisma.notification.delete({
				where: { id },
			});
		} catch (error) {
			this.handleError(error, "delete", { id });
		}
	}

	/**
	 * Cria uma cópia de uma notificação
	 * Usado para aplicar métodos de domínio sem afetar a instância original
	 */
	private copyNotification(notification: Notification): Notification {
		const data = notification.toObject();
		return Notification.create(
			data.id,
			data.type,
			data.content,
			data.schedulingId,
			data.status,
			data.sentAt,
			data.deliveredAt,
			data.failedAt,
			data.failureReason,
		);
	}

	/**
	 * Mapeia os dados do Prisma para a entidade de domínio
	 */
	private mapToDomain(prismaNotification: PrismaNotificationResult): Notification {
		// Com base no esquema Prisma atual, as datas opcionais não existem diretamente
		// no modelo Notification. Estamos adaptando a interface para o domínio.
		return Notification.create(
			prismaNotification.id,
			this.mapPrismaTypeToDomain(prismaNotification.type),
			prismaNotification.content,
			prismaNotification.schedulingId,
			this.mapPrismaStatusToDomain(prismaNotification.status),
			prismaNotification.sentAt,
		);
	}
}
