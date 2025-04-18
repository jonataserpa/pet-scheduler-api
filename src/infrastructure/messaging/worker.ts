import { createClient } from 'redis';
import { env } from '../../shared/config/env.js';
import { logger } from '../../shared/utils/logger.js';
import { prismaClient, connectDatabase } from '../database/prisma-client.js';

// Inicializa conexões
const redisClient = createClient({
  url: `redis://${env.REDIS_PASSWORD ? `${env.REDIS_PASSWORD}@` : ''}${env.REDIS_HOST}:${env.REDIS_PORT}`,
});

// Define as filas de trabalho
const NOTIFICATION_QUEUE = 'notifications';
const REMINDER_QUEUE = 'reminders';

// Conexão com Redis
async function connectRedis(): Promise<void> {
  try {
    redisClient.on('error', (err) => logger.error('Redis client error', err));
    await redisClient.connect();
    logger.info('✅ Conexão com Redis estabelecida');
  } catch (error) {
    logger.error('❌ Falha ao conectar com Redis:', error);
    throw error;
  }
}

// Processador de notificações
async function processNotifications(): Promise<void> {
  try {
    logger.info('👂 Escutando fila de notificações...');
    
    while (true) {
      const data = await redisClient.blPop(NOTIFICATION_QUEUE, 0);
      
      if (data) {
        const notification = JSON.parse(data.element);
        logger.info(`📨 Processando notificação ID: ${notification.id}`);
        
        // Aqui seria implementada a lógica de envio da notificação
        // Exemplo: enviar e-mail, SMS, WhatsApp, etc.
        
        // Atualizar o status da notificação no banco de dados
        await prismaClient.notification.update({
          where: { id: notification.id },
          data: { status: 'SENT' },
        });
        
        logger.info(`✅ Notificação ID: ${notification.id} processada com sucesso`);
      }
    }
  } catch (error) {
    logger.error('❌ Erro ao processar notificação:', error);
    // Reconectar em caso de erro
    await connectRedis();
    await processNotifications();
  }
}

// Processador de lembretes
async function processReminders(): Promise<void> {
  try {
    logger.info('👂 Escutando fila de lembretes...');
    
    while (true) {
      const data = await redisClient.blPop(REMINDER_QUEUE, 0);
      
      if (data) {
        const reminder = JSON.parse(data.element);
        logger.info(`⏰ Processando lembrete para agendamento ID: ${reminder.schedulingId}`);
        
        // Buscar dados do agendamento
        const scheduling = await prismaClient.scheduling.findUnique({
          where: { id: reminder.schedulingId },
          include: {
            customer: true,
            pet: true,
          },
        });
        
        if (scheduling) {
          // Criar notificação de lembrete
          await prismaClient.notification.create({
            data: {
              type: reminder.type,
              content: `Lembrete: Seu agendamento para ${scheduling.pet.name} está marcado para ${scheduling.startTime.toLocaleString()}`,
              schedulingId: scheduling.id,
              status: 'PENDING',
            },
          });
          
          logger.info(`✅ Lembrete para agendamento ID: ${reminder.schedulingId} criado com sucesso`);
        }
      }
    }
  } catch (error) {
    logger.error('❌ Erro ao processar lembrete:', error);
    // Reconectar em caso de erro
    await connectRedis();
    await processReminders();
  }
}

// Inicialização do worker
async function startWorker(): Promise<void> {
  try {
    logger.info('🚀 Iniciando worker...');
    
    // Conectar ao banco de dados e Redis
    await connectDatabase();
    
    await connectRedis();
    
    // Iniciar processadores em paralelo
    processNotifications().catch(error => {
      logger.error('❌ Erro no processador de notificações:', error);
    });
    
    processReminders().catch(error => {
      logger.error('❌ Erro no processador de lembretes:', error);
    });
    
    logger.info('✅ Worker iniciado com sucesso');
  } catch (error) {
    logger.error('❌ Falha ao iniciar worker:', error);
    process.exit(1);
  }
}

// Tratamento de exceções não capturadas
process.on('uncaughtException', (error: Error) => {
  logger.error('❌ Exceção não capturada no worker:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('❌ Promessa rejeitada não tratada no worker:', reason);
  process.exit(1);
});

// Iniciar worker
startWorker(); 