import { NotificationType } from "../../entities/notification.js";

/**
 * Tipos de categorias de notificações
 */
export enum NotificationCategory {
	SCHEDULING = "scheduling",
	CUSTOMER = "customer",
	PET = "pet",
	SYSTEM = "system",
}

/**
 * Regras para frequência e prioridade de notificações
 */
export interface NotificationRule {
	category: NotificationCategory;
	type: string;
	channels: NotificationType[];
	priority: "high" | "medium" | "low";
	rateLimitHours?: number;
	sendImmediately: boolean;
	requiresConfirmation: boolean;
	resendOnFailure: boolean;
	maxRetries: number;
}

/**
 * Regras de negócio para notificações
 * Estas regras definem:
 * - Quais canais são apropriados para cada tipo de notificação
 * - Prioridade da notificação
 * - Se há limite de taxa para envio
 * - Se deve ser enviada imediatamente ou pode ser colocada em fila
 * - Se é necessária confirmação de recebimento
 * - Se deve tentar reenviar em caso de falha
 * - Número máximo de tentativas
 */
export const notificationRules: Record<string, NotificationRule> = {
	// Regras para agendamentos
	"scheduling.confirmation": {
		category: NotificationCategory.SCHEDULING,
		type: "confirmation",
		channels: [NotificationType.EMAIL, NotificationType.SMS, NotificationType.WHATSAPP],
		priority: "high",
		sendImmediately: true,
		requiresConfirmation: false,
		resendOnFailure: true,
		maxRetries: 3,
	},
	"scheduling.reminder": {
		category: NotificationCategory.SCHEDULING,
		type: "reminder",
		channels: [NotificationType.EMAIL, NotificationType.SMS, NotificationType.WHATSAPP],
		priority: "medium",
		sendImmediately: false,
		requiresConfirmation: false,
		resendOnFailure: true,
		maxRetries: 2,
	},
	"scheduling.cancellation": {
		category: NotificationCategory.SCHEDULING,
		type: "cancellation",
		channels: [NotificationType.EMAIL, NotificationType.SMS, NotificationType.WHATSAPP],
		priority: "high",
		sendImmediately: true,
		requiresConfirmation: false,
		resendOnFailure: true,
		maxRetries: 3,
	},
	"scheduling.rescheduled": {
		category: NotificationCategory.SCHEDULING,
		type: "rescheduled",
		channels: [NotificationType.EMAIL, NotificationType.SMS, NotificationType.WHATSAPP],
		priority: "high",
		sendImmediately: true,
		requiresConfirmation: false,
		resendOnFailure: true,
		maxRetries: 3,
	},

	// Regras para clientes
	"customer.welcome": {
		category: NotificationCategory.CUSTOMER,
		type: "welcome",
		channels: [NotificationType.EMAIL, NotificationType.SMS],
		priority: "medium",
		sendImmediately: true,
		requiresConfirmation: false,
		resendOnFailure: false,
		maxRetries: 1,
	},
	"customer.birthday": {
		category: NotificationCategory.CUSTOMER,
		type: "birthday",
		channels: [NotificationType.EMAIL, NotificationType.SMS, NotificationType.WHATSAPP],
		priority: "low",
		rateLimitHours: 24 * 365, // Uma vez por ano
		sendImmediately: false,
		requiresConfirmation: false,
		resendOnFailure: false,
		maxRetries: 1,
	},
	"customer.inactive": {
		category: NotificationCategory.CUSTOMER,
		type: "inactive",
		channels: [NotificationType.EMAIL, NotificationType.SMS],
		priority: "low",
		rateLimitHours: 24 * 30, // Uma vez por mês
		sendImmediately: false,
		requiresConfirmation: false,
		resendOnFailure: false,
		maxRetries: 1,
	},

	// Regras para pets
	"pet.checkup_reminder": {
		category: NotificationCategory.PET,
		type: "checkup_reminder",
		channels: [NotificationType.EMAIL, NotificationType.SMS],
		priority: "medium",
		rateLimitHours: 24 * 3, // No máximo a cada 3 dias
		sendImmediately: false,
		requiresConfirmation: false,
		resendOnFailure: true,
		maxRetries: 2,
	},
	"pet.vaccination_due": {
		category: NotificationCategory.PET,
		type: "vaccination_due",
		channels: [NotificationType.EMAIL, NotificationType.SMS, NotificationType.WHATSAPP],
		priority: "high",
		rateLimitHours: 24 * 2, // No máximo a cada 2 dias
		sendImmediately: true,
		requiresConfirmation: false,
		resendOnFailure: true,
		maxRetries: 3,
	},
	"pet.birthday": {
		category: NotificationCategory.PET,
		type: "birthday",
		channels: [NotificationType.EMAIL, NotificationType.SMS],
		priority: "low",
		rateLimitHours: 24 * 365, // Uma vez por ano
		sendImmediately: false,
		requiresConfirmation: false,
		resendOnFailure: false,
		maxRetries: 1,
	},
	"pet.adoption_anniversary": {
		category: NotificationCategory.PET,
		type: "adoption_anniversary",
		channels: [NotificationType.EMAIL, NotificationType.SMS],
		priority: "low",
		rateLimitHours: 24 * 365, // Uma vez por ano
		sendImmediately: false,
		requiresConfirmation: false,
		resendOnFailure: false,
		maxRetries: 1,
	},

	// Regras para notificações do sistema
	"system.maintenance": {
		category: NotificationCategory.SYSTEM,
		type: "maintenance",
		channels: [NotificationType.EMAIL],
		priority: "medium",
		sendImmediately: true,
		requiresConfirmation: false,
		resendOnFailure: false,
		maxRetries: 1,
	},
	"system.security": {
		category: NotificationCategory.SYSTEM,
		type: "security",
		channels: [NotificationType.EMAIL, NotificationType.SMS],
		priority: "high",
		sendImmediately: true,
		requiresConfirmation: true,
		resendOnFailure: true,
		maxRetries: 5,
	},
};

/**
 * Obtém a regra para um tipo específico de notificação
 * @param type Tipo de notificação
 * @returns Regra ou regra padrão se não encontrada
 */
export function getNotificationRule(type: string): NotificationRule {
	return (
		notificationRules[type] || {
			category: NotificationCategory.SYSTEM,
			type: "default",
			channels: [NotificationType.EMAIL],
			priority: "medium",
			sendImmediately: false,
			requiresConfirmation: false,
			resendOnFailure: true,
			maxRetries: 3,
		}
	);
}
