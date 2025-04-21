import swaggerJSDoc from 'swagger-jsdoc';
import { env } from './env.js';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Pet Scheduler API',
    version: '1.0.0',
    description: 'API para agendamento de serviços para pets',
    license: {
      name: 'Licenciado sob MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
    contact: {
      name: 'Suporte',
      url: 'https://petscheduler.com',
      email: 'suporte@petscheduler.com',
    },
  },
  servers: [
    {
      url: env.API_URL,
      description: 'Servidor principal',
    },
    {
      url: 'http://localhost:3000',
      description: 'Servidor de desenvolvimento',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      // Definição de esquemas compartilhados
      Error: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            example: 'error',
          },
          message: {
            type: 'string',
            example: 'Mensagem de erro',
          },
        },
      },
      NotificationBase: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '550e8400-e29b-41d4-a716-446655440000',
          },
          type: {
            type: 'string',
            enum: ['email', 'sms', 'whatsapp'],
            example: 'email',
          },
          status: {
            type: 'string',
            enum: ['pending', 'sent', 'delivered', 'failed'],
            example: 'pending',
          },
        },
      },
      SchedulingData: {
        type: 'object',
        properties: {
          customerName: {
            type: 'string',
            example: 'João Silva',
          },
          petName: {
            type: 'string',
            example: 'Rex',
          },
          serviceName: {
            type: 'string',
            example: 'Banho e Tosa',
          },
          dateTime: {
            type: 'string',
            format: 'date-time',
            example: '2024-12-15T10:00:00Z',
          },
          address: {
            type: 'string',
            example: 'Av. Principal, 123',
          },
          price: {
            type: 'string',
            example: 'R$ 50,00',
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Notificações',
      description: 'Operações relacionadas a notificações',
    },
    {
      name: 'Notificações por Email',
      description: 'Operações específicas para notificações por email',
    },
    {
      name: 'Notificações por SMS',
      description: 'Operações específicas para notificações por SMS',
    },
    {
      name: 'Notificações por WhatsApp',
      description: 'Operações específicas para notificações por WhatsApp',
    },
    {
      name: 'Notificações de Cliente',
      description: 'Operações relacionadas a notificações de clientes',
    },
  ],
};

const options = {
  swaggerDefinition,
  // Caminhos para os arquivos com anotações JSDoc
  apis: [
    './src/presentation/routes/*.ts',
    './src/presentation/controllers/*.ts',
    './src/domain/entities/*.ts',
  ],
};

export const swaggerSpec = swaggerJSDoc(options); 