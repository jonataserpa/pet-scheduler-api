import { Notification, NotificationType, NotificationStatus } from '../../entities/notification.js';
import { NotificationRepository } from '../../repositories/notification-repository.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../../shared/utils/logger.js';

/**
 * Interface para provedores de envio de notificação
 */
export interface NotificationProvider {
  /**
   * Envia uma notificação
   * @param notification A notificação a ser enviada
   */
  send(notification: Notification): Promise<void>;
}

/**
 * Configuração de tipo de notificação
 */
export interface NotificationTypeConfig {
  /**
   * Provedor específico para um tipo de notificação
   */
  provider: NotificationProvider;
  
  /**
   * Templates disponíveis para este tipo de notificação
   */
  templates: Record<string, (data: Record<string, any>) => string>;
}

/**
 * Dados para criação de uma notificação
 */
export interface CreateNotificationData {
  /**
   * O tipo de notificação (email, SMS, WhatsApp)
   */
  type: NotificationType;
  
  /**
   * O código do template a ser usado
   */
  templateCode: string;
  
  /**
   * Dados para preencher o template
   */
  templateData: Record<string, any>;
  
  /**
   * ID do agendamento relacionado
   */
  schedulingId: string;
}

/**
 * Serviço para gerenciamento de notificações
 */
export class NotificationService {
  private readonly typeConfigs: Record<NotificationType, NotificationTypeConfig>;
  
