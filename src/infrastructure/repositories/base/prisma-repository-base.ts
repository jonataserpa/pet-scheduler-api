import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../../../shared/utils/logger.js';
import { PrismaTransaction } from '../../database/prisma-transaction.js';

/**
 * Classe base para repositórios Prisma
 */
export abstract class PrismaRepositoryBase {
  protected readonly prisma: PrismaClient;
  protected readonly prismaTransaction: PrismaTransaction;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.prismaTransaction = new PrismaTransaction(prisma);
  }

  /**
   * Executa uma operação dentro de uma transação
   * @param operation Função que recebe um cliente de transação e retorna uma Promise
   * @returns Resultado da operação
   */
  protected async executeInTransaction<T>(
    operation: (prisma: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    return this.prismaTransaction.execute(operation);
  }

  /**
   * Executa várias operações de forma atômica dentro de uma transação
   * @param operations Lista de operações para executar na transação
   * @returns Array com os resultados de cada operação
   */
  protected async executeMultipleInTransaction<T extends unknown[]>(
    operations: ((prisma: Prisma.TransactionClient) => Promise<any>)[]
  ): Promise<T> {
    return this.prismaTransaction.executeMultiple(operations);
  }

  /**
   * Loga e propaga um erro
   * @param error Erro ocorrido
   * @param context Contexto do erro (geralmente o nome do método)
   * @param metadata Metadados adicionais para o log
   */
  protected handleError(error: unknown, context: string, metadata: Record<string, unknown> = {}): never {
    logger.error(`Erro em ${this.constructor.name}.${context}:`, {
      error,
      ...metadata,
    });
    throw error;
  }
} 