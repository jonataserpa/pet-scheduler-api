import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import passport from 'passport';
import { env } from './shared/config/env.js';
import { logger } from './shared/utils/logger.js';
import { connectDatabase, prismaClient } from './infrastructure/database/prisma-client.js';
import { globalRateLimiter } from './presentation/middlewares/rate-limit-middleware.js';
import { TokenService } from './domain/services/auth/token-service.js';
import { TokenBlacklistService } from './domain/services/auth/token-blacklist-service.js';
import { AuthService } from './domain/services/auth/auth-service.js';
import { PasswordResetService } from './domain/services/auth/password-reset-service.js';
import { AuthMiddleware } from './presentation/middlewares/auth-middleware.js';
import { AuthController } from './presentation/controllers/auth-controller.js';
import { setupAuthRoutes } from './presentation/routes/auth-routes.js';
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user-repository.js';
import { PrismaLoginHistoryRepository } from './infrastructure/repositories/prisma-login-history-repository.js';
import { EmailService } from './infrastructure/services/email-service.js';
import { setupPassportStrategies } from './infrastructure/auth/passport-strategies.js';

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

// Configura express-session
app.use(
  session({
    secret: env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
    }
  })
);

// Inicializa o Passport e configura para usar sessões
app.use(passport.initialize());
app.use(passport.session());

// Adiciona middleware de rate limiting global
app.use(globalRateLimiter);

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

// Configuração das rotas e serviços
async function setupRoutes(): Promise<void> {
  // Configuração dos serviços de autenticação
  const redisUrl = `redis://${env.REDIS_HOST}:${env.REDIS_PORT}`;
  
  // Serviço de tokens
  const tokenService = new TokenService(
    env.JWT_SECRET,
    env.JWT_REFRESH_SECRET,
    env.JWT_EXPIRES_IN,
    env.JWT_REFRESH_EXPIRES_IN
  );
  
  // Serviço de blacklist de tokens
  const tokenBlacklistService = new TokenBlacklistService(redisUrl);
  await tokenBlacklistService.connect();
  
  // Repositórios
  const userRepository = new PrismaUserRepository(prismaClient);
  const loginHistoryRepository = new PrismaLoginHistoryRepository(prismaClient);
  
  // Serviço de autenticação
  const authService = new AuthService(
    userRepository, 
    tokenService, 
    tokenBlacklistService,
    loginHistoryRepository
  );
  
  // Serviço de recuperação de senha
  const passwordResetService = new PasswordResetService(redisUrl, userRepository);
  await passwordResetService.connect();
  
  // Serviço de email
  const emailService = new EmailService();
  
  // Configura as estratégias do Passport
  setupPassportStrategies(userRepository);
  
  // Middleware de autenticação
  const authMiddleware = new AuthMiddleware(authService, tokenService);
  
  // Controlador de autenticação
  const authController = new AuthController(
    authService,
    tokenService,
    passwordResetService,
    emailService,
    loginHistoryRepository
  );
  
  // Configuração das rotas de autenticação
  const authRouter = express.Router();
  setupAuthRoutes(authRouter, authController, authMiddleware);
  app.use('/api/auth', authRouter);
  
  // Outras rotas serão adicionadas aqui
}

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
    
    // Configura as rotas e serviços
    await setupRoutes();

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