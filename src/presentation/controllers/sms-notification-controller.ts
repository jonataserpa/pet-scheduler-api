import { Request, Response } from "express";
import { NotificationService } from "../../domain/services/notification/notification-service.js";
import { NotificationType } from "../../domain/entities/notification.js";
import { logger } from "../../shared/utils/logger.js";

/**
 * Controlador para gerenciamento de notificações por SMS
 */
export class SmsNotificationController {
	/**
	 * Cria uma nova instância do controlador de notificações por SMS
	 * @param notificationService Serviço de notificações
	 */
	constructor(private readonly notificationService: NotificationService) {}

	/**
	 * Envia um SMS de confirmação de agendamento
	 */
	async sendSchedulingConfirmation(req: Request, res: Response): Promise<void> {
		try {
			const { schedulingId, customerName, petName, serviceName, dateTime, phoneNumber } = req.body;

			// Validar dados da requisição
			if (!schedulingId || !customerName || !phoneNumber || !dateTime) {
				res.status(400).json({
					status: "error",
					message: "Dados obrigatórios: schedulingId, customerName, phoneNumber, dateTime",
				});
				return;
			}

			const templateData = {
				customerName,
				petName: petName || "seu pet",
				serviceName: serviceName || "atendimento",
				dateTime,
				phoneNumber,
			};

			// Criar e enviar notificação usando o serviço
			const notification = await this.notificationService.createAndSendNotification({
				type: NotificationType.SMS,
				templateCode: "scheduling_confirmation",
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
				message: "SMS de confirmação enviado com sucesso",
			});
		} catch (error) {
			logger.error("Erro ao enviar SMS de confirmação:", error);
			res.status(500).json({
				status: "error",
				message: error instanceof Error ? error.message : "Erro ao enviar SMS de confirmação",
			});
		}
	}

	/**
	 * Envia um SMS de lembrete de agendamento
	 */
	async sendSchedulingReminder(req: Request, res: Response): Promise<void> {
		try {
			const { schedulingId, customerName, dateTime, phoneNumber } = req.body;

			// Validar dados da requisição
			if (!schedulingId || !customerName || !phoneNumber || !dateTime) {
				res.status(400).json({
					status: "error",
					message: "Dados obrigatórios: schedulingId, customerName, phoneNumber, dateTime",
				});
				return;
			}

			const templateData = {
				customerName,
				dateTime,
				phoneNumber,
			};

			// Criar e enviar notificação usando o serviço
			const notification = await this.notificationService.createAndSendNotification({
				type: NotificationType.SMS,
				templateCode: "scheduling_reminder",
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
				message: "SMS de lembrete enviado com sucesso",
			});
		} catch (error) {
			logger.error("Erro ao enviar SMS de lembrete:", error);
			res.status(500).json({
				status: "error",
				message: error instanceof Error ? error.message : "Erro ao enviar SMS de lembrete",
			});
		}
	}

	/**
	 * Envia um SMS de cancelamento de agendamento
	 */
	async sendSchedulingCancellation(req: Request, res: Response): Promise<void> {
		try {
			const { schedulingId, customerName, dateTime, phoneNumber } = req.body;

			// Validar dados da requisição
			if (!schedulingId || !customerName || !phoneNumber || !dateTime) {
				res.status(400).json({
					status: "error",
					message: "Dados obrigatórios: schedulingId, customerName, phoneNumber, dateTime",
				});
				return;
			}

			const templateData = {
				customerName,
				dateTime,
				phoneNumber,
			};

			// Criar e enviar notificação usando o serviço
			const notification = await this.notificationService.createAndSendNotification({
				type: NotificationType.SMS,
				templateCode: "scheduling_cancellation",
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
				message: "SMS de cancelamento enviado com sucesso",
			});
		} catch (error) {
			logger.error("Erro ao enviar SMS de cancelamento:", error);
			res.status(500).json({
				status: "error",
				message: error instanceof Error ? error.message : "Erro ao enviar SMS de cancelamento",
			});
		}
	}
}
