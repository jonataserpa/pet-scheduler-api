import { NotificationService } from "../../../domain/services/notification/notification-service.js";
import { PetRepository } from "../../../domain/repositories/pet-repository.js";
import { CustomerRepository } from "../../../domain/repositories/customer-repository.js";
import { logger } from "../../../shared/utils/logger.js";
import { SendPetCheckupReminderUseCase } from "./send-pet-checkup-reminder.js";

/**
 * Configuração para o job de notificações
 */
export interface ScheduleNotificationJobConfig {
	/**
	 * Intervalo de execução do job em milissegundos
	 */
	interval: number;

	/**
	 * Número máximo de notificações a processar por execução
	 */
	batchSize: number;
}

/**
 * Job para envio automático de notificações agendadas e pendentes
 */
export class ScheduleNotificationJob {
	private intervalId: ReturnType<typeof setInterval> | null = null;
	private readonly sendReminderUseCase: SendPetCheckupReminderUseCase;

	/**
	 * Cria uma nova instância do job
	 * @param config Configuração do job
	 * @param notificationService Serviço de notificações
	 * @param petRepository Repositório de pets
	 * @param customerRepository Repositório de clientes
	 */
	constructor(
		private readonly config: ScheduleNotificationJobConfig,
		private readonly notificationService: NotificationService,
		private readonly petRepository: PetRepository,
		private readonly customerRepository: CustomerRepository,
	) {
		// Inicializar o caso de uso para envio de lembretes
		this.sendReminderUseCase = new SendPetCheckupReminderUseCase(
			this.notificationService,
			this.petRepository,
			this.customerRepository,
		);
	}

	/**
	 * Inicia o job
	 */
	start(): void {
		if (this.intervalId) {
			logger.warn("Job de notificações já está em execução");
			return;
		}

		logger.info("Iniciando job de notificações agendadas", {
			interval: this.config.interval,
			batchSize: this.config.batchSize,
		});

		this.intervalId = setInterval(() => this.execute(), this.config.interval);
	}

	/**
	 * Para o job
	 */
	stop(): void {
		if (!this.intervalId) {
			logger.warn("Job de notificações não está em execução");
			return;
		}

		clearInterval(this.intervalId);
		this.intervalId = null;
		logger.info("Job de notificações parado");
	}

	/**
	 * Executa o job uma vez
	 */
	async execute(): Promise<void> {
		try {
			logger.info("Executando job de notificações agendadas");

			// Processar notificações pendentes
			const pendingCount = await this.notificationService.sendPendingNotifications(
				this.config.batchSize,
			);
			logger.info(`Processadas ${pendingCount} notificações pendentes`);

			// Verificar checkups de pets que vencem em breve
			const checkupReminders = await this.processPetCheckupReminders();
			logger.info(`Enviados ${checkupReminders} lembretes de checkup para pets`);

			// Verificar aniversários e outras notificações programadas
			// Implementação futura...

			logger.info("Job de notificações concluído com sucesso");
		} catch (error) {
			logger.error("Erro ao executar job de notificações:", error);
		}
	}

	/**
	 * Processa lembretes de checkup para pets
	 * @returns Número de lembretes enviados
	 */
	private async processPetCheckupReminders(): Promise<number> {
		try {
			// Em implementações futuras, usaríamos uma query real no banco de dados
			// para buscar pets com checkups próximos
			const daysAhead = 7;
			const today = new Date();
			const futureDate = new Date(today);
			futureDate.setDate(today.getDate() + daysAhead);

			// Em um ambiente de produção, seria usado um repositório adequado
			// para buscar estes dados diretamente do banco

			// Por enquanto, usamos dados simulados para testar a funcionalidade
			const petsWithUpcomingCheckups = [
				{
					petId: "pet-1",
					checkupType: "vacina",
					dueDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 dias depois
				},
				{
					petId: "pet-2",
					checkupType: "vermífugo",
					dueDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 dias depois
				},
			];

			let sentCount = 0;

			// Processar os lembretes usando o sendReminderUseCase
			for (const checkup of petsWithUpcomingCheckups) {
				// Usar efetivamente o sendReminderUseCase
				await this.sendReminderUseCase.execute({
					petId: checkup.petId,
					checkupType: checkup.checkupType,
					dueDate: checkup.dueDate,
				});
				sentCount++;
			}

			return sentCount;
		} catch (error) {
			logger.error("Erro ao processar lembretes de checkup para pets:", error);
			return 0;
		}
	}
}
