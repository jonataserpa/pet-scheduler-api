import { Request, Response } from "express";
import { NotificationService } from "../../domain/services/notification/notification-service.js";
import { NotificationType } from "../../domain/entities/notification.js";
import { logger } from "../../shared/utils/logger.js";

/**
 * Controlador para gerenciamento de notificações por WhatsApp
 */
export class WhatsAppNotificationController {
	/**
	 * Cria uma nova instância do controlador de notificações por WhatsApp
	 * @param notificationService Serviço de notificações
	 */
	constructor(private readonly notificationService: NotificationService) {}

	/**
	 * Envia uma notificação de confirmação de agendamento por WhatsApp
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
				// Dados opcionais
				address: req.body.address,
				price: req.body.price,
			};

			// Criar e enviar notificação usando o serviço
			const notification = await this.notificationService.createAndSendNotification({
				type: NotificationType.WHATSAPP,
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
				message: "Mensagem WhatsApp de confirmação enviada com sucesso",
			});
		} catch (error) {
			logger.error("Erro ao enviar mensagem WhatsApp de confirmação:", error);
			res.status(500).json({
				status: "error",
				message:
					error instanceof Error
						? error.message
						: "Erro ao enviar mensagem WhatsApp de confirmação",
			});
		}
	}

	/**
	 * Envia uma notificação de lembrete de agendamento por WhatsApp
	 */
	async sendSchedulingReminder(req: Request, res: Response): Promise<void> {
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
				// Dados opcionais
				address: req.body.address,
			};

			// Criar e enviar notificação usando o serviço
			const notification = await this.notificationService.createAndSendNotification({
				type: NotificationType.WHATSAPP,
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
				message: "Mensagem WhatsApp de lembrete enviada com sucesso",
			});
		} catch (error) {
			logger.error("Erro ao enviar mensagem WhatsApp de lembrete:", error);
			res.status(500).json({
				status: "error",
				message:
					error instanceof Error ? error.message : "Erro ao enviar mensagem WhatsApp de lembrete",
			});
		}
	}

	/**
	 * Envia uma notificação de cancelamento de agendamento por WhatsApp
	 */
	async sendSchedulingCancellation(req: Request, res: Response): Promise<void> {
		try {
			const { schedulingId, customerName, dateTime, phoneNumber, cancellationReason } = req.body;

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
				additionalInfo: cancellationReason || "Cancelamento solicitado",
			};

			// Criar e enviar notificação usando o serviço
			const notification = await this.notificationService.createAndSendNotification({
				type: NotificationType.WHATSAPP,
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
				message: "Mensagem WhatsApp de cancelamento enviada com sucesso",
			});
		} catch (error) {
			logger.error("Erro ao enviar mensagem WhatsApp de cancelamento:", error);
			res.status(500).json({
				status: "error",
				message:
					error instanceof Error
						? error.message
						: "Erro ao enviar mensagem WhatsApp de cancelamento",
			});
		}
	}

	/**
	 * Envia uma notificação de reagendamento por WhatsApp
	 */
	async sendSchedulingRescheduled(req: Request, res: Response): Promise<void> {
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
				// Dados opcionais
				address: req.body.address,
				price: req.body.price,
			};

			// Criar e enviar notificação usando o serviço
			const notification = await this.notificationService.createAndSendNotification({
				type: NotificationType.WHATSAPP,
				templateCode: "scheduling_rescheduled",
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
				message: "Mensagem WhatsApp de reagendamento enviada com sucesso",
			});
		} catch (error) {
			logger.error("Erro ao enviar mensagem WhatsApp de reagendamento:", error);
			res.status(500).json({
				status: "error",
				message:
					error instanceof Error
						? error.message
						: "Erro ao enviar mensagem WhatsApp de reagendamento",
			});
		}
	}
}
