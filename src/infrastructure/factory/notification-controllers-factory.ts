import { PrismaClient } from "@prisma/client";
import { NotificationService } from "../../domain/services/notification/notification-service.js";
import { NotificationController } from "../../presentation/controllers/notification-controller.js";
import { EmailNotificationController } from "../../presentation/controllers/email-notification-controller.js";
import { SmsNotificationController } from "../../presentation/controllers/sms-notification-controller.js";
import { WhatsAppNotificationController } from "../../presentation/controllers/whatsapp-notification-controller.js";
import { CustomerNotificationController } from "../../presentation/controllers/customer-notification-controller.js";
import { PrismaNotificationRepositoryCached } from "../repositories/prisma-notification-repository-cached.js";
import { PrismaCustomerRepository } from "../repositories/prisma-customer-repository.js";
import { PrismaPetRepository } from "../repositories/prisma-pet-repository.js";
import { NotificationCache } from "../cache/notification-cache.js";
import { InMemoryCacheStore } from "../cache/notification-cache.js";
import { PerformanceMonitor } from "../monitoring/performance-monitor.js";
import { EmailNotificationProvider } from "../services/providers/email-notification-provider.js";
import { env } from "../../shared/config/env.js";
import { SendWelcomeNotificationUseCase } from "../../application/use-cases/customer/send-welcome-notification.js";
import { SendPetCheckupReminderUseCase } from "../../application/use-cases/scheduling/send-pet-checkup-reminder.js";

/**
 * Estrutura de retorno para os repositórios
 */
export interface RepositoriesInstance {
	notificationRepository: PrismaNotificationRepositoryCached;
	customerRepository: PrismaCustomerRepository;
	petRepository: PrismaPetRepository;
}

/**
 * Estrutura de retorno para os controladores
 */
export interface ControllersInstance {
	notificationController: NotificationController;
	emailNotificationController: EmailNotificationController;
	smsNotificationController: SmsNotificationController;
	whatsAppNotificationController: WhatsAppNotificationController;
	customerNotificationController: CustomerNotificationController;
	// Expõe o serviço para uso pelo job
	notificationService: NotificationService;
}

/**
 * Fábrica para criar todos os controladores de notificação
 */
export class NotificationControllersFactory {
	/**
	 * Cria e retorna os repositórios necessários
	 * @param prisma Cliente do Prisma
	 */
	static getRepositories(prisma: PrismaClient): RepositoriesInstance {
		// Configurar componentes de cache e monitoramento
		const cacheStore = new InMemoryCacheStore(300); // TTL padrão de 5 minutos
		const notificationCache = new NotificationCache(cacheStore);
		const notificationMonitor = new PerformanceMonitor("Notification");

		// Criar e retornar repositórios
		return {
			notificationRepository: new PrismaNotificationRepositoryCached(
				prisma,
				notificationCache,
				notificationMonitor,
			),
			customerRepository: new PrismaCustomerRepository(prisma),
			petRepository: new PrismaPetRepository(prisma),
		};
	}

	/**
	 * Cria e retorna o serviço de notificação
	 * @param notificationRepository Repositório de notificações
	 */
	static getNotificationService(
		notificationRepository: PrismaNotificationRepositoryCached,
	): NotificationService {
		// Criar provedor de email
		const emailProvider = new EmailNotificationProvider({
			host: env.EMAIL_HOST,
			port: env.EMAIL_PORT,
			secure: env.EMAIL_SECURE,
			user: env.EMAIL_USER,
			password: env.EMAIL_PASSWORD,
			fromEmail: env.EMAIL_FROM,
			fromName: env.EMAIL_FROM_NAME,
		});

		// Criar e retornar serviço
		return new NotificationService(notificationRepository, { email: emailProvider });
	}

	/**
	 * Cria todas as instâncias de controladores de notificação
	 * @param prisma Cliente do Prisma
	 */
	static createControllers(prisma: PrismaClient): ControllersInstance {
		// Obter repositórios
		const repositories = this.getRepositories(prisma);

		// Obter serviço de notificação
		const notificationService = this.getNotificationService(repositories.notificationRepository);

		// Casos de uso
		const sendWelcomeNotificationUseCase = new SendWelcomeNotificationUseCase(notificationService);

		const sendPetCheckupReminderUseCase = new SendPetCheckupReminderUseCase(
			notificationService,
			repositories.petRepository,
			repositories.customerRepository,
		);

		// Controladores
		const notificationController = new NotificationController(notificationService);
		const emailNotificationController = new EmailNotificationController(notificationService);
		const smsNotificationController = new SmsNotificationController(notificationService);
		const whatsAppNotificationController = new WhatsAppNotificationController(notificationService);

		// Controlador de notificações para clientes
		const customerNotificationController = new CustomerNotificationController(
			sendWelcomeNotificationUseCase,
			sendPetCheckupReminderUseCase,
			repositories.customerRepository,
			repositories.petRepository,
		);

		return {
			notificationController,
			emailNotificationController,
			smsNotificationController,
			whatsAppNotificationController,
			customerNotificationController,
			notificationService,
		};
	}
}
