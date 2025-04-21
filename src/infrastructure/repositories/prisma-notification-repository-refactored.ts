import { PrismaClient, NotificationStatus as PrismaNotificationStatus } from '@prisma/client';
import { Notification, NotificationType, NotificationStatus } from '../../domain/entities/notification.js';
import { NotificationFilter, NotificationRepository } from '../../domain/repositories/notification-repository.js';
import { PrismaRepositoryBase } from './base/prisma-repository-base.js';
import { NotificationMapper } from '../mappers/notification-mapper.js';
import { NotificationValidator } from '../validators/notification-validator.js';
import { NotificationStatusOperations } from './operations/notification-status-operations.js';
import { Result } from '../../shared/utils/result.js';
import { logger } from '../../shared/utils/logger.js';

/**
 * Implementação refatorada do repositório de notificações usando Prisma
 */
export class PrismaNotificationRepositoryRefactored extends PrismaRepositoryBase implements NotificationRepository {
  private readonly statusOperations: NotificationStatusOperations;

  constructor(prisma: PrismaClient) {
    super(prisma);
    this.statusOperations = new NotificationStatusOperations(this.prismaTransaction);
  }

  /**
   * Salva uma notificação (cria ou atualiza)
   */
  async save(notification: Notification): Promise<Notification> {
    try {
      const validationResult = Result.try(() => 
        NotificationValidator.validateBasicData(
          notification.id,
          notification.content,
          notification.schedulingId
        )
      );
      
      if (validationResult.isFailure) {
        return this.handleError(validationResult.error, 'save', { notificationId: notification.id });
      }

      const updatedNotification = await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          content: notification.content,
          status: NotificationMapper.mapDomainStatusToPrisma(notification.status),
        },
      });

      return NotificationMapper.toDomain(updatedNotification);
    } catch (error) {
      return this.handleError(error, 'save', { notificationId: notification.id });
    }
  }

  /**
   * Cria uma nova notificação
   */
  async create(
    id: string,
    type: NotificationType,
    content: string,
    schedulingId: string,
    status: NotificationStatus = NotificationStatus.PENDING
  ): Promise<Notification> {
    try {
      const validationResult = Result.try(() => 
        NotificationValidator.validateBasicData(id, content, schedulingId)
      );
      
      if (validationResult.isFailure) {
        return this.handleError(validationResult.error, 'create', { id, type, schedulingId });
      }

      const createdNotification = await this.prisma.notification.create({
        data: {
          id,
          type: NotificationMapper.mapDomainTypeToPrisma(type),
          content,
          status: NotificationMapper.mapDomainStatusToPrisma(status),
          schedulingId,
          sentAt: new Date(),
        },
      });

      return NotificationMapper.toDomain(createdNotification);
    } catch (error) {
      return this.handleError(error, 'create', { id, type, schedulingId });
    }
  }

  /**
   * Encontra uma notificação pelo ID
   */
  async findById(id: string): Promise<Notification | null> {
    try {
      const validationResult = Result.try(() => 
        NotificationValidator.validateId(id, 'notificação para busca')
      );
      
      if (validationResult.isFailure) {
        return this.handleError(validationResult.error, 'findById', { id });
      }

      const notification = await this.prisma.notification.findUnique({
        where: { id },
      });

      if (!notification) {
        return null;
      }

      return NotificationMapper.toDomain(notification);
    } catch (error) {
      return this.handleError(error, 'findById', { id });
    }
  }

  /**
   * Procura notificações que correspondam aos filtros fornecidos
   */
  async findAll(filter: NotificationFilter, limit?: number, offset?: number): Promise<Notification[]> {
    try {
      const { id, type, status, schedulingId, startDate, endDate } = filter;

      const notifications = await this.prisma.notification.findMany({
        where: {
          id: id ? { equals: id } : undefined,
          type: type ? { equals: NotificationMapper.mapDomainTypeToPrisma(type) } : undefined,
          status: status ? { equals: NotificationMapper.mapDomainStatusToPrisma(status) } : undefined,
          schedulingId: schedulingId ? { equals: schedulingId } : undefined,
          sentAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        take: limit,
        skip: offset,
        orderBy: {
          sentAt: 'desc',
        },
      });

      return notifications.map(notification => NotificationMapper.toDomain(notification));
    } catch (error) {
      return this.handleError(error, 'findAll', filter as unknown as Record<string, unknown>);
    }
  }

  /**
   * Encontra notificações pendentes para envio
   */
  async findPendingNotifications(limit?: number): Promise<Notification[]> {
    try {
      const notifications = await this.prisma.notification.findMany({
        where: {
          status: { equals: PrismaNotificationStatus.PENDING },
        },
        take: limit,
        orderBy: {
          sentAt: 'asc',
        },
      });

      return notifications.map(notification => NotificationMapper.toDomain(notification));
    } catch (error) {
      return this.handleError(error, 'findPendingNotifications', { limit });
    }
  }

  /**
   * Encontra notificações por agendamento
   */
  async findBySchedulingId(schedulingId: string): Promise<Notification[]> {
    try {
      const validationResult = Result.try(() => 
        NotificationValidator.validateId(schedulingId, 'agendamento para busca')
      );
      
      if (validationResult.isFailure) {
        return this.handleError(validationResult.error, 'findBySchedulingId', { schedulingId });
      }

      const notifications = await this.prisma.notification.findMany({
        where: {
          schedulingId,
        },
        orderBy: {
          sentAt: 'desc',
        },
      });

      return notifications.map(notification => NotificationMapper.toDomain(notification));
    } catch (error) {
      return this.handleError(error, 'findBySchedulingId', { schedulingId });
    }
  }

  /**
   * Marca uma notificação como enviada
   */
  async markAsSent(id: string, sentAt?: Date): Promise<Notification> {
    const result = await this.statusOperations.markAsSent(id, sentAt);
    if (result.isFailure) {
      return this.handleError(result.error, 'markAsSent', { id, sentAt });
    }
    return result.value;
  }

  /**
   * Marca uma notificação como entregue
   */
  async markAsDelivered(id: string, deliveredAt?: Date): Promise<Notification> {
    const result = await this.statusOperations.markAsDelivered(id, deliveredAt);
    if (result.isFailure) {
      return this.handleError(result.error, 'markAsDelivered', { id, deliveredAt });
    }
    return result.value;
  }

  /**
   * Marca uma notificação como falha
   */
  async markAsFailed(id: string, reason: string, failedAt?: Date): Promise<Notification> {
    const result = await this.statusOperations.markAsFailed(id, reason, failedAt);
    if (result.isFailure) {
      return this.handleError(result.error, 'markAsFailed', { id, reason, failedAt });
    }
    return result.value;
  }

  /**
   * Prepara uma notificação para nova tentativa de envio
   */
  async retry(id: string): Promise<Notification> {
    const result = await this.statusOperations.retry(id);
    if (result.isFailure) {
      return this.handleError(result.error, 'retry', { id });
    }
    return result.value;
  }

  /**
   * Atualiza o conteúdo de uma notificação
   */
  async updateContent(id: string, content: string): Promise<Notification> {
    const result = await this.statusOperations.updateContent(id, content);
    if (result.isFailure) {
      return this.handleError(result.error, 'updateContent', { id, content });
    }
    return result.value;
  }

  /**
   * Conta o número total de notificações que correspondem aos filtros
   */
  async count(filter: NotificationFilter): Promise<number> {
    try {
      const { id, type, status, schedulingId, startDate, endDate } = filter;

      const count = await this.prisma.notification.count({
        where: {
          id: id ? { equals: id } : undefined,
          type: type ? { equals: NotificationMapper.mapDomainTypeToPrisma(type) } : undefined,
          status: status ? { equals: NotificationMapper.mapDomainStatusToPrisma(status) } : undefined,
          schedulingId: schedulingId ? { equals: schedulingId } : undefined,
          sentAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      return count;
    } catch (error) {
      return this.handleError(error, 'count', filter as unknown as Record<string, unknown>);
    }
  }

  /**
   * Exclui uma notificação pelo ID
   */
  async delete(id: string): Promise<void> {
    try {
      const validationResult = Result.try(() => 
        NotificationValidator.validateId(id, 'notificação para exclusão')
      );
      
      if (validationResult.isFailure) {
        this.handleError(validationResult.error, 'delete', { id });
        return;
      }

      await this.prisma.notification.delete({
        where: { id },
      });
    } catch (error) {
      this.handleError(error, 'delete', { id });
    }
  }
} 