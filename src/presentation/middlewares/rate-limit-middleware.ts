import rateLimit from 'express-rate-limit';
import { env } from '../../shared/config/env.js';
import { logger } from '../../shared/utils/logger.js';

/**
 * Middleware de rate limiting para proteção contra ataques de força bruta
 */
export const createRateLimiter = (
  windowMs: number = 15 * 60 * 1000, // Janela de tempo (15 minutos por padrão)
  max: number = 100, // Máximo de requisições por IP nessa janela
  message: string = 'Muitas requisições deste IP, tente novamente mais tarde',
) => {
  return rateLimit({
    windowMs,
    max,
    message: { message },
    standardHeaders: true, // Inclui headers 'RateLimit-*' nas respostas
    legacyHeaders: false, // Desabilita os headers antigos 'X-RateLimit-*'
    handler: (req, res, _next, options) => {
      logger.warn(`Rate limit excedido para IP: ${req.ip}`, {
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      res.status(options.statusCode).json(options.message);
    },
    // Skip para ambientes de desenvolvimento ou testes
    skip: () => env.NODE_ENV === 'development' || env.NODE_ENV === 'test',
  });
};

/**
 * Rate limiter específico para tentativas de login (mais restritivo)
 */
export const loginRateLimiter = createRateLimiter(
  10 * 60 * 1000, // 10 minutos
  5, // 5 requisições
  'Muitas tentativas de login. Tente novamente após 10 minutos ou use a recuperação de senha.',
);

/**
 * Rate limiter para recuperação de senha
 */
export const passwordResetRateLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hora
  3, // 3 requisições
  'Muitas tentativas de recuperação de senha. Tente novamente após 1 hora.',
);

/**
 * Rate limiter global para todas as rotas da API
 */
export const globalRateLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutos
  100, // 100 requisições
  'Limite de requisições excedido. Tente novamente mais tarde.',
); 