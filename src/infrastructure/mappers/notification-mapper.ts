import {
	NotificationType,
	NotificationStatus,
	Notification,
} from "../../domain/entities/notification.js";
import {
	NotificationType as PrismaNotificationType,
	NotificationStatus as PrismaNotificationStatus,
	Notification as PrismaNotification,
} from "@prisma/client";

/**
 * Classe responsável por mapear entidades de notificação entre o domínio e o Prisma
 */
export class NotificationMapper {
	/**
	 * Mapeia o tipo de notificação do domínio para o formato do Prisma
	 */
	static mapDomainTypeToPrisma(type: NotificationType): PrismaNotificationType {
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
	static mapDomainStatusToPrisma(status: NotificationStatus): PrismaNotificationStatus {
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
	static mapPrismaTypeToDomain(type: PrismaNotificationType): NotificationType {
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
	static mapPrismaStatusToDomain(status: PrismaNotificationStatus): NotificationStatus {
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
	 * Mapeia os dados do Prisma para a entidade de domínio
	 */
	static toDomain(prismaNotification: PrismaNotification): Notification {
		return Notification.create(
			prismaNotification.id,
			this.mapPrismaTypeToDomain(prismaNotification.type),
			prismaNotification.content,
			prismaNotification.schedulingId,
			this.mapPrismaStatusToDomain(prismaNotification.status),
			prismaNotification.sentAt,
		);
	}

	/**
	 * Cria uma cópia de uma notificação
	 * Usado para aplicar métodos de domínio sem afetar a instância original
	 */
	static copyNotification(notification: Notification): Notification {
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
}
