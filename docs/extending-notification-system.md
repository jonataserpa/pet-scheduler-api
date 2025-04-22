# Guia para Estender o Sistema de Notificações

Este documento fornece um guia detalhado sobre como estender o sistema de notificações do Pet Scheduler API para adicionar novos tipos de notificações, provedores e templates.

## Estrutura Geral do Sistema de Notificações

O sistema de notificações do Pet Scheduler API foi projetado seguindo princípios de arquitetura limpa e com foco na extensibilidade. A estrutura é organizada nas seguintes camadas:

1. **Domínio**: Contém as entidades e interfaces principais
2. **Infraestrutura**: Implementações concretas dos repositórios e provedores
3. **Aplicação**: Casos de uso específicos
4. **Apresentação**: Controladores e rotas de API

## Adicionando um Novo Tipo de Notificação

Para adicionar um novo tipo de notificação (por exemplo, "push_notification"), siga estes passos:

### 1. Atualizar a Entidade de Notificação

Em `src/domain/entities/notification.ts`, atualize o enum `NotificationType`:

```typescript
export enum NotificationType {
	EMAIL = "email",
	SMS = "sms",
	WHATSAPP = "whatsapp",
	PUSH_NOTIFICATION = "push_notification", // Novo tipo
}
```

### 2. Atualizar os Mapeadores

Em `src/infrastructure/mappers/notification-mapper.ts`, atualize os métodos de mapeamento:

```typescript
static mapDomainTypeToPrisma(type: NotificationType): PrismaNotificationType {
  switch (type) {
    // ... tipos existentes ...
    case NotificationType.PUSH_NOTIFICATION:
      return PrismaNotificationType.PUSH_NOTIFICATION;
    default:
      throw new Error(`Tipo de notificação inválido: ${type}`);
  }
}

static mapPrismaTypeToDomain(type: PrismaNotificationType): NotificationType {
  switch (type) {
    // ... tipos existentes ...
    case PrismaNotificationType.PUSH_NOTIFICATION:
      return NotificationType.PUSH_NOTIFICATION;
    default:
      throw new Error(`Tipo de notificação inválido: ${type}`);
  }
}
```

### 3. Atualizar o Schema Prisma

No arquivo `prisma/schema.prisma`, atualize o enum `NotificationType`:

```prisma
enum NotificationType {
  EMAIL
  SMS
  WHATSAPP
  PUSH_NOTIFICATION
}
```

Execute a migração do Prisma:

```bash
npx prisma migrate dev --name add_push_notification_type
```

## Implementando um Novo Provedor de Notificação

Para adicionar um novo provedor (por exemplo, para notificações push), siga estes passos:

### 1. Criar a Configuração do Provedor

Crie um novo arquivo em `src/infrastructure/services/providers/push-notification-provider.ts`:

