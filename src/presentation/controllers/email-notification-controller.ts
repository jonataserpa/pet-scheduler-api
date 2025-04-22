import { Request, Response } from "express";
import { NotificationService } from "../../domain/services/notification/notification-service.js";
import { NotificationType } from "../../domain/entities/notification.js";
import { logger } from "../../shared/utils/logger.js";
import { EmailTemplateType } from "../../infrastructure/services/templates/email-templates.js";

/**
 * Controlador para gerenciamento de notificações por email
 */
export class EmailNotificationController {
	/**
	 * Cria uma nova instância do controlador de notificações por email
	 * @param notificationService Serviço de notificações
	 */
	constructor(private readonly notificationService: NotificationService) {}

	/**
	 * Envia uma notificação de confirmação de agendamento por email
	 */
	async sendSchedulingConfirmation(req: Request, res: Response): Promise<void> {
		try {
			const { schedulingId, customerName, petName, serviceName, dateTime, additionalInfo } =
				req.body;

			// Validar dados da requisição
			if (!schedulingId || !customerName || !petName || !serviceName || !dateTime) {
				res.status(400).json({
					status: "error",
					message: "Dados obrigatórios: schedulingId, customerName, petName, serviceName, dateTime",
				});
				return;
			}

			const templateData = {
				customerName,
				petName,
				serviceName,
				dateTime,
				additionalInfo: additionalInfo || "",
				// Dados opcionais
				address: req.body.address,
				price: req.body.price,
			};

			// Criar e enviar notificação usando o serviço
			const notification = await this.notificationService.createAndSendNotification({
				type: NotificationType.EMAIL,
				templateCode: EmailTemplateType.SCHEDULING_CONFIRMATION,
				templateData,
				schedulingId,
			});

			res.status(201).json({
				status: "success",
				data: {
					notification: {
						id: notification.id,
						type: notification.type,
						status: notification.status,
					},
				},
				message: "Email de confirmação enviado com sucesso",
			});
		} catch (error) {
			logger.error("Erro ao enviar email de confirmação:", error);
			res.status(500).json({
				status: "error",
				message: error instanceof Error ? error.message : "Erro ao enviar email de confirmação",
			});
		}
	}

	/**
	 * Envia uma notificação de lembrete de agendamento por email
	 */
	async sendSchedulingReminder(req: Request, res: Response): Promise<void> {
		try {
			const { schedulingId, customerName, petName, serviceName, dateTime } = req.body;

			// Validar dados da requisição
			if (!schedulingId || !customerName || !petName || !serviceName || !dateTime) {
				res.status(400).json({
					status: "error",
					message: "Dados obrigatórios: schedulingId, customerName, petName, serviceName, dateTime",
				});
				return;
			}

			const templateData = {
				customerName,
				petName,
				serviceName,
				dateTime,
				// Dados opcionais
				address: req.body.address,
			};

			// Criar e enviar notificação usando o serviço
			const notification = await this.notificationService.createAndSendNotification({
				type: NotificationType.EMAIL,
				templateCode: EmailTemplateType.SCHEDULING_REMINDER,
				templateData,
				schedulingId,
			});

			res.status(201).json({
				status: "success",
				data: {
					notification: {
						id: notification.id,
						type: notification.type,
						status: notification.status,
					},
				},
				message: "Email de lembrete enviado com sucesso",
			});
		} catch (error) {
			logger.error("Erro ao enviar email de lembrete:", error);
			res.status(500).json({
				status: "error",
				message: error instanceof Error ? error.message : "Erro ao enviar email de lembrete",
			});
		}
	}

	/**
	 * Envia uma notificação de cancelamento de agendamento por email
	 */
	async sendSchedulingCancellation(req: Request, res: Response): Promise<void> {
		try {
			const { schedulingId, customerName, petName, serviceName, dateTime, cancellationReason } =
				req.body;

			// Validar dados da requisição
			if (!schedulingId || !customerName || !petName || !serviceName || !dateTime) {
				res.status(400).json({
					status: "error",
					message: "Dados obrigatórios: schedulingId, customerName, petName, serviceName, dateTime",
				});
				return;
			}

			const templateData = {
				customerName,
				petName,
				serviceName,
				dateTime,
				additionalInfo: cancellationReason || "Cancelamento solicitado",
			};

			// Criar e enviar notificação usando o serviço
			const notification = await this.notificationService.createAndSendNotification({
				type: NotificationType.EMAIL,
				templateCode: EmailTemplateType.SCHEDULING_CANCELLATION,
				templateData,
				schedulingId,
			});

			res.status(201).json({
				status: "success",
				data: {
					notification: {
						id: notification.id,
						type: notification.type,
						status: notification.status,
					},
				},
				message: "Email de cancelamento enviado com sucesso",
			});
		} catch (error) {
			logger.error("Erro ao enviar email de cancelamento:", error);
			res.status(500).json({
				status: "error",
				message: error instanceof Error ? error.message : "Erro ao enviar email de cancelamento",
			});
		}
	}

	/**
	 * Envia uma notificação de reagendamento por email
	 */
	async sendSchedulingRescheduled(req: Request, res: Response): Promise<void> {
		try {
			const { schedulingId, customerName, petName, serviceName, dateTime, additionalInfo } =
				req.body;

			// Validar dados da requisição
			if (!schedulingId || !customerName || !petName || !serviceName || !dateTime) {
				res.status(400).json({
					status: "error",
					message: "Dados obrigatórios: schedulingId, customerName, petName, serviceName, dateTime",
				});
				return;
			}

			const templateData = {
				customerName,
				petName,
				serviceName,
				dateTime,
				additionalInfo: additionalInfo || "",
				// Dados opcionais
				address: req.body.address,
				price: req.body.price,
			};

			// Criar e enviar notificação usando o serviço
			const notification = await this.notificationService.createAndSendNotification({
				type: NotificationType.EMAIL,
				templateCode: EmailTemplateType.SCHEDULING_RESCHEDULED,
				templateData,
				schedulingId,
			});

			res.status(201).json({
				status: "success",
				data: {
					notification: {
						id: notification.id,
						type: notification.type,
						status: notification.status,
					},
				},
				message: "Email de reagendamento enviado com sucesso",
			});
		} catch (error) {
			logger.error("Erro ao enviar email de reagendamento:", error);
			res.status(500).json({
				status: "error",
				message: error instanceof Error ? error.message : "Erro ao enviar email de reagendamento",
			});
		}
	}
}
