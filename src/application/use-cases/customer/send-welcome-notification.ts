import { NotificationService } from '../../../domain/services/notification/notification-service.js';
import { Customer } from '../../../domain/entities/customer.js';
import { NotificationType } from '../../../domain/entities/notification.js';
import { logger } from '../../../shared/utils/logger.js';

interface SendWelcomeNotificationRequest {
  customer: Customer;
  template?: 'default' | 'premium' | 'promotional';
}

/**
 * Caso de uso para enviar notificação de boas-vindas para novos clientes
 */
export class SendWelcomeNotificationUseCase {
  /**
   * Cria uma nova instância do caso de uso
   * @param notificationService Serviço de notificações
   */
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Executa o caso de uso
   * @param request Dados da requisição
   */
  async execute(request: SendWelcomeNotificationRequest): Promise<void> {
    try {
      const { customer, template = 'default' } = request;
      
      logger.info('Enviando notificação de boas-vindas', {
        customerId: customer.id,
        template
      });

      // Determinar código do template a ser usado
      const templateCode = `customer_welcome_${template}`;

      // Obter contatos do cliente
      const customerData = customer.toObject(); // Assumindo que a entidade tem método toObject()
      const email = customerData.contact?.email;
      const phone = customerData.contact?.phone;

      if (!email) {
        throw new Error(`Cliente não possui email para receber notificação: ${customer.id}`);
      }

      // Criar notificação para o cliente
      await this.notificationService.createAndSendNotification({
        type: NotificationType.EMAIL,
        templateCode,
        templateData: {
          customerName: customer.name,
          email,
          phone: phone || 'Não informado'
        },
        schedulingId: `welcome-${customer.id}`
      });

      // Se o cliente forneceu um número de telefone, enviar também por SMS
      if (phone) {
        await this.notificationService.createAndSendNotification({
          type: NotificationType.SMS,
          templateCode: 'customer_welcome_sms',
          templateData: {
            customerName: customer.name,
            phoneNumber: phone
          },
          schedulingId: `welcome-sms-${customer.id}`
        });
      }

      logger.info('Notificação de boas-vindas enviada com sucesso', {
        customerId: customer.id
      });
    } catch (error) {
      logger.error('Erro ao enviar notificação de boas-vindas', {
        customerId: request.customer.id,
        error
      });
      throw error;
    }
  }
} 