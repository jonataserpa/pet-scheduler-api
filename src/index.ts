import 'express-async-errors';
import { startServer } from './server.js';
import { logger } from './shared/utils/logger.js';
import { env } from './shared/config/env.js';

// Inicia o servidor
startServer()
  .then(() => {
    logger.info(`🚀 Servidor iniciado na porta ${env.PORT}`);
    logger.info(`📄 Ambiente: ${env.NODE_ENV}`);
  })
  .catch((error: Error) => {
    logger.error('❌ Erro ao iniciar o servidor:', error);
    process.exit(1);
  });

// Tratamento de exceções não capturadas
process.on('uncaughtException', (error: Error) => {
  logger.error('❌ Exceção não capturada:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('❌ Promessa rejeitada não tratada:', reason);
  process.exit(1);
});

// Tratamento de sinais para encerramento gracioso
process.on('SIGTERM', () => {
  logger.info('🛑 Sinal SIGTERM recebido. Encerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('🛑 Sinal SIGINT recebido. Encerrando servidor...');
  process.exit(0);
}); 