  /**
   * Cria uma nova instância do serviço de notificações
   * @param notificationRepository Repositório de notificações
   * @param emailProvider Provedor de envio de email
   * @param smsProvider Provedor de envio de SMS
   * @param whatsappProvider Provedor de envio de WhatsApp
   */
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly emailProvider?: NotificationProvider,
    private readonly smsProvider?: NotificationProvider,
    private readonly whatsappProvider?: NotificationProvider
  ) {
    this.typeConfigs = {} as Record<NotificationType, NotificationTypeConfig>;
    
    // Configurar provedores disponíveis
    if (emailProvider) {
      this.typeConfigs[NotificationType.EMAIL] = {
        provider: emailProvider,
        templates: this.getEmailTemplates(),
      };
    }
    
    if (smsProvider) {
      this.typeConfigs[NotificationType.SMS] = {
        provider: smsProvider,
        templates: this.getSmsTemplates(),
      };
    }
    
    if (whatsappProvider) {
      this.typeConfigs[NotificationType.WHATSAPP] = {
        provider: whatsappProvider,
        templates: this.getWhatsappTemplates(),
      };
    }
  }
  
  /**
   * Cria e salva uma nova notificação sem enviá-la
   */
  async createNotification(data: CreateNotificationData): Promise<Notification> {
    try {
      const { type, templateCode, templateData, schedulingId } = data;
      
      // Verificar se existe configuração para o tipo
      const typeConfig = this.typeConfigs[type];
      if (!typeConfig) {
        throw new Error(`Tipo de notificação não configurado: ${type}`);
      }
      
      // Verificar se o template existe
      const template = typeConfig.templates[templateCode];
      if (!template) {
        throw new Error(`Template não encontrado: ${templateCode} para tipo ${type}`);
      }
      
      // Gerar conteúdo usando o template
      const content = template(templateData);
      
      // Criar a notificação no repositório
      const id = uuidv4();
      return await this.notificationRepository.create(
        id,
        type,
        content,
        schedulingId
      );
    } catch (error) {
      logger.error('Erro ao criar notificação:', error);
      throw error;
    }
  }
  
  /**
   * Envia notificações pendentes
   * @param limit Número máximo de notificações a serem processadas
   * @returns O número de notificações processadas com sucesso
   */
  async sendPendingNotifications(limit = 50): Promise<number> {
    try {
      // Buscar notificações pendentes
      const notifications = await this.notificationRepository.findPendingNotifications(limit);
      logger.info(`Processando ${notifications.length} notificações pendentes`);
      
      let successCount = 0;
      
      // Processar cada notificação
      for (const notification of notifications) {
        try {
          // Verificar se existe configuração para o tipo
          const typeConfig = this.typeConfigs[notification.type];
          if (!typeConfig) {
            logger.warn(`Tipo de notificação não configurado: ${notification.type}`);
            await this.notificationRepository.markAsFailed(
              notification.id,
              `Provedor não configurado para tipo: ${notification.type}`
            );
            continue;
          }
          
          // Enviar a notificação
          await typeConfig.provider.send(notification);
          
          // Marcar como enviada
          await this.notificationRepository.markAsSent(notification.id);
          successCount++;
        } catch (error) {
          logger.error(`Erro ao enviar notificação ${notification.id}:`, error);
          
          // Marcar como falha
          const reason = error instanceof Error ? error.message : 'Erro desconhecido';
          await this.notificationRepository.markAsFailed(notification.id, reason);
        }
      }
      
      return successCount;
    } catch (error) {
      logger.error('Erro ao processar notificações pendentes:', error);
      throw error;
    }
  }
  
  /**
   * Reagenda notificações que falharam para uma nova tentativa
   * @param limit Número máximo de notificações a serem reagendadas
   * @returns O número de notificações reagendadas
   */
  async retryFailedNotifications(limit = 50): Promise<number> {
    try {
      // Buscar notificações com status FAILED
      const filter = {
        status: NotificationStatus.FAILED,
      };
      
      const failedNotifications = await this.notificationRepository.findAll(filter, limit);
      let retryCount = 0;
      
      for (const notification of failedNotifications) {
        try {
          await this.notificationRepository.retry(notification.id);
          retryCount++;
        } catch (error) {
          logger.error(`Erro ao reagendar notificação ${notification.id}:`, error);
        }
      }
      
      return retryCount;
    } catch (error) {
      logger.error('Erro ao reagendar notificações com falha:', error);
      throw error;
    }
  }
  
  /**
   * Busca notificações para um agendamento específico
   */
  async getNotificationsForScheduling(schedulingId: string): Promise<Notification[]> {
    return this.notificationRepository.findBySchedulingId(schedulingId);
  }
  
  /**
   * Cria e envia uma notificação imediatamente
   */
  async createAndSendNotification(data: CreateNotificationData): Promise<Notification> {
    const notification = await this.createNotification(data);
    
    try {
      // Verificar se existe configuração para o tipo
      const typeConfig = this.typeConfigs[notification.type];
      if (!typeConfig) {
        throw new Error(`Tipo de notificação não configurado: ${notification.type}`);
      }
      
      // Enviar a notificação
      await typeConfig.provider.send(notification);
      
      // Marcar como enviada
      await this.notificationRepository.markAsSent(notification.id);
      
      return notification;
    } catch (error) {
      logger.error(`Erro ao enviar notificação ${notification.id}:`, error);
      
      // Marcar como falha
      const reason = error instanceof Error ? error.message : 'Erro desconhecido';
      await this.notificationRepository.markAsFailed(notification.id, reason);
      
      throw error;
    }
  }
  
  /**
   * Retorna os templates disponíveis para emails
   * Poderia ser implementado de forma mais sofisticada, como carregar de arquivos
   */
  private getEmailTemplates(): Record<string, (data: Record<string, any>) => string> {
    return {
      'appointment_confirmation': (data) => `
        Olá ${data.customerName},
        
        Confirmamos seu agendamento para ${data.serviceName} no dia ${this.formatDate(data.date)} às ${data.time}.
        
        Por favor, chegue com 10 minutos de antecedência.
        
        Atenciosamente,
        Equipe Pet Shop
      `,
      
      'appointment_reminder': (data) => `
        Olá ${data.customerName},
        
        Lembramos que seu pet ${data.petName} tem um agendamento para ${data.serviceName} amanhã às ${data.time}.
        
        Atenciosamente,
        Equipe Pet Shop
      `,
      
      'appointment_cancelled': (data) => `
        Olá ${data.customerName},
        
        Seu agendamento para ${data.serviceName} no dia ${this.formatDate(data.date)} foi cancelado conforme solicitado.
        
        Atenciosamente,
        Equipe Pet Shop
      `,
    };
  }
  
  /**
   * Retorna os templates disponíveis para SMS
   */
  private getSmsTemplates(): Record<string, (data: Record<string, any>) => string> {
    return {
      'appointment_confirmation': (data) => 
        `Agendamento confirmado: ${data.serviceName} dia ${this.formatDate(data.date)} às ${data.time}. Pet Shop.`,
      
      'appointment_reminder': (data) => 
        `Lembrete: ${data.petName} tem agendamento amanhã às ${data.time} para ${data.serviceName}. Pet Shop.`,
      
      'appointment_cancelled': (data) => 
        `Agendamento cancelado: ${data.serviceName} dia ${this.formatDate(data.date)}. Pet Shop.`,
    };
  }
  
  /**
   * Retorna os templates disponíveis para WhatsApp
   */
  private getWhatsappTemplates(): Record<string, (data: Record<string, any>) => string> {
    return {
      'appointment_confirmation': (data) => `
        *Confirmação de Agendamento*
        
        Olá ${data.customerName},
        
        Confirmamos seu agendamento para ${data.serviceName} no dia ${this.formatDate(data.date)} às ${data.time}.
        
        Por favor, chegue com 10 minutos de antecedência.
        
        Atenciosamente,
        Equipe Pet Shop
      `,
      
      'appointment_reminder': (data) => `
        *Lembrete de Agendamento*
        
        Olá ${data.customerName},
        
        Lembramos que seu pet ${data.petName} tem um agendamento para ${data.serviceName} amanhã às ${data.time}.
        
        Atenciosamente,
        Equipe Pet Shop
      `,
      
      'appointment_cancelled': (data) => `
        *Agendamento Cancelado*
        
        Olá ${data.customerName},
        
        Seu agendamento para ${data.serviceName} no dia ${this.formatDate(data.date)} foi cancelado conforme solicitado.
        
        Atenciosamente,
        Equipe Pet Shop
      `,
    };
  }
  
  /**
   * Formata uma data para exibição
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
} 