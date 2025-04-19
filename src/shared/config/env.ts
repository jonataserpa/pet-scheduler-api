import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Define o esquema de validação das variáveis de ambiente
const envSchema = z.object({
  // Ambiente
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Servidor
  PORT: z.string().transform((val) => parseInt(val, 10)).default('3000'),
  API_URL: z.string().url().default('http://localhost:3000'),
  CORS_ORIGINS: z.string().transform((val) => val.split(',')).default('http://localhost:3000'),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform((val) => parseInt(val, 10)).default('6379'),
  REDIS_PASSWORD: z.string().optional().default(''),

  // JWT
  JWT_SECRET: z.string().min(10),
  JWT_EXPIRES_IN: z.string().default('1d'),
  JWT_REFRESH_SECRET: z.string().min(10),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // Email (para recuperação de senha)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform((val) => parseInt(val, 10)).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_SECURE: z.string().transform((val) => val === 'true').default('false'),
  EMAIL_FROM: z.string().optional(),
  
  // Recuperação de Senha
  PASSWORD_RESET_TOKEN_EXPIRES: z.string().transform((val) => parseInt(val, 10)).default('3600'), // 1 hora em segundos

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform((val) => parseInt(val, 10)).default('900000'), // 15 minutos em ms
  RATE_LIMIT_MAX: z.string().transform((val) => parseInt(val, 10)).default('100'),
  LOGIN_RATE_LIMIT_WINDOW_MS: z.string().transform((val) => parseInt(val, 10)).default('600000'), // 10 minutos em ms 
  LOGIN_RATE_LIMIT_MAX: z.string().transform((val) => parseInt(val, 10)).default('5'),
  
  // Log
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('info'),
  LOG_FILE_PATH: z.string().default('logs/app.log'),

  // OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  OAUTH_CALLBACK_URL: z.string().optional(),
});

// Tenta validar as variáveis de ambiente
const envParse = envSchema.safeParse(process.env);

// Se a validação falhar, lança um erro com as mensagens de erro
if (!envParse.success) {
  console.error('❌ Invalid environment variables:');
  for (const error of envParse.error.errors) {
    console.error(`- ${error.path.join('.')}: ${error.message}`);
  }
  process.exit(1);
}

// Exporta as variáveis de ambiente validadas
export const env = envParse.data; 