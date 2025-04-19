import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './shared/config/env.js';
import { logger } from './shared/utils/logger.js';
import { connectDatabase } from './infrastructure/database/prisma-client.js';

// Cria a instância do aplicativo Express
const app = express();

// Configura middlewares globais
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGINS,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);
app.use(express.json());

// Configuração de logs para requisições HTTP
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  next();
});

// Rota de saúde/verificação
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Middleware global de tratamento de erros
app.use((err: Error & { statusCode?: number }, req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erro interno do servidor';

  logger.error(`Error: ${message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Inicialização do servidor
export async function startServer(): Promise<void> {
  try {
    // Verifica a conexão com o banco de dados
    await connectDatabase();

    // Inicia o servidor
    return new Promise((resolve) => {
      app.listen(env.PORT, () => {
        resolve();
      });
    });
  } catch (error) {
    logger.error('Falha ao iniciar o servidor:', error);
    throw error;
  }
} 