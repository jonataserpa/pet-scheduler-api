import { logger } from '../../shared/utils/logger.js';

/**
 * Interface para métrica de performance
 */
export interface PerformanceMetric {
  /**
   * Nome da operação
   */
  operation: string;
  
  /**
   * Tipo de entidade
   */
  entityType: string;
  
  /**
   * Timestamp de início da operação
   */
  startTime: number;
  
  /**
   * Duração da operação em ms
   */
  duration: number;
  
  /**
   * Flag indicando se a operação foi bem-sucedida
   */
  success: boolean;
  
  /**
   * Metadados adicionais
   */
  metadata?: Record<string, any>;
}

/**
 * Tipo para o manipulador de métricas
 */
export type MetricHandler = (metric: PerformanceMetric) => void;

/**
 * Monitor de performance para operações de repositório
 */
export class PerformanceMonitor {
  private readonly handlers: MetricHandler[] = [];
  private readonly defaultEntityType: string;
  private enabled: boolean = true;

  constructor(
    defaultEntityType: string,
    handlers: MetricHandler[] = [PerformanceMonitor.defaultLogHandler]
  ) {
    this.defaultEntityType = defaultEntityType;
    this.handlers = handlers;
  }

  /**
   * Manipulador padrão que registra métricas no logger
   */
  static defaultLogHandler(metric: PerformanceMetric): void {
    const metadata = {
      operation: metric.operation,
      entityType: metric.entityType,
      durationMs: metric.duration,
      success: metric.success,
      ...metric.metadata,
    };

    if (metric.success) {
      // Usar log level diferente dependendo da duração
      if (metric.duration > 500) {
        logger.warn(`Operação lenta em ${metric.entityType}: ${metric.operation}`, metadata);
      } else {
        logger.debug(`Operação em ${metric.entityType}: ${metric.operation}`, metadata);
      }
    } else {
      logger.error(`Falha em operação em ${metric.entityType}: ${metric.operation}`, metadata);
    }
  }

  /**
   * Adiciona um manipulador de métricas
   */
  addHandler(handler: MetricHandler): void {
    this.handlers.push(handler);
  }

  /**
   * Ativa ou desativa o monitoramento
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Registra uma métrica de performance
   */
  recordMetric(metric: Omit<PerformanceMetric, 'entityType'> & { entityType?: string }): void {
    if (!this.enabled) return;

    const fullMetric: PerformanceMetric = {
      ...metric,
      entityType: metric.entityType || this.defaultEntityType,
    };

    for (const handler of this.handlers) {
      try {
        handler(fullMetric);
      } catch (error) {
        logger.error('Erro ao processar métrica de performance', { error, metric: fullMetric });
      }
    }
  }

  /**
   * Mede o tempo de execução de uma função
   */
  async measure<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    if (!this.enabled) {
      return fn();
    }

    const startTime = Date.now();
    let success = false;

    try {
      const result = await fn();
      success = true;
      return result;
    } finally {
      const endTime = Date.now();
      const duration = endTime - startTime;

      this.recordMetric({
        operation,
        startTime,
        duration,
        success,
        metadata,
      });
    }
  }
} 