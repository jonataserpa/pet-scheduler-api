import { Notification } from '../../domain/entities/notification.js';
import { logger } from '../../shared/utils/logger.js';

/**
 * Interface para implementações de cache
 */
export interface CacheStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlInSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  flush(): Promise<void>;
}

/**
 * Implementação de cache em memória
 */
export class InMemoryCacheStore implements CacheStore {
  private cache: Map<string, { value: any; expiry: number | null }> = new Map();
  private readonly defaultTtl: number;

  constructor(defaultTtlInSeconds: number = 300) { // 5 minutos por padrão
    this.defaultTtl = defaultTtlInSeconds;
    this.startCleanupInterval();
  }

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    const now = Date.now();
    if (item.expiry !== null && item.expiry < now) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  async set<T>(key: string, value: T, ttlInSeconds: number = this.defaultTtl): Promise<void> {
    const expiry = ttlInSeconds > 0 ? Date.now() + (ttlInSeconds * 1000) : null;
    this.cache.set(key, { value, expiry });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async flush(): Promise<void> {
    this.cache.clear();
  }

  private startCleanupInterval(): void {
    // Limpar itens expirados a cada minuto
    setInterval(() => {
      const now = Date.now();
      for (const [key, item] of this.cache.entries()) {
        if (item.expiry !== null && item.expiry < now) {
          this.cache.delete(key);
        }
      }
    }, 60000);
  }
}

/**
 * Serviço de cache para notificações
 */
export class NotificationCache {
  private readonly cacheKeyPrefix = 'notification:';
  private readonly cacheKeySinglePrefix = 'notification:single:';
  private readonly cacheKeyListPrefix = 'notification:list:';
  private readonly store: CacheStore;

  constructor(store: CacheStore) {
    this.store = store;
  }

  /**
   * Gera uma chave de cache para um ID de notificação
   */
  private getSingleKey(id: string): string {
    return `${this.cacheKeySinglePrefix}${id}`;
  }

  /**
   * Gera uma chave de cache para uma lista com base em filtros
   */
  private getListKey(filters: Record<string, any>): string {
    const filterString = JSON.stringify(filters);
    return `${this.cacheKeyListPrefix}${Buffer.from(filterString).toString('base64')}`;
  }

  /**
   * Busca uma notificação no cache
   */
  async getNotification(id: string): Promise<Notification | null> {
    try {
      const key = this.getSingleKey(id);
      return await this.store.get<Notification>(key);
    } catch (error) {
      logger.warn('Erro ao buscar notificação no cache', { error, id });
      return null;
    }
  }

  /**
   * Armazena uma notificação no cache
   */
  async setNotification(notification: Notification, ttlInSeconds?: number): Promise<void> {
    try {
      const key = this.getSingleKey(notification.id);
      await this.store.set(key, notification, ttlInSeconds);
    } catch (error) {
      logger.warn('Erro ao armazenar notificação no cache', { 
        error, 
        notificationId: notification.id 
      });
    }
  }

  /**
   * Busca uma lista de notificações no cache
   */
  async getNotificationList(filters: Record<string, any>): Promise<Notification[] | null> {
    try {
      const key = this.getListKey(filters);
      return await this.store.get<Notification[]>(key);
    } catch (error) {
      logger.warn('Erro ao buscar lista de notificações no cache', { error, filters });
      return null;
    }
  }

  /**
   * Armazena uma lista de notificações no cache
   */
  async setNotificationList(notifications: Notification[], filters: Record<string, any>, ttlInSeconds?: number): Promise<void> {
    try {
      const key = this.getListKey(filters);
      await this.store.set(key, notifications, ttlInSeconds);
    } catch (error) {
      logger.warn('Erro ao armazenar lista de notificações no cache', { error, filters });
    }
  }

  /**
   * Invalida todas as entradas de cache relacionadas a uma notificação específica
   */
  async invalidateNotification(id: string): Promise<void> {
    try {
      const key = this.getSingleKey(id);
      await this.store.del(key);
      // Não podemos invalidar listas específicas facilmente sem metadata adicional,
      // então vamos confiar no TTL para expirar as listas eventualmente
    } catch (error) {
      logger.warn('Erro ao invalidar notificação no cache', { error, id });
    }
  }

  /**
   * Invalida todas as entradas de cache de listas
   */
  async invalidateAllLists(): Promise<void> {
    try {
      // Em uma implementação real com Redis, poderíamos usar pattern matching para remover todas as chaves
      // que começam com o prefixo de lista. No nosso caso, vamos simplesmente limpar todo o cache.
      await this.store.flush();
    } catch (error) {
      logger.warn('Erro ao invalidar todas as listas no cache', { error });
    }
  }
} 