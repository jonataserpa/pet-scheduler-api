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
      // Entidade Customer
      Customer: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '550e8400-e29b-41d4-a716-446655440000',
          },
          name: {
            type: 'string',
            example: 'João Silva',
          },
          documentNumber: {
            type: 'string',
            example: '12345678901',
            description: 'CPF ou CNPJ do cliente',
          },
          address: {
            $ref: '#/components/schemas/Address',
          },
          contact: {
            $ref: '#/components/schemas/Contact',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2023-06-15T10:00:00Z',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2023-06-15T10:00:00Z',
          },
          active: {
            type: 'boolean',
            example: true,
          },
        },
      },
      // Value Object Address
      Address: {
        type: 'object',
        properties: {
          street: {
            type: 'string',
            example: 'Avenida Paulista',
          },
          number: {
            type: 'string',
            example: '1000',
          },
          complement: {
            type: 'string',
            example: 'Apto 123',
            nullable: true,
          },
          neighborhood: {
            type: 'string',
            example: 'Bela Vista',
          },
          city: {
            type: 'string',
            example: 'São Paulo',
          },
          state: {
            type: 'string',
            example: 'SP',
          },
          zipCode: {
            type: 'string',
            example: '01310100',
          },
          formattedZipCode: {
            type: 'string',
            example: '01310-100',
          },
          country: {
            type: 'string',
            example: 'Brasil',
          },
        },
      },
      // Value Object Contact
      Contact: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'joao.silva@email.com',
          },
          phone: {
            type: 'string',
            example: '11987654321',
          },
          whatsapp: {
            type: 'string',
            example: '11987654321',
            nullable: true,
          },
          formattedPhone: {
            type: 'string',
            example: '(11) 98765-4321',
          },
          formattedWhatsapp: {
            type: 'string',
            example: '(11) 98765-4321',
            nullable: true,
          },
        },
      },
      // Entidade Pet
      Pet: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '550e8400-e29b-41d4-a716-446655440000',
          },
          name: {
            type: 'string',
            example: 'Rex',
          },
          species: {
            type: 'string',
            example: 'Cachorro',
          },
          breed: {
            type: 'string',
            example: 'Labrador',
            nullable: true,
          },
          size: {
            type: 'string',
            enum: ['SMALL', 'MEDIUM', 'LARGE', 'EXTRA_LARGE'],
            example: 'MEDIUM',
          },
          birthDate: {
            type: 'string',
            format: 'date',
            example: '2020-01-15',
            nullable: true,
          },
          allergies: {
            type: 'string',
            example: 'Alergia a determinados shampoos',
            nullable: true,
          },
          observations: {
            type: 'string',
            example: 'Pet dócil, mas fica nervoso durante o banho',
            nullable: true,
          },
          customerId: {
            type: 'string',
            format: 'uuid',
            example: '550e8400-e29b-41d4-a716-446655440000',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2023-06-15T10:00:00Z',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2023-06-15T10:00:00Z',
          },
          active: {
            type: 'boolean',
            example: true,
          },
        },
      },
      // Entidade Service (Serviço oferecido)
      Service: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '550e8400-e29b-41d4-a716-446655440000',
          },
          name: {
            type: 'string',
            example: 'Banho e Tosa',
          },
          description: {
            type: 'string',
            example: 'Banho completo com shampoo especial e tosa higiênica',
            nullable: true,
          },
          duration: {
            type: 'integer',
            example: 60,
            description: 'Duração em minutos',
          },
          price: {
            type: 'number',
            format: 'float',
            example: 80.0,
          },
          petSizes: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['SMALL', 'MEDIUM', 'LARGE', 'EXTRA_LARGE'],
            },
            example: ['SMALL', 'MEDIUM'],
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2023-06-15T10:00:00Z',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2023-06-15T10:00:00Z',
          },
          active: {
            type: 'boolean',
            example: true,
            description: 'Indica se o serviço está ativo'
          },
        },
      },
      // Service Request/Response
      CreateServiceRequest: {
        type: 'object',
        required: ['name', 'duration', 'price', 'petSizes'],
        properties: {
          name: {
            type: 'string',
            example: 'Banho e Tosa',
          },
          description: {
            type: 'string',
            example: 'Banho completo com shampoo especial e tosa higiênica',
          },
          duration: {
            type: 'integer',
            example: 60,
            description: 'Duração em minutos',
          },
          price: {
            type: 'number',
            format: 'float',
            example: 80.0,
          },
          petSizes: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['SMALL', 'MEDIUM', 'LARGE', 'EXTRA_LARGE'],
            },
            example: ['SMALL', 'MEDIUM'],
          },
        },
      },
      UpdateServiceRequest: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            example: 'Banho e Tosa Premium',
          },
          description: {
            type: 'string',
            example: 'Banho completo com produtos premium e tosa completa',
          },
          duration: {
            type: 'integer',
            example: 90,
            description: 'Duração em minutos',
          },
          price: {
            type: 'number',
            format: 'float',
            example: 120.0,
          },
          petSizes: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['SMALL', 'MEDIUM', 'LARGE', 'EXTRA_LARGE'],
            },
            example: ['SMALL', 'MEDIUM', 'LARGE'],
          },
        },
      },
      ServiceListResponse: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Service',
            },
          },
          meta: {
            type: 'object',
            properties: {
              total: {
                type: 'integer',
                example: 15,
              },
              limit: {
                type: 'integer',
                example: 10,
              },
              offset: {
                type: 'integer',
                example: 0,
              },
            },
          },
        },
      },
      // Entidade ScheduledService (Serviço agendado)
      ScheduledService: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '550e8400-e29b-41d4-a716-446655440000',
          },
          serviceId: {
            type: 'string',
            format: 'uuid',
            example: '550e8400-e29b-41d4-a716-446655440000',
          },
          serviceName: {
            type: 'string',
            example: 'Banho e Tosa',
          },
          price: {
            type: 'number',
            format: 'float',
            example: 80.0,
          },
          duration: {
            type: 'integer',
            example: 60,
            description: 'Duração em minutos',
          },
        },
      },
      // Value Object TimeSlot
      TimeSlot: {
        type: 'object',
        properties: {
          startTime: {
            type: 'string',
            format: 'date-time',
            example: '2023-06-15T10:00:00Z',
          },
          endTime: {
            type: 'string',
            format: 'date-time',
            example: '2023-06-15T11:00:00Z',
          },
          durationMinutes: {
            type: 'integer',
            example: 60,
          },
        },
      },
      // Entidade Scheduling (Agendamento)
      Scheduling: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '550e8400-e29b-41d4-a716-446655440000',
          },
          timeSlot: {
            $ref: '#/components/schemas/TimeSlot',
          },
          status: {
            type: 'string',
            enum: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
            example: 'SCHEDULED',
          },
          notes: {
            type: 'string',
            example: 'Cliente solicitou atenção especial às orelhas do pet',
            nullable: true,
          },
          customerId: {
            type: 'string',
            format: 'uuid',
            example: '550e8400-e29b-41d4-a716-446655440000',
          },
          petId: {
            type: 'string',
            format: 'uuid',
            example: '550e8400-e29b-41d4-a716-446655440000',
          },
          totalPrice: {
            type: 'number',
            format: 'float',
            example: 150.0,
          },
          services: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/ScheduledService',
            },
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2023-06-15T10:00:00Z',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2023-06-15T10:00:00Z',
          },
        },
      },
      // Entidade Notification (Notificação)
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
          content: {
            type: 'string',
            example: 'Conteúdo da notificação',
          },
          schedulingId: {
            type: 'string',
            format: 'uuid',
            example: '550e8400-e29b-41d4-a716-446655440000',
          },
          sentAt: {
            type: 'string',
            format: 'date-time',
            example: '2023-06-15T10:00:00Z',
          },
        },
      },
      // Notificação SMS
      SMSNotification: {
        type: 'object',
        allOf: [
          {
            $ref: '#/components/schemas/NotificationBase',
          },
          {
            properties: {
              type: {
                type: 'string',
                enum: ['sms'],
                example: 'sms',
              },
              phoneNumber: {
                type: 'string',
                example: '11987654321',
              },
              providerResponse: {
                type: 'object',
                properties: {
                  messageId: {
                    type: 'string',
                    example: 'SM123456',
                  },
                  provider: {
                    type: 'string',
                    example: 'TwilioSMS',
                  },
                },
              },
            },
          },
        ],
      },
      // Notificação WhatsApp
      WhatsAppNotification: {
        type: 'object',
        allOf: [
          {
            $ref: '#/components/schemas/NotificationBase',
          },
          {
            properties: {
              type: {
                type: 'string',
                enum: ['whatsapp'],
                example: 'whatsapp',
              },
              phoneNumber: {
                type: 'string',
                example: '11987654321',
              },
              template: {
                type: 'string',
                example: 'appointment_reminder',
              },
              providerResponse: {
                type: 'object',
                properties: {
                  messageId: {
                    type: 'string',
                    example: 'wamid.123456789',
                  },
                  provider: {
                    type: 'string',
                    example: 'Meta',
                  },
                  status: {
                    type: 'string',
                    example: 'delivered',
                  },
                },
              },
            },
          },
        ],
      },
      // Requests para envio de notificações 
      SendSMSRequest: {
        type: 'object',
        required: ['phoneNumber', 'content', 'schedulingId'],
        properties: {
          phoneNumber: {
            type: 'string',
            example: '11987654321',
          },
          content: {
            type: 'string',
            example: 'Olá! Lembramos que você tem um agendamento amanhã às 14h.',
          },
          schedulingId: {
            type: 'string',
            format: 'uuid',
            example: '550e8400-e29b-41d4-a716-446655440000',
          },
          templateCode: {
            type: 'string',
            example: 'appointment_reminder',
          },
        },
      },
      SendWhatsAppRequest: {
        type: 'object',
        required: ['phoneNumber', 'templateCode', 'schedulingId'],
        properties: {
          phoneNumber: {
            type: 'string',
            example: '11987654321',
          },
          templateCode: {
            type: 'string',
            example: 'appointment_reminder',
          },
          templateData: {
            type: 'object',
            properties: {
              customerName: {
                type: 'string',
                example: 'João Silva',
              },
              appointmentDate: {
                type: 'string',
                example: '15/06/2023',
              },
              appointmentTime: {
                type: 'string',
                example: '14:00',
              },
            },
          },
          schedulingId: {
            type: 'string',
            format: 'uuid',
            example: '550e8400-e29b-41d4-a716-446655440000',
          },
        },
      },
      // Entidade User (Usuário do sistema)
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '550e8400-e29b-41d4-a716-446655440000',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'usuario@email.com',
          },
          name: {
            type: 'string',
            example: 'Admin Sistema',
          },
          role: {
            type: 'string',
            enum: ['ADMIN', 'EMPLOYEE'],
            example: 'EMPLOYEE',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2023-06-15T10:00:00Z',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2023-06-15T10:00:00Z',
          },
          active: {
            type: 'boolean',
            example: true,
          },
        },
      },
      // User Request/Response
      CreateUserRequest: {
        type: 'object',
        required: ['email', 'password', 'name', 'role'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'usuario@email.com',
          },
          password: {
            type: 'string',
            format: 'password',
            example: 'Senha@123',
            minLength: 8,
          },
          name: {
            type: 'string',
            example: 'José Funcionário',
          },
          role: {
            type: 'string',
            enum: ['ADMIN', 'EMPLOYEE'],
            example: 'EMPLOYEE',
          },
        },
      },
      UpdateUserRequest: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            example: 'José Funcionário da Silva',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'jose.funcionario@email.com',
          },
          role: {
            type: 'string',
            enum: ['ADMIN', 'EMPLOYEE'],
            example: 'ADMIN',
          },
          active: {
            type: 'boolean',
            example: true,
          },
        },
      },
      UserListResponse: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/User',
            },
          },
          meta: {
            type: 'object',
            properties: {
              total: {
                type: 'integer',
                example: 10,
              },
              limit: {
                type: 'integer',
                example: 10,
              },
              offset: {
                type: 'integer',
                example: 0,
              },
            },
          },
        },
      },
      ChangePasswordRequest: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: {
            type: 'string',
            format: 'password',
            example: 'Senha@123',
          },
          newPassword: {
            type: 'string',
            format: 'password',
            example: 'NovaSenha@123',
            minLength: 8,
          },
        },
      },
      // Login Request
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'usuario@email.com',
          },
          password: {
            type: 'string',
            format: 'password',
            example: 'senha123',
          },
        },
      },
      // Login Response
      LoginResponse: {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                format: 'uuid',
                example: '550e8400-e29b-41d4-a716-446655440000',
              },
              email: {
                type: 'string',
                format: 'email',
                example: 'usuario@email.com',
              },
              name: {
                type: 'string',
                example: 'Admin Sistema',
              },
              role: {
                type: 'string',
                enum: ['ADMIN', 'EMPLOYEE'],
                example: 'EMPLOYEE',
              },
            },
          },
          tokens: {
            type: 'object',
            properties: {
              accessToken: {
                type: 'string',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              },
              refreshToken: {
                type: 'string',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              },
            },
          },
        },
      },
      // Refresh Token Request
      RefreshTokenRequest: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      },
      // Registro e reset de senha
      RegisterRequest: {
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'usuario@email.com',
          },
          password: {
            type: 'string',
            format: 'password',
            example: 'Senha@123',
            minLength: 8,
          },
          name: {
            type: 'string',
            example: 'José Silva',
          },
        },
      },
      PasswordResetRequestEmail: {
        type: 'object',
        required: ['email'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'usuario@email.com',
          },
        },
      },
      PasswordResetConfirm: {
        type: 'object',
        required: ['token', 'newPassword'],
        properties: {
          token: {
            type: 'string',
            example: '123456',
          },
          newPassword: {
            type: 'string',
            format: 'password',
            example: 'NovaSenha@123',
            minLength: 8,
          },
        },
      },
      // Dados para notificações
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
      // Login History
      LoginHistory: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '550e8400-e29b-41d4-a716-446655440000',
          },
          userId: {
            type: 'string',
            format: 'uuid',
            example: '550e8400-e29b-41d4-a716-446655440000',
            nullable: true,
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'usuario@email.com',
          },
          status: {
            type: 'string',
            enum: ['SUCCESS', 'FAILED', 'LOCKED', 'PASSWORD_RESET', 'SUSPICIOUS'],
            example: 'SUCCESS',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2023-06-15T10:00:00Z',
          },
          ipAddress: {
            type: 'string',
            example: '192.168.1.1',
          },
          userAgent: {
            type: 'string',
            example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          authMethod: {
            type: 'string',
            enum: ['PASSWORD', 'GOOGLE', 'FACEBOOK', 'GITHUB', 'TOKEN', 'RECOVERY'],
            example: 'PASSWORD',
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Auth',
      description: 'Operações de autenticação e autorização',
    },
    {
      name: 'Clientes',
      description: 'Operações relacionadas a clientes',
    },
    {
      name: 'Pets',
      description: 'Operações relacionadas a pets',
    },
    {
      name: 'Serviços',
      description: 'Operações relacionadas a serviços oferecidos',
    },
    {
      name: 'Agendamentos',
      description: 'Operações relacionadas a agendamentos',
    },
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