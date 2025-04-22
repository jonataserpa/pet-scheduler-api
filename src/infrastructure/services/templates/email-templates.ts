/**
 * Tipos de templates de email disponíveis
 */
export enum EmailTemplateType {
	SCHEDULING_CONFIRMATION = "scheduling_confirmation",
	SCHEDULING_REMINDER = "scheduling_reminder",
	SCHEDULING_CANCELLATION = "scheduling_cancellation",
	SCHEDULING_RESCHEDULED = "scheduling_rescheduled",
}

/**
 * Dados para preenchimento do template de agendamento
 */
export interface SchedulingTemplateData {
	customerName: string;
	petName: string;
	serviceName: string;
	dateTime: string; // Formato ISO ou formatado
	address?: string;
	price?: string;
	additionalInfo?: string;
}

/**
 * Serviço de templates para e-mails
 */
export class EmailTemplateService {
	/**
	 * Processa um template com os dados fornecidos
	 * @param type Tipo do template
	 * @param data Dados para o template
	 */
	generateContent(type: EmailTemplateType, data: SchedulingTemplateData): string {
		switch (type) {
			case EmailTemplateType.SCHEDULING_CONFIRMATION:
				return this.getSchedulingConfirmationTemplate(data);
			case EmailTemplateType.SCHEDULING_REMINDER:
				return this.getSchedulingReminderTemplate(data);
			case EmailTemplateType.SCHEDULING_CANCELLATION:
				return this.getSchedulingCancellationTemplate(data);
			case EmailTemplateType.SCHEDULING_RESCHEDULED:
				return this.getSchedulingRescheduledTemplate(data);
			default:
				throw new Error(`Template de e-mail não encontrado: ${type}`);
		}
	}

	/**
	 * Template para confirmação de agendamento
	 */
	private getSchedulingConfirmationTemplate(data: SchedulingTemplateData): string {
		return `Confirmação de Agendamento - Pet Shop

Olá ${data.customerName},

Confirmamos seu agendamento para ${data.serviceName} do pet ${data.petName}.

Data e hora: ${data.dateTime}
${data.address ? `Endereço: ${data.address}` : ""}
${data.price ? `Valor: ${data.price}` : ""}

${data.additionalInfo ? `Informações adicionais: ${data.additionalInfo}` : ""}

Por favor, chegue com 10 minutos de antecedência.
Para cancelar ou reagendar, entre em contato conosco com pelo menos 24 horas de antecedência.

Atenciosamente,
Equipe Pet Shop`;
	}

	/**
	 * Template para lembrete de agendamento
	 */
	private getSchedulingReminderTemplate(data: SchedulingTemplateData): string {
		return `Lembrete de Agendamento - Pet Shop

Olá ${data.customerName},

Este é um lembrete do seu agendamento para ${data.serviceName} do pet ${data.petName}.

Data e hora: ${data.dateTime}
${data.address ? `Endereço: ${data.address}` : ""}

Aguardamos sua presença!

Atenciosamente,
Equipe Pet Shop`;
	}

	/**
	 * Template para cancelamento de agendamento
	 */
	private getSchedulingCancellationTemplate(data: SchedulingTemplateData): string {
		return `Cancelamento de Agendamento - Pet Shop

Olá ${data.customerName},

Seu agendamento para ${data.serviceName} do pet ${data.petName} foi cancelado.

Data e hora que estava agendado: ${data.dateTime}

${data.additionalInfo ? `Motivo: ${data.additionalInfo}` : ""}

Caso deseje reagendar, entre em contato conosco.

Atenciosamente,
Equipe Pet Shop`;
	}

	/**
	 * Template para reagendamento
	 */
	private getSchedulingRescheduledTemplate(data: SchedulingTemplateData): string {
		return `Reagendamento Confirmado - Pet Shop

Olá ${data.customerName},

Seu agendamento para ${data.serviceName} do pet ${data.petName} foi reagendado.

Nova data e hora: ${data.dateTime}
${data.address ? `Endereço: ${data.address}` : ""}
${data.price ? `Valor: ${data.price}` : ""}

${data.additionalInfo ? `Informações adicionais: ${data.additionalInfo}` : ""}

Para cancelar ou reagendar, entre em contato conosco com pelo menos 24 horas de antecedência.

Atenciosamente,
Equipe Pet Shop`;
	}
}
