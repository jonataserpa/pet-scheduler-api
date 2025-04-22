import { Notification } from "../../../domain/entities/notification.js";
import { NotificationProvider } from "../../../domain/services/notification/notification-service.js";
import { logger } from "../../../shared/utils/logger.js";
import nodemailer from "nodemailer";
import {
	EmailTemplateService,
	EmailTemplateType,
	SchedulingTemplateData,
} from "../templates/email-templates.js";

/**
 * Configuração para o provedor de e-mail
 */
export interface EmailProviderConfig {
	/**
	 * Host do servidor SMTP
	 */
	host: string;

	/**
	 * Porta do servidor SMTP
	 */
	port: number;

	/**
	 * Se deve usar SSL/TLS
	 */
	secure: boolean;

	/**
	 * Usuário para autenticação
	 */
	user: string;

	/**
	 * Senha para autenticação
	 */
	password: string;

	/**
	 * E-mail do remetente
	 */
	fromEmail: string;

	/**
	 * Nome do remetente
	 */
	fromName: string;
}

/**
 * Estrutura para dados de um agendamento no contexto de notificações
 */
interface SchedulingData {
	id: string;
	customerName: string;
	customerEmail: string;
	petName: string;
	serviceName: string;
	dateTime: string;
	address?: string;
	price?: string;
	additionalInfo?: string;
}

/**
 * Implementação do provedor de notificações por e-mail usando Nodemailer
 */
export class EmailNotificationProvider implements NotificationProvider {
	private transporter: nodemailer.Transporter;
	private templateService: EmailTemplateService;

	/**
	 * Cria uma nova instância do provedor de e-mail
	 * @param config Configuração do provedor
	 */
	constructor(
		private readonly config: EmailProviderConfig,
		templateService?: EmailTemplateService,
	) {
		// Configurar o transporter do Nodemailer
		this.transporter = nodemailer.createTransport({
			host: config.host,
			port: config.port,
			secure: config.secure,
			auth: {
				user: config.user,
				pass: config.password,
			},
		});

		// Inicializar o serviço de templates
		this.templateService = templateService || new EmailTemplateService();
	}

	/**
	 * Envia uma notificação por e-mail
	 * @param notification A notificação a ser enviada
	 */
	async send(notification: Notification): Promise<void> {
		try {
			// Extrair tipo da notificação
			const notificationType = this.getNotificationType(notification);

			// Buscar dados completos do agendamento
			const schedulingData = await this.getSchedulingData(notification.schedulingId);

			if (!schedulingData) {
				throw new Error(
					`Não foi possível encontrar os dados do agendamento ${notification.schedulingId}`,
				);
			}

			// Converter para o formato necessário para o template
			const templateData: SchedulingTemplateData = {
				customerName: schedulingData.customerName,
				petName: schedulingData.petName,
				serviceName: schedulingData.serviceName,
				dateTime: schedulingData.dateTime,
				address: schedulingData.address,
				price: schedulingData.price,
				additionalInfo: schedulingData.additionalInfo || notification.content,
			};

			// Gerar conteúdo do email com base no template
			const emailContent = this.templateService.generateContent(notificationType, templateData);

			// Enviar o e-mail
			const info = await this.transporter.sendMail({
				from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
				to: schedulingData.customerEmail,
				subject: this.getSubjectFromType(notificationType),
				text: emailContent,
				html: this.convertTextToHtml(emailContent),
			});

			logger.info(`E-mail enviado: ${info.messageId}`, {
				notificationId: notification.id,
				recipientEmail: schedulingData.customerEmail,
				type: notificationType,
			});
		} catch (error) {
			logger.error(`Erro ao enviar e-mail para notificação ${notification.id}:`, error);
			throw error;
		}
	}

	/**
	 * Determina o tipo de template a ser usado com base na notificação
	 * @param notification A notificação a ser analisada
	 */
	private getNotificationType(notification: Notification): EmailTemplateType {
		// Extrai o tipo a partir do tipo da notificação ou de seu conteúdo
		// Aqui estamos usando uma lógica simplificada, mas em um caso real
		// poderíamos ter uma estratégia mais sofisticada

		if (notification.type.includes("reminder")) {
			return EmailTemplateType.SCHEDULING_REMINDER;
		} else if (notification.type.includes("cancel")) {
			return EmailTemplateType.SCHEDULING_CANCELLATION;
		} else if (notification.type.includes("reschedule")) {
			return EmailTemplateType.SCHEDULING_RESCHEDULED;
		} else {
			// Por padrão, usamos o template de confirmação
			return EmailTemplateType.SCHEDULING_CONFIRMATION;
		}
	}

	/**
	 * Busca os dados completos do agendamento
	 * Em uma implementação real, isso consultaria um repositório ou serviço
	 * @param schedulingId ID do agendamento
	 */
	private async getSchedulingData(schedulingId: string): Promise<SchedulingData | null> {
		// Implementação de exemplo - em um cenário real, consultaria o banco de dados

		logger.debug(`Buscando dados para agendamento ${schedulingId}`);

		// Dados mockados para exemplo
		return {
			id: schedulingId,
			customerName: "Cliente Exemplo",
			customerEmail: `customer-${schedulingId.substring(0, 8)}@example.com`,
			petName: "Rex",
			serviceName: "Banho e Tosa",
			dateTime: new Date().toLocaleString("pt-BR"),
			price: "R$ 80,00",
			address: "Rua das Flores, 123 - São Paulo/SP",
		};
	}

	/**
	 * Obtém o assunto do email com base no tipo de notificação
	 * @param type Tipo do template de email
	 */
	private getSubjectFromType(type: EmailTemplateType): string {
		switch (type) {
			case EmailTemplateType.SCHEDULING_CONFIRMATION:
				return "Confirmação de Agendamento - Pet Shop";
			case EmailTemplateType.SCHEDULING_REMINDER:
				return "Lembrete de Agendamento - Pet Shop";
			case EmailTemplateType.SCHEDULING_CANCELLATION:
				return "Cancelamento de Agendamento - Pet Shop";
			case EmailTemplateType.SCHEDULING_RESCHEDULED:
				return "Reagendamento Confirmado - Pet Shop";
			default:
				return "Notificação Pet Shop";
		}
	}

	/**
	 * Converte o texto simples em HTML básico
	 * @param text Texto a ser convertido
	 */
	private convertTextToHtml(text: string): string {
		// Conversão simples para HTML mantendo quebras de linha
		const htmlContent = text
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/\n/g, "<br>");

		return `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #4a4a4a;">Pet Shop</h2>
          <div style="height: 3px; background-color: #3498db; width: 100px; margin: 0 auto;"></div>
        </div>
        <div style="color: #4a4a4a;">
          ${htmlContent}
        </div>
        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; color: #777; font-size: 12px; text-align: center;">
          © ${new Date().getFullYear()} Pet Shop - Todos os direitos reservados
        </div>
      </div>
    `;
	}
}