```typescript
import { Notification } from "../../../domain/entities/notification.js";
import { NotificationProvider } from "../../../domain/services/notification/notification-service.js";
import { logger } from "../../../shared/utils/logger.js";

/**
 * Configuração para o provedor de notificação push
 */
export interface PushNotificationProviderConfig {
	/**
	 * URL do serviço de push
	 */
	serviceUrl: string;

	/**
	 * Chave da API
	 */
	apiKey: string;

	/**
	 * ID do projeto
	 */
	projectId: string;
}

/**
 * Implementação do provedor de notificações push
 */
export class PushNotificationProvider implements NotificationProvider {
	constructor(private readonly config: PushNotificationProviderConfig) {}

	/**
	 * Envia uma notificação push
	 */
	async send(notification: Notification): Promise<void> {
		try {
			// Obter dados do dispositivo (tokens) com base no ID do agendamento
			const deviceTokens = await this.getDeviceTokens(notification.schedulingId);

			if (!deviceTokens || deviceTokens.length === 0) {
				logger.warn("Nenhum token de dispositivo encontrado para o agendamento", {
					schedulingId: notification.schedulingId,
				});
				return;
			}

			// Criar payload de notificação
			const payload = {
				notification: {
					title: this.getTitleFromContent(notification.content),
					body: notification.content,
				},
				data: {
					schedulingId: notification.schedulingId,
					notificationId: notification.id,
				},
				tokens: deviceTokens,
			};

			// Enviar a notificação usando a API específica
			// Exemplo: Firebase, OneSignal, etc.
			const response = await fetch(this.config.serviceUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.config.apiKey}`,
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				throw new Error(`Erro ao enviar notificação push: ${response.statusText}`);
			}

			logger.info("Notificação push enviada com sucesso", {
				notificationId: notification.id,
				recipientCount: deviceTokens.length,
			});
		} catch (error) {
			logger.error(`Erro ao enviar notificação push ${notification.id}:`, error);
			throw error;
		}
	}

	/**
	 * Obtém tokens de dispositivo para um agendamento
	 */
	private async getDeviceTokens(schedulingId: string): Promise<string[]> {
		// Implementação real: buscar tokens de dispositivos no banco de dados
		// Aqui estamos simulando para fins de demonstração
		return ["token1", "token2"];
	}

	/**
	 * Extrai título do conteúdo da notificação
	 */
	private getTitleFromContent(content: string): string {
		// Lógica para extrair um título do conteúdo
		// Por exemplo, usar a primeira linha ou até o primeiro ponto
		const firstLine = content.split("\n")[0];
		return firstLine.length > 50 ? `${firstLine.substring(0, 47)}...` : firstLine;
	}
}
```

### 2. Atualizar o Serviço de Notificação

Em `src/domain/services/notification/notification-service.ts`, atualize o construtor para aceitar o novo provedor:

```typescript
constructor(
  private readonly notificationRepository: NotificationRepository,
  private readonly emailProvider?: NotificationProvider,
  private readonly smsProvider?: NotificationProvider,
  private readonly whatsappProvider?: NotificationProvider,
  private readonly pushNotificationProvider?: NotificationProvider
) {
  // Configurar os tipos de notificação disponíveis
  this.typeConfigs = {
    [NotificationType.EMAIL]: {
      provider: emailProvider || this.createDummyProvider(NotificationType.EMAIL),
      templates: this.getEmailTemplates(),
    },
    [NotificationType.SMS]: {
      provider: smsProvider || this.createDummyProvider(NotificationType.SMS),
      templates: this.getSmsTemplates(),
    },
    [NotificationType.WHATSAPP]: {
      provider: whatsappProvider || this.createDummyProvider(NotificationType.WHATSAPP),
      templates: this.getWhatsappTemplates(),
    },
    [NotificationType.PUSH_NOTIFICATION]: {
      provider: pushNotificationProvider || this.createDummyProvider(NotificationType.PUSH_NOTIFICATION),
      templates: this.getPushNotificationTemplates(),
    },
  };
}
```

Adicione um método para templates de notificação push:

```typescript
private getPushNotificationTemplates(): Record<string, (data: Record<string, any>) => string> {
  return {
    'scheduling_confirmation': (data) => `Agendamento confirmado: ${data.serviceName} para ${data.petName} em ${data.dateTime}`,
    'scheduling_reminder': (data) => `Lembrete: ${data.serviceName} para ${data.petName} amanhã às ${data.dateTime}`,
    'scheduling_cancellation': (data) => `Cancelamento: o agendamento para ${data.petName} em ${data.dateTime} foi cancelado`,
    'scheduling_rescheduled': (data) => `Agendamento remarcado: ${data.serviceName} para ${data.petName} agora será em ${data.dateTime}`,
  };
}
```

### 3. Atualizar a Fábrica de Controladores

Em `src/infrastructure/factory/notification-controllers-factory.ts`, atualize a fábrica para criar o novo provedor:

```typescript
static getNotificationService(
  notificationRepository: PrismaNotificationRepositoryCached
): NotificationService {
  // Criar provedores
  const emailProvider = new EmailNotificationProvider({ ... });

  // Novo provedor de push
  const pushProvider = new PushNotificationProvider({
    serviceUrl: env.PUSH_NOTIFICATION_URL,
    apiKey: env.PUSH_NOTIFICATION_API_KEY,
    projectId: env.PUSH_NOTIFICATION_PROJECT_ID,
  });

  // Criar e retornar serviço
  return new NotificationService(
    notificationRepository,
    emailProvider,
    undefined, // SMS provider
    undefined, // WhatsApp provider
    pushProvider
  );
}
```

### 4. Atualizar as Variáveis de Ambiente

Em `src/shared/config/env.ts`, adicione as novas variáveis de ambiente:

```typescript
// Push Notifications
PUSH_NOTIFICATION_URL: z.string().url().default('https://fcm.googleapis.com/v1/projects/your-project/messages:send'),
PUSH_NOTIFICATION_API_KEY: z.string().optional(),
PUSH_NOTIFICATION_PROJECT_ID: z.string().optional(),
```

## Adicionando Novos Templates de Notificação

Para adicionar novos templates (por exemplo, para lembrete de aniversário de pets):

### 1. Atualizar o Serviço de Templates

Para notificações por email, atualize `src/infrastructure/services/templates/email-templates.ts`:

```typescript
export enum EmailTemplateType {
  // ... tipos existentes ...
  PET_BIRTHDAY = 'pet_birthday',
}

