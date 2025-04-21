import { PrismaClient } from '@prisma/client';
import { Notification, NotificationType, NotificationStatus } from '../../domain/entities/notification.js';
import { NotificationFilter, NotificationRepository } from '../../domain/repositories/notification-repository.js';
import { PrismaNotificationRepositoryRefactored } from './prisma-notification-repository-refactored.js';
import { NotificationCache } from '../cache/notification-cache.js';
import { PerformanceMonitor } from '../monitoring/performance-monitor.js';
import { logger } from '../../shared/utils/logger.js';

/**
 * Implementação do repositório de notificações com cache e monitoramento de performance
 */
export class PrismaNotificationRepositoryCached implements NotificationRepository {
  private readonly baseRepository: PrismaNotificationRepositoryRefactored;
  private readonly cache: NotificationCache;
  private readonly monitor: PerformanceMonitor;

  constructor(
    prisma: PrismaClient,
    cache: NotificationCache,
    monitor?: PerformanceMonitor
  ) {
    this.baseRepository = new PrismaNotificationRepositoryRefactored(prisma);
    this.cache = cache;
    this.monitor = monitor || new PerformanceMonitor('Notification');
  }

  /**
   * Salva uma notificação (cria ou atualiza)
   */
  async save(notification: Notification): Promise<Notification> {
    return this.monitor.measure(
      'save',
      async () => {
        const result = await this.baseRepository.save(notification);
        // Atualizar o cache com a notificação salva
        await this.cache.setNotification(result);
        // Invalidar caches de listas que podem incluir esta notificação
        await this.cache.invalidateAllLists();
        return result;
      },
      { notificationId: notification.id }
    );
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
    return this.monitor.measure(
      'create',
      async () => {
        const result = await this.baseRepository.create(id, type, content, schedulingId, status);
        // Atualizar o cache com a nova notificação
        await this.cache.setNotification(result);
        // Invalidar caches de listas que podem incluir esta notificação
        await this.cache.invalidateAllLists();
        return result;
      },
      { id, type, schedulingId }
    );
  }

  /**
   * Encontra uma notificação pelo ID
   */
  async findById(id: string): Promise<Notification | null> {
    return this.monitor.measure(
      'findById',
      async () => {
        // Verificar se a notificação está no cache
        const cachedNotification = await this.cache.getNotification(id);
        if (cachedNotification) {
          logger.debug('Notificação recuperada do cache', { id });
          return cachedNotification;
        }

        // Se não estiver no cache, buscar do repositório base
        const notification = await this.baseRepository.findById(id);
        
        // Se encontrou, salvar no cache para futuras consultas
        if (notification) {
          await this.cache.setNotification(notification);
        }
        
        return notification;
      },
      { id }
    );
  }

  /**
   * Procura notificações que correspondam aos filtros fornecidos
   */
  async findAll(filter: NotificationFilter, limit?: number, offset?: number): Promise<Notification[]> {
    return this.monitor.measure(
      'findAll',
      async () => {
        // Criar um objeto com todos os filtros para usar como chave de cache
        const cacheFilters = {
          ...filter,
          limit,
          offset,
        };
        
        // Verificar se a lista está no cache
        const cachedList = await this.cache.getNotificationList(cacheFilters);
        if (cachedList) {
          logger.debug('Lista de notificações recuperada do cache', { 
            filterCount: Object.keys(filter).length,
            limit,
            offset
          });
          return cachedList;
        }

        // Se não estiver no cache, buscar do repositório base
        const notifications = await this.baseRepository.findAll(filter, limit, offset);
        
        // Salvar no cache para futuras consultas, mas com TTL menor para listas (1 minuto)
        await this.cache.setNotificationList(notifications, cacheFilters, 60);
        
        return notifications;
      },
      { filterCount: Object.keys(filter).length, limit, offset }
    );
  }

  /**
   * Encontra notificações pendentes para envio
   */
  async findPendingNotifications(limit?: number): Promise<Notification[]> {
    return this.monitor.measure(
      'findPendingNotifications',
      async () => {
        // Para notificações pendentes, sempre buscamos diretamente do banco
        // pois precisamos de dados sempre atualizados
        return this.baseRepository.findPendingNotifications(limit);
      },
      { limit }
    );
  }

