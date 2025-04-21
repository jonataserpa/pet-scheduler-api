import { PrismaClient } from '@prisma/client';
import { NotificationType, NotificationStatus } from '../../../domain/entities/notification.js';
import { Notification } from '../../../domain/entities/notification.js';
import { PrismaNotificationRepositoryCached } from '../prisma-notification-repository-cached.js';
import { PrismaNotificationRepositoryRefactored } from '../prisma-notification-repository-refactored.js';
import { NotificationCache } from '../../cache/notification-cache.js';
import { PerformanceMonitor } from '../../monitoring/performance-monitor.js';
import { v4 as uuidv4 } from 'uuid';

// Mock do cliente Prisma
const mockPrismaClient = {
  notification: {
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(mockPrismaClient)),
} as unknown as PrismaClient;

// Mocks para o NotificationCache
const mockCache = {
  getNotification: jest.fn(),
  setNotification: jest.fn(),
  getNotificationList: jest.fn(),
  setNotificationList: jest.fn(),
  invalidateNotification: jest.fn(),
  invalidateAllLists: jest.fn(),
} as unknown as NotificationCache;

// Mock para o PerformanceMonitor
const mockMonitor = {
  measure: jest.fn((operation, fn) => fn()),
  recordMetric: jest.fn(),
} as unknown as PerformanceMonitor;

// Mock para o repositório base
jest.mock('../prisma-notification-repository-refactored.js');

