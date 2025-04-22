import {
	NotificationService,
	CreateNotificationData,
} from "../../../domain/services/notification/notification-service.js";
import { NotificationType } from "../../../domain/entities/notification.js";
import { logger } from "../../../shared/utils/logger.js";

interface SendSchedulingConfirmationRequest {
	schedulingId: string;
	additionalInfo?: string;
}

/**
 * Caso de uso para enviar confirmação de agendamento
 */
export class SendSchedulingConfirmationUseCase {
	/**
	 * Cria uma nova instância do caso de uso
	 * @param notificationService Serviço de notificações
	 */
	constructor(private readonly notificationService: NotificationService) {}

	/**
	 * Executa o caso de uso
	 * @param request Dados da requisição
	 */
	async execute(request: SendSchedulingConfirmationRequest): Promise<void> {
		try {
			logger.info("Enviando confirmação de agendamento", { schedulingId: request.schedulingId });

			// Criar dados da notificação
			const notificationData: CreateNotificationData = {
				type: NotificationType.EMAIL,
				templateCode: "scheduling_confirmation",
				templateData: {
					schedulingId: request.schedulingId,
					additionalInfo: request.additionalInfo || "",
				},
				schedulingId: request.schedulingId,
			};

			// Criar e enviar notificação usando o serviço
			const notification =
				await this.notificationService.createAndSendNotification(notificationData);

			logger.info("Confirmação de agendamento enviada com sucesso", {
				schedulingId: request.schedulingId,
				notificationId: notification.id,
			});
		} catch (error) {
			logger.error("Erro ao enviar confirmação de agendamento", {
				schedulingId: request.schedulingId,
				error,
			});
			throw error;
		}
	}
}