  /**
   * Encontra notificações por agendamento
   */
  async findBySchedulingId(schedulingId: string): Promise<Notification[]> {
    return this.monitor.measure(
      'findBySchedulingId',
      async () => {
        // Criar filtro para usar como chave de cache
        const cacheFilters = { schedulingId };
        
        // Verificar se a lista está no cache
        const cachedList = await this.cache.getNotificationList(cacheFilters);
        if (cachedList) {
          logger.debug('Lista de notificações por agendamento recuperada do cache', { schedulingId });
          return cachedList;
        }

        // Se não estiver no cache, buscar do repositório base
        const notifications = await this.baseRepository.findBySchedulingId(schedulingId);
        
        // Salvar no cache para futuras consultas
        await this.cache.setNotificationList(notifications, cacheFilters);
        
        return notifications;
      },
      { schedulingId }
    );
  }

  /**
   * Marca uma notificação como enviada
   */
  async markAsSent(id: string, sentAt?: Date): Promise<Notification> {
    return this.monitor.measure(
      'markAsSent',
      async () => {
        const result = await this.baseRepository.markAsSent(id, sentAt);
        // Atualizar cache e invalidar listas
        await this.cache.setNotification(result);
        await this.cache.invalidateAllLists();
        return result;
      },
      { id, sentAt: sentAt?.toISOString() }
    );
  }

  /**
   * Marca uma notificação como entregue
   */
  async markAsDelivered(id: string, deliveredAt?: Date): Promise<Notification> {
    return this.monitor.measure(
      'markAsDelivered',
      async () => {
        const result = await this.baseRepository.markAsDelivered(id, deliveredAt);
        // Atualizar cache e invalidar listas
        await this.cache.setNotification(result);
        await this.cache.invalidateAllLists();
        return result;
      },
      { id, deliveredAt: deliveredAt?.toISOString() }
    );
  }

  /**
   * Marca uma notificação como falha
   */
  async markAsFailed(id: string, reason: string, failedAt?: Date): Promise<Notification> {
    return this.monitor.measure(
      'markAsFailed',
      async () => {
        const result = await this.baseRepository.markAsFailed(id, reason, failedAt);
        // Atualizar cache e invalidar listas
        await this.cache.setNotification(result);
        await this.cache.invalidateAllLists();
        return result;
      },
      { id, reason, failedAt: failedAt?.toISOString() }
    );
  }

  /**
   * Prepara uma notificação para nova tentativa de envio
   */
  async retry(id: string): Promise<Notification> {
    return this.monitor.measure(
      'retry',
      async () => {
        const result = await this.baseRepository.retry(id);
        // Atualizar cache e invalidar listas
        await this.cache.setNotification(result);
        await this.cache.invalidateAllLists();
        return result;
      },
      { id }
    );
  }

  /**
   * Atualiza o conteúdo de uma notificação
   */
  async updateContent(id: string, content: string): Promise<Notification> {
    return this.monitor.measure(
      'updateContent',
      async () => {
        const result = await this.baseRepository.updateContent(id, content);
        // Atualizar cache e invalidar listas
        await this.cache.setNotification(result);
        await this.cache.invalidateAllLists();
        return result;
      },
      { id, contentLength: content.length }
    );
  }

  /**
   * Conta o número total de notificações que correspondem aos filtros
   */
  async count(filter: NotificationFilter): Promise<number> {
    return this.monitor.measure(
      'count',
      async () => {
        // Para contagem, sempre consultamos o banco para garantir precisão
        return this.baseRepository.count(filter);
      },
      { filterCount: Object.keys(filter).length }
    );
  }

  /**
   * Exclui uma notificação pelo ID
   */
  async delete(id: string): Promise<void> {
    return this.monitor.measure(
      'delete',
      async () => {
        await this.baseRepository.delete(id);
        // Invalidar a notificação no cache e todas as listas
        await this.cache.invalidateNotification(id);
        await this.cache.invalidateAllLists();
      },
      { id }
    );
  }
} 