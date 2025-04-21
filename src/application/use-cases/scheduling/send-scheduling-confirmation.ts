import { NotificationService } from '../../../domain/services/notification/notification-service.js';
import { Notification } from '../../../domain/entities/notification.js';
import { logger } from '../../../shared/utils/logger.js';

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
      logger.info('Enviando confirmação de agendamento', { schedulingId: request.schedulingId });

      // Criar objeto de notificação
      const notification = new Notification({
        id: crypto.randomUUID(),
        type: 'scheduling.confirmation',
        schedulingId: request.schedulingId,
        content: request.additionalInfo || '',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Enviar notificação
      await this.notificationService.sendNotification(notification);

      logger.info('Confirmação de agendamento enviada com sucesso', { 
        schedulingId: request.schedulingId,
        notificationId: notification.id
      });
    } catch (error) {
      logger.error('Erro ao enviar confirmação de agendamento', {
        schedulingId: request.schedulingId,
        error
      });
      throw error;
    }
  }
} 