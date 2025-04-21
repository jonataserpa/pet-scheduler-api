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
import { setupNotificationRoutes } from './presentation/routes/notification-routes.js';
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user-repository.js';
import { PrismaLoginHistoryRepository } from './infrastructure/repositories/prisma-login-history-repository.js';
import { PrismaNotificationRepositoryCached } from './infrastructure/repositories/prisma-notification-repository-cached.js';
import { NotificationCache } from './infrastructure/cache/notification-cache.js';
import { InMemoryCacheStore } from './infrastructure/cache/notification-cache.js';
import { PerformanceMonitor } from './infrastructure/monitoring/performance-monitor.js';
import { EmailService } from './infrastructure/services/email-service.js';
import { setupPassportStrategies } from './infrastructure/auth/passport-strategies.js';
import { EmailNotificationProvider } from './infrastructure/services/email-notification-provider.js';
import { NotificationService } from './domain/services/notification/notification-service.js';
import { NotificationController } from './presentation/controllers/notification-controller.js';
import { EmailNotificationController } from './presentation/controllers/email-notification-controller.js';
import { SmsNotificationController } from './presentation/controllers/sms-notification-controller.js';
import { WhatsAppNotificationController } from './presentation/controllers/whats-app-notification-controller.js';

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
  
  // Inicializar os serviços de cache e monitoramento
  const cacheStore = new InMemoryCacheStore(300); // TTL padrão de 5 minutos
  const notificationCache = new NotificationCache(cacheStore);
  const notificationMonitor = new PerformanceMonitor('Notification');
  
  // Repositórios
  const userRepository = new PrismaUserRepository(prismaClient);
  const loginHistoryRepository = new PrismaLoginHistoryRepository(prismaClient);
  const notificationRepository = new PrismaNotificationRepositoryCached(
    prismaClient,
    notificationCache,
    notificationMonitor
  );
  
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
  
  // Serviço de notificação
  const notificationService = new NotificationService(
    notificationRepository,
    new EmailNotificationProvider({
      host: env.EMAIL_HOST,
      port: parseInt(env.EMAIL_PORT, 10),
      secure: env.EMAIL_SECURE === 'true',
      user: env.EMAIL_USER,
      password: env.EMAIL_PASSWORD,
      fromEmail: env.EMAIL_FROM,
      fromName: env.EMAIL_FROM_NAME,
    })
  );
  
  // Provedores de notificação
  const emailProvider = new EmailNotificationProvider({
    host: env.EMAIL_HOST,
    port: parseInt(env.EMAIL_PORT, 10),
    secure: env.EMAIL_SECURE === 'true',
    user: env.EMAIL_USER,
    password: env.EMAIL_PASSWORD,
    fromEmail: env.EMAIL_FROM,
    fromName: env.EMAIL_FROM_NAME,
  });
  
  // Serviço de notificação principal
  const notificationService = new NotificationService(
    notificationRepository,
    emailProvider
  );
  
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
  
  // Controladores de notificação
  const notificationController = new NotificationController(notificationService);
  const emailNotificationController = new EmailNotificationController(notificationService);
  const smsNotificationController = new SmsNotificationController(notificationService);
  const whatsAppNotificationController = new WhatsAppNotificationController(notificationService);
  
  // Configuração das rotas de autenticação
  const authRouter = express.Router();
  setupAuthRoutes(authRouter, authController, authMiddleware);
  app.use('/api/auth', authRouter);
  
  // Configuração das rotas de notificação
  const notificationRouter = express.Router();
  setupNotificationRoutes(
    notificationRouter, 
    notificationController,
    emailNotificationController,
    smsNotificationController,
    whatsAppNotificationController,
    authMiddleware
  );
  app.use('/api/notifications', notificationRouter);
  
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