import { Notification, NotificationType, NotificationStatus } from "../entities/notification.js";

export interface NotificationFilter {
	id?: string;
	type?: NotificationType;
	status?: NotificationStatus;
	schedulingId?: string;
	startDate?: Date;
	endDate?: Date;
}

export interface NotificationRepository {
	/**
	 * Salva uma notificação (cria ou atualiza)
	 * @param notification A notificação a ser salva
	 */
	save(notification: Notification): Promise<Notification>;

	/**
	 * Cria uma nova notificação
	 * @param notification A notificação a ser criada
	 */
	create(
		id: string,
		type: NotificationType,
		content: string,
		schedulingId: string,
		status?: NotificationStatus,
	): Promise<Notification>;

	/**
	 * Encontra uma notificação pelo ID
	 * @param id O ID da notificação
	 */
	findById(id: string): Promise<Notification | null>;

	/**
	 * Procura notificações que correspondam aos filtros fornecidos
	 * @param filter Os filtros para busca de notificações
	 * @param limit Limite de registros a serem retornados
	 * @param offset Deslocamento para paginação
	 */
	findAll(filter: NotificationFilter, limit?: number, offset?: number): Promise<Notification[]>;

	/**
	 * Encontra notificações pendentes para envio
	 * @param limit Limite de registros a serem retornados
	 */
	findPendingNotifications(limit?: number): Promise<Notification[]>;

	/**
	 * Encontra notificações por agendamento
	 * @param schedulingId O ID do agendamento
	 */
	findBySchedulingId(schedulingId: string): Promise<Notification[]>;

	/**
	 * Marca uma notificação como enviada
	 * @param id O ID da notificação
	 * @param sentAt Data e hora do envio (opcional, usa a data atual se não fornecida)
	 */
	markAsSent(id: string, sentAt?: Date): Promise<Notification>;

	/**
	 * Marca uma notificação como entregue
	 * @param id O ID da notificação
	 * @param deliveredAt Data e hora da entrega (opcional, usa a data atual se não fornecida)
	 */
	markAsDelivered(id: string, deliveredAt?: Date): Promise<Notification>;

	/**
	 * Marca uma notificação como falha
	 * @param id O ID da notificação
	 * @param reason Motivo da falha
	 * @param failedAt Data e hora da falha (opcional, usa a data atual se não fornecida)
	 */
	markAsFailed(id: string, reason: string, failedAt?: Date): Promise<Notification>;

	/**
	 * Prepara uma notificação para nova tentativa de envio
	 * @param id O ID da notificação
	 */
	retry(id: string): Promise<Notification>;

	/**
	 * Atualiza o conteúdo de uma notificação
	 * @param id O ID da notificação
	 * @param content O novo conteúdo
	 */
	updateContent(id: string, content: string): Promise<Notification>;

	/**
	 * Conta o número total de notificações que correspondem aos filtros
	 * @param filter Os filtros para contagem de notificações
	 */
	count(filter: NotificationFilter): Promise<number>;

	/**
	 * Exclui uma notificação pelo ID
	 * @param id O ID da notificação a ser excluída
	 */
	delete(id: string): Promise<void>;
}