// ... na classe EmailTemplateService
generateContent(type: EmailTemplateType, data: SchedulingTemplateData): string {
  switch (type) {
    // ... casos existentes ...
    case EmailTemplateType.PET_BIRTHDAY:
      return this.getPetBirthdayTemplate(data);
    default:
      throw new Error(`Template de e-mail não encontrado: ${type}`);
  }
}

// Novo método para o template
private getPetBirthdayTemplate(data: SchedulingTemplateData): string {
  return `Feliz Aniversário para ${data.petName}!

Olá ${data.customerName},

Estamos felizes em celebrar mais um ano de vida do ${data.petName}!

Aproveite para agendar um serviço especial e comemore essa data importante.
Use o código NIVER${data.petName.slice(0, 3).toUpperCase()} para ganhar 10% de desconto.

Atenciosamente,
Equipe Pet Shop`;
}
```

### 2. Atualizar o Serviço de Notificação

No serviço de notificação, atualize os templates disponíveis:

```typescript
private getEmailTemplates(): Record<string, (data: Record<string, any>) => string> {
  return {
    // ... templates existentes ...
    'pet_birthday': (data) => {
      const templateService = new EmailTemplateService();
      return templateService.generateContent(EmailTemplateType.PET_BIRTHDAY, data);
    },
  };
}
```

## Criando um Novo Controlador de Notificação

Para adicionar um novo controlador especializado (por exemplo, para notificações relacionadas a promoções):

### 1. Criar o Controlador

Crie um novo arquivo em `src/presentation/controllers/promotion-notification-controller.ts`:

```typescript
import { Request, Response } from "express";
import { NotificationService } from "../../domain/services/notification/notification-service.js";
import { NotificationType } from "../../domain/entities/notification.js";
import { logger } from "../../shared/utils/logger.js";

/**
 * Controlador para gerenciamento de notificações de promoções
 */
export class PromotionNotificationController {
	/**
	 * Cria uma nova instância do controlador
	 */
	constructor(private readonly notificationService: NotificationService) {}

	/**
	 * Envia uma notificação de promoção para um cliente específico
	 */
	async sendPromotionNotification(req: Request, res: Response): Promise<void> {
		try {
			const { customerId, customerName, customerEmail, promotionName, validUntil, discount } =
				req.body;

			// Validar dados da requisição
			if (!customerId || !customerName || !customerEmail || !promotionName || !validUntil) {
				res.status(400).json({
					status: "error",
					message:
						"Dados obrigatórios: customerId, customerName, customerEmail, promotionName, validUntil",
				});
				return;
			}

			// Criar e enviar notificação
			const notification = await this.notificationService.createAndSendNotification({
				type: NotificationType.EMAIL,
				templateCode: "promotion",
				templateData: {
					customerName,
					promotionName,
					validUntil,
					discount: discount || "10%",
				},
				schedulingId: `promo-${customerId}-${Date.now()}`,
			});

			res.status(201).json({
				status: "success",
				data: {
					notification: {
						id: notification.id,
						type: notification.type,
						status: notification.status,
					},
				},
				message: "Notificação de promoção enviada com sucesso",
			});
		} catch (error) {
			logger.error("Erro ao enviar notificação de promoção:", error);
			res.status(500).json({
				status: "error",
				message: error instanceof Error ? error.message : "Erro ao enviar notificação de promoção",
			});
		}
	}
}
```

### 2. Atualizar a Fábrica de Controladores

Atualize `src/infrastructure/factory/notification-controllers-factory.ts`:

```typescript
static createControllers(prisma: PrismaClient): ControllersInstance {
  // ... código existente ...

  // Novo controlador
  const promotionNotificationController = new PromotionNotificationController(notificationService);

  return {
    // ... controladores existentes ...
    promotionNotificationController,
    notificationService
  };
}
```

### 3. Configurar Rotas

Atualize ou crie o arquivo de rotas em `src/presentation/routes/promotion-notification-routes.ts`:

```typescript
import { Router } from "express";
import { PromotionNotificationController } from "../controllers/promotion-notification-controller.js";
import { AuthMiddleware } from "../middlewares/auth-middleware.js";

