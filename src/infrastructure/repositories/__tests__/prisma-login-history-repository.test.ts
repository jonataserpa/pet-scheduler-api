import { PrismaClient } from '@prisma/client';
import { PrismaLoginHistoryRepository } from '../prisma-login-history-repository.js';
import { LoginHistory } from '../../../domain/entities/login-history.js';
import { v4 as uuidv4 } from 'uuid';

// Mock do PrismaClient
const mockPrismaClient = {
  loginHistory: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
  },
} as unknown as PrismaClient;

describe('PrismaLoginHistoryRepository', () => {
  let repository: PrismaLoginHistoryRepository;
  
  beforeEach(() => {
    jest.clearAllMocks();
    repository = new PrismaLoginHistoryRepository(mockPrismaClient);
  });

  describe('save', () => {
    it('deve salvar um histórico de login com sucesso', async () => {
      // Arrange
      const id = uuidv4();
      const userId = uuidv4();
      const timestamp = new Date();
      
      const loginHistory = LoginHistory.createSuccessLogin(
        id,
        userId,
        'user@example.com',
        '192.168.1.1',
        'Mozilla/5.0',
        'password',
        { country: 'Brazil' },
        { deviceId: '123456' }
      );

      mockPrismaClient.loginHistory.create.mockResolvedValueOnce({
        id,
        userId,
        email: 'user@example.com',
        timestamp,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        status: 'SUCCESS',
        authMethod: 'PASSWORD',
      });

      // Act
      await repository.save(loginHistory);

      // Assert
      expect(mockPrismaClient.loginHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: loginHistory.id,
          userId: loginHistory.userId,
          email: loginHistory.email,
          ipAddress: loginHistory.ipAddress,
          userAgent: loginHistory.userAgent,
          status: 'SUCCESS',
          authMethod: 'PASSWORD',
        }),
      });
    });
  });

  describe('findAll', () => {
    it('deve retornar históricos de login de acordo com os filtros', async () => {
      // Arrange
      const mockLoginHistories = [
        {
          id: uuidv4(),
          userId: uuidv4(),
          email: 'user@example.com',
          status: 'SUCCESS',
          timestamp: new Date(),
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          authMethod: 'PASSWORD',
          details: null,
          location: null,
        },
        {
          id: uuidv4(),
          userId: uuidv4(),
          email: 'user@example.com',
          status: 'FAILED',
          timestamp: new Date(),
          ipAddress: '192.168.1.2',
          userAgent: 'Mozilla/5.0',
          authMethod: 'PASSWORD',
          details: null,
          location: null,
        },
      ];

      mockPrismaClient.loginHistory.findMany.mockResolvedValueOnce(mockLoginHistories);

      // Act
      const result = await repository.findAll({ email: 'user@example.com' }, 10, 0);

      // Assert
      expect(mockPrismaClient.loginHistory.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          email: { equals: 'user@example.com' },
        }),
        take: 10,
        skip: 0,
        orderBy: {
          timestamp: 'desc',
        },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(LoginHistory);
      expect(result[1]).toBeInstanceOf(LoginHistory);
    });
  });

  describe('findById', () => {
    it('deve retornar um histórico de login por ID', async () => {
      // Arrange
      const id = uuidv4();
      const mockLoginHistory = {
        id,
        userId: uuidv4(),
        email: 'user@example.com',
        status: 'SUCCESS',
        timestamp: new Date(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        authMethod: 'PASSWORD',
        details: null,
        location: null,
      };

      mockPrismaClient.loginHistory.findUnique.mockResolvedValueOnce(mockLoginHistory);

      // Act
      const result = await repository.findById(id);

      // Assert
      expect(mockPrismaClient.loginHistory.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
      expect(result).toBeInstanceOf(LoginHistory);
      expect(result?.id).toBe(id);
    });

    it('deve retornar null quando o histórico não existe', async () => {
      // Arrange
      const id = uuidv4();
      mockPrismaClient.loginHistory.findUnique.mockResolvedValueOnce(null);

      // Act
      const result = await repository.findById(id);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('countFailedAttempts', () => {
    it('deve contar tentativas falhas corretamente', async () => {
      // Arrange
      const email = 'user@example.com';
      const timeWindowMinutes = 30;
      mockPrismaClient.loginHistory.count.mockResolvedValueOnce(3);

      // Act
      const result = await repository.countFailedAttempts(email, timeWindowMinutes);

      // Assert
      expect(mockPrismaClient.loginHistory.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          email,
          status: 'FAILED',
          timestamp: expect.objectContaining({
            gte: expect.any(Date),
          }),
        }),
      });
      expect(result).toBe(3);
    });
  });

  describe('isSuspiciousIpActivity', () => {
    it('deve identificar atividade suspeita quando o número de falhas excede o limite', async () => {
      // Arrange
      const ipAddress = '192.168.1.1';
      const timeWindowMinutes = 30;
      const threshold = 5;
      mockPrismaClient.loginHistory.count.mockResolvedValueOnce(7);

      // Act
      const result = await repository.isSuspiciousIpActivity(ipAddress, timeWindowMinutes, threshold);

      // Assert
      expect(mockPrismaClient.loginHistory.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          ipAddress,
          status: 'FAILED',
          timestamp: expect.objectContaining({
            gte: expect.any(Date),
          }),
        }),
      });
      expect(result).toBe(true);
    });

    it('não deve identificar atividade suspeita quando o número de falhas é menor que o limite', async () => {
      // Arrange
      const ipAddress = '192.168.1.1';
      const timeWindowMinutes = 30;
      const threshold = 5;
      mockPrismaClient.loginHistory.count.mockResolvedValueOnce(3);

      // Act
      const result = await repository.isSuspiciousIpActivity(ipAddress, timeWindowMinutes, threshold);

      // Assert
      expect(result).toBe(false);
    });
  });
}); 