// Mock para o logger
jest.mock('../../../shared/utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('PrismaNotificationRepositoryCached', () => {
  let repository: PrismaNotificationRepositoryCached;
  let mockBaseRepository: jest.Mocked<PrismaNotificationRepositoryRefactored>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configurar mock do repositório base
    mockBaseRepository = new PrismaNotificationRepositoryRefactored(mockPrismaClient) as jest.Mocked<PrismaNotificationRepositoryRefactored>;
    (PrismaNotificationRepositoryRefactored as jest.Mock).mockImplementation(() => mockBaseRepository);
    
    repository = new PrismaNotificationRepositoryCached(
      mockPrismaClient,
      mockCache,
      mockMonitor
    );
  });

  describe('findById', () => {
    it('deve retornar notificação do cache quando disponível', async () => {
      // Arrange
      const id = uuidv4();
      const mockNotification = Notification.create(
        id, 
        NotificationType.EMAIL, 
        'Teste de notificação', 
        uuidv4(), 
        NotificationStatus.PENDING, 
        new Date()
      );
      
      mockCache.getNotification.mockResolvedValue(mockNotification);
      
      // Act
      const result = await repository.findById(id);
      
      // Assert
      expect(mockCache.getNotification).toHaveBeenCalledWith(id);
      expect(mockBaseRepository.findById).not.toHaveBeenCalled();
      expect(result).toBe(mockNotification);
      expect(mockMonitor.measure).toHaveBeenCalledWith(
        'findById',
        expect.any(Function),
        { id }
      );
    });

    it('deve buscar do repositório base e atualizar cache quando não estiver em cache', async () => {
      // Arrange
      const id = uuidv4();
      const mockNotification = Notification.create(
        id, 
        NotificationType.EMAIL, 
        'Teste de notificação', 
        uuidv4(), 
        NotificationStatus.PENDING, 
        new Date()
      );
      
      mockCache.getNotification.mockResolvedValue(null);
      mockBaseRepository.findById.mockResolvedValue(mockNotification);
      
      // Act
      const result = await repository.findById(id);
      
      // Assert
      expect(mockCache.getNotification).toHaveBeenCalledWith(id);
      expect(mockBaseRepository.findById).toHaveBeenCalledWith(id);
      expect(mockCache.setNotification).toHaveBeenCalledWith(mockNotification);
      expect(result).toBe(mockNotification);
    });
  });

  describe('create', () => {
    it('deve criar notificação e atualizar cache', async () => {
      // Arrange
      const id = uuidv4();
      const type = NotificationType.EMAIL;
      const content = 'Teste de notificação';
      const schedulingId = uuidv4();
      
      const mockNotification = Notification.create(
        id, type, content, schedulingId, NotificationStatus.PENDING, new Date()
      );
      
      mockBaseRepository.create.mockResolvedValue(mockNotification);
      
      // Act
      const result = await repository.create(id, type, content, schedulingId);
      
      // Assert
      expect(mockBaseRepository.create).toHaveBeenCalledWith(
        id, type, content, schedulingId, NotificationStatus.PENDING
      );
      expect(mockCache.setNotification).toHaveBeenCalledWith(mockNotification);
      expect(mockCache.invalidateAllLists).toHaveBeenCalled();
      expect(result).toBe(mockNotification);
      expect(mockMonitor.measure).toHaveBeenCalledWith(
        'create',
        expect.any(Function),
        { id, type, schedulingId }
      );
    });
  });

  describe('findAll', () => {
    it('deve retornar lista do cache quando disponível', async () => {
      // Arrange
      const filter = { status: NotificationStatus.PENDING };
      const limit = 10;
      const offset = 0;
      
      const mockNotifications = [
        Notification.create(
          uuidv4(), NotificationType.EMAIL, 'Teste 1', uuidv4(), NotificationStatus.PENDING, new Date()
        ),
        Notification.create(
          uuidv4(), NotificationType.EMAIL, 'Teste 2', uuidv4(), NotificationStatus.PENDING, new Date()
        )
      ];
      
      mockCache.getNotificationList.mockResolvedValue(mockNotifications);
      
      // Act
      const result = await repository.findAll(filter, limit, offset);
      
      // Assert
      expect(mockCache.getNotificationList).toHaveBeenCalledWith({
        ...filter,
        limit,
        offset
      });
      expect(mockBaseRepository.findAll).not.toHaveBeenCalled();
      expect(result).toBe(mockNotifications);
    });

    it('deve buscar do repositório base e atualizar cache quando não estiver em cache', async () => {
      // Arrange
      const filter = { status: NotificationStatus.PENDING };
      const limit = 10;
      const offset = 0;
      
      const mockNotifications = [
        Notification.create(
          uuidv4(), NotificationType.EMAIL, 'Teste 1', uuidv4(), NotificationStatus.PENDING, new Date()
        ),
        Notification.create(
          uuidv4(), NotificationType.EMAIL, 'Teste 2', uuidv4(), NotificationStatus.PENDING, new Date()
        )
      ];
      
      mockCache.getNotificationList.mockResolvedValue(null);
      mockBaseRepository.findAll.mockResolvedValue(mockNotifications);
      
      // Act
      const result = await repository.findAll(filter, limit, offset);
      
      // Assert
      expect(mockCache.getNotificationList).toHaveBeenCalledWith({
        ...filter,
        limit,
        offset
      });
      expect(mockBaseRepository.findAll).toHaveBeenCalledWith(filter, limit, offset);
      expect(mockCache.setNotificationList).toHaveBeenCalledWith(
        mockNotifications,
        {
          ...filter,
          limit,
          offset
        },
        60 // TTL para listas
      );
      expect(result).toBe(mockNotifications);
    });
  });

  describe('operações de mudança de status', () => {
    it('deve atualizar o cache após marcar como enviada', async () => {
      // Arrange
      const id = uuidv4();
      const sentAt = new Date();
      
      const mockNotification = Notification.create(
        id, NotificationType.EMAIL, 'Teste', uuidv4(), NotificationStatus.SENT, sentAt
      );
      
      mockBaseRepository.markAsSent.mockResolvedValue(mockNotification);
      
      // Act
      const result = await repository.markAsSent(id, sentAt);
      
      // Assert
      expect(mockBaseRepository.markAsSent).toHaveBeenCalledWith(id, sentAt);
      expect(mockCache.setNotification).toHaveBeenCalledWith(mockNotification);
      expect(mockCache.invalidateAllLists).toHaveBeenCalled();
      expect(result).toBe(mockNotification);
    });
  });

  describe('delete', () => {
    it('deve excluir a notificação e limpar o cache', async () => {
      // Arrange
      const id = uuidv4();
      
      // Act
      await repository.delete(id);
      
      // Assert
      expect(mockBaseRepository.delete).toHaveBeenCalledWith(id);
      expect(mockCache.invalidateNotification).toHaveBeenCalledWith(id);
      expect(mockCache.invalidateAllLists).toHaveBeenCalled();
      expect(mockMonitor.measure).toHaveBeenCalledWith(
        'delete',
        expect.any(Function),
        { id }
      );
    });
  });

  describe('findPendingNotifications', () => {
    it('deve sempre buscar do repositório base (não usar cache)', async () => {
      // Arrange
      const limit = 5;
      
      const mockNotifications = [
        Notification.create(
          uuidv4(), NotificationType.EMAIL, 'Teste 1', uuidv4(), NotificationStatus.PENDING, new Date()
        )
      ];
      
      mockBaseRepository.findPendingNotifications.mockResolvedValue(mockNotifications);
      
      // Act
      const result = await repository.findPendingNotifications(limit);
      
      // Assert
      expect(mockBaseRepository.findPendingNotifications).toHaveBeenCalledWith(limit);
      expect(mockCache.getNotificationList).not.toHaveBeenCalled();
      expect(result).toBe(mockNotifications);
    });
  });
}); 