export function setupPromotionNotificationRoutes(
	router: Router,
	promotionNotificationController: PromotionNotificationController,
	authMiddleware: AuthMiddleware,
): void {
	// Adaptar middlewares de autenticação para resolver problemas de tipagem
	const authenticate = authMiddlewareAdapter(authMiddleware.authenticate.bind(authMiddleware));
	const hasRole = roleMiddlewareAdapter(authMiddleware.hasRole.bind(authMiddleware));

	router.post(
		"/promotions/send",
		authenticate,
		hasRole("admin"),
		promotionNotificationController.sendPromotionNotification.bind(promotionNotificationController),
	);
}

// Funções auxiliares para adaptar os middlewares
function authMiddlewareAdapter(
	middleware: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler {
	return (req: Request, res: Response, next: NextFunction) => {
		return middleware(req as AuthenticatedRequest, res, next);
	};
}

function roleMiddlewareAdapter(
	roleMiddleware: (
		role: string,
	) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void,
): (role: string) => RequestHandler {
	return (role: string) => {
		const middleware = roleMiddleware(role);
		return (req: Request, res: Response, next: NextFunction) => {
			return middleware(req as AuthenticatedRequest, res, next);
		};
	};
}
```

Adicione a configuração de rota em `src/server.ts`:

```typescript
import { setupPromotionNotificationRoutes } from "./presentation/routes/promotion-notification-routes.js";

// Na função setupRoutes:
setupPromotionNotificationRoutes(
	router,
	controllersFactory.promotionNotificationController,
	authMiddleware,
);
```

## Boas Práticas para Estender o Sistema de Notificações

1. **Mantenha a Coesão**:

   - Cada provedor deve ter uma única responsabilidade
   - Templates devem ser organizados por tipo de notificação

2. **Use a Abstração Correta**:

   - Use a interface `NotificationProvider` para implementações personalizadas
   - Aproveite a classe `Result` para tratamento de erros

3. **Teste Adequadamente**:

   - Crie testes unitários para novos provedores e templates
   - Implemente testes de integração para verificar o fluxo completo

4. **Documente Suas Extensões**:

   - Atualize a documentação ao adicionar novos tipos ou provedores
   - Documente claramente quaisquer novas variáveis de ambiente necessárias

5. **Gerenciamento de Configuração**:
   - Mantenha as configurações de provedores nos arquivos de ambiente
   - Use injeção de dependência para facilitar testes

## Exemplo Completo: Ciclo de Vida de uma Notificação

1. **Criação**:

   ```typescript
   // Criar notificação na aplicação
   const notification = await notificationService.createAndSendNotification({
   	type: NotificationType.EMAIL,
   	templateCode: "scheduling_confirmation",
   	templateData: {
   		/* dados */
   	},
   	schedulingId: "abc123",
   });
   ```

2. **Processamento**:

   - O serviço de notificação seleciona o provedor apropriado
   - O template é aplicado aos dados fornecidos
   - O provedor envia a notificação
   - O repositório atualiza o status da notificação

3. **Monitoramento**:
   - Use `PerformanceMonitor` para rastrear métricas
   - Analise logs para identificar problemas de entrega

## Solução de Problemas

- **Notificação não está sendo enviada**:

  - Verifique as configurações do provedor
  - Verifique os logs para erros específicos
  - Confirme que o template existe para o tipo de notificação

- **Falha em notificações de um tipo específico**:

  - Verifique se o provedor para esse tipo está configurado corretamente
  - Verifique se o serviço externo (SMTP, API de SMS, etc.) está acessível

- **Problemas de Performance**:
  - Use o cache para otimizar consultas frequentes
  - Monitore o tempo de resposta dos provedores externos
