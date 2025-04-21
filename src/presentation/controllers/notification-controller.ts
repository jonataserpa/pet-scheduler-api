import { Request, Response } from 'express';
import { NotificationService } from '../../domain/services/notification/notification-service.js';
import { logger } from '../../shared/utils/logger.js';
import { NotificationType } from '../../domain/entities/notification.js';
import { Result } from '../../shared/utils/result.js';

/**
 * Controlador para gerenciamento de notificações
 */
export class NotificationController {
  /**
   * Cria uma nova instância do controlador de notificações
   * @param notificationService Serviço de notificações
   */
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Envia uma notificação baseada no template e tipo especificados
   */
  async sendNotification(req: Request, res: Response): Promise<void> {
    try {
      const { type, templateCode, templateData, schedulingId } = req.body;

      // Validar dados da requisição
      if (!type || !templateCode || !schedulingId) {
        res.status(400).json({
          status: 'error',
          message: 'Tipo de notificação, código de template e ID do agendamento são obrigatórios',
        });
        return;
      }

      // Validar tipo de notificação
      if (!Object.values(NotificationType).includes(type)) {
        res.status(400).json({
          status: 'error',
          message: `Tipo de notificação inválido. Valores permitidos: ${Object.values(NotificationType).join(', ')}`,
        });
        return;
      }

      // Criar e enviar notificação
      const notification = await this.notificationService.createAndSendNotification({
        type,
        templateCode,
        templateData: templateData || {},
        schedulingId,
      });

      res.status(201).json({
        status: 'success',
        data: {
          notification: {
            id: notification.id,
            type: notification.type,
            status: notification.status,
            schedulingId: notification.schedulingId,
          },
        },
      });
    } catch (error) {
      logger.error('Erro ao enviar notificação:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Erro ao enviar notificação',
      });
    }
  }

  /**
   * Obtém notificações por ID de agendamento
   */
  async getNotificationsByScheduling(req: Request, res: Response): Promise<void> {
    try {
      const { schedulingId } = req.params;

      if (!schedulingId) {
        res.status(400).json({
          status: 'error',
          message: 'ID do agendamento é obrigatório',
        });
        return;
      }

      const notifications = await this.notificationService.getNotificationsForScheduling(schedulingId);

      res.status(200).json({
        status: 'success',
        data: {
          notifications: notifications.map(notification => ({
            id: notification.id,
            type: notification.type,
            status: notification.status,
            sentAt: notification.sentAt,
            deliveredAt: notification.deliveredAt,
          })),
        },
      });
    } catch (error) {
      logger.error('Erro ao buscar notificações por agendamento:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Erro ao buscar notificações',
      });
    }
  }

  /**
   * Reenvia uma notificação que falhou
   */
  async resendNotification(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          status: 'error',
          message: 'ID da notificação é obrigatório',
        });
        return;
      }

      // Buscar a notificação e verificar se pode ser reenviada
      const result = await Result.tryAsync(async () => {
        const notification = await this.notificationService.resendFailedNotification(id);
        return notification;
      });

      if (result.isFailure) {
        const { message } = result.error;
        const status = message.includes('não encontrada') ? 404 : 400;
        
        res.status(status).json({
          status: 'error',
          message,
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        data: {
          notification: {
            id: result.value.id,
            type: result.value.type,
            status: result.value.status,
            schedulingId: result.value.schedulingId,
          },
        },
        message: 'Notificação reenviada com sucesso',
      });
    } catch (error) {
      logger.error('Erro ao reenviar notificação:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Erro ao reenviar notificação',
      });
    }
  }

  /**
   * Processa notificações pendentes
   */
  async processPendingNotifications(req: Request, res: Response): Promise<void> {
    try {
      const { limit } = req.query;
      const limitNumber = limit ? parseInt(limit as string, 10) : 50;

      const processedCount = await this.notificationService.sendPendingNotifications(limitNumber);

      res.status(200).json({
        status: 'success',
        data: {
          processedCount,
        },
        message: `${processedCount} notificações processadas`,
      });
    } catch (error) {
      logger.error('Erro ao processar notificações pendentes:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Erro ao processar notificações pendentes',
      });
    }
  }
} 