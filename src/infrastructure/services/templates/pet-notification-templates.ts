/**
 * Tipos de templates para notificações de pets
 */
export enum PetNotificationTemplateType {
  CHECKUP_REMINDER = 'pet_checkup_reminder',
  VACCINATION_DUE = 'pet_vaccination_due',
  BIRTHDAY = 'pet_birthday',
  ADOPTION_ANNIVERSARY = 'pet_adoption_anniversary',
}

/**
 * Dados para preenchimento do template de notificação de pets
 */
export interface PetNotificationTemplateData {
  customerName: string;
  petName: string;
  petInfo?: string;
  checkupType?: string;
  dueDate?: string;
  additionalInfo?: string;
}

/**
 * Serviço de templates para notificações relacionadas a pets
 */
export class PetNotificationTemplateService {
  /**
   * Processa um template de pet com os dados fornecidos
   * @param type Tipo do template
   * @param data Dados para o template
   */
  generateContent(type: PetNotificationTemplateType, data: PetNotificationTemplateData): string {
    switch (type) {
      case PetNotificationTemplateType.CHECKUP_REMINDER:
        return this.getCheckupReminderTemplate(data);
      case PetNotificationTemplateType.VACCINATION_DUE:
        return this.getVaccinationDueTemplate(data);
      case PetNotificationTemplateType.BIRTHDAY:
        return this.getBirthdayTemplate(data);
      case PetNotificationTemplateType.ADOPTION_ANNIVERSARY:
        return this.getAdoptionAnniversaryTemplate(data);
      default:
        throw new Error(`Template de notificação de pet não encontrado: ${type}`);
    }
  }

  /**
   * Template para lembrete de checkup
   */
  private getCheckupReminderTemplate(data: PetNotificationTemplateData): string {
    return `Lembrete de Checkup Pet - Pet Shop

Olá ${data.customerName},

Estamos entrando em contato para lembrar do checkup de ${data.checkupType} do pet ${data.petName}.

Data prevista: ${data.dueDate || 'o mais breve possível'}
${data.petInfo ? `Informações do pet: ${data.petInfo}` : ''}

${data.additionalInfo ? `Informações adicionais: ${data.additionalInfo}` : ''}

Checkups regulares são importantes para a saúde e bem-estar do seu pet. Não deixe de agendar!

Para agendar, entre em contato conosco pelos nossos canais de atendimento.

Atenciosamente,
Equipe Pet Shop`;
  }

  /**
   * Template para vacina a vencer
   */
  private getVaccinationDueTemplate(data: PetNotificationTemplateData): string {
    return `Lembrete de Vacinação - Pet Shop

Olá ${data.customerName},

Estamos entrando em contato para lembrar que a vacina de ${data.petName} está próxima da data de vencimento.

Tipo de vacina: ${data.checkupType || 'Vacina periódica'}
Data para vacinação: ${data.dueDate || 'o mais breve possível'}

A vacinação regular é essencial para proteger seu pet contra diversas doenças. Não deixe de agendar!

Para agendar a vacinação, entre em contato conosco pelos nossos canais de atendimento.

Atenciosamente,
Equipe Pet Shop`;
  }

  /**
   * Template para aniversário do pet
   */
  private getBirthdayTemplate(data: PetNotificationTemplateData): string {
    return `Feliz Aniversário para ${data.petName}! 🎂 - Pet Shop

Olá ${data.customerName},

Hoje é um dia especial - o aniversário de ${data.petName}! 🎉

${data.petInfo ? `${data.petInfo}` : ''}

Queremos desejar muita saúde, brincadeiras e petiscos deliciosos para comemorar esta data especial.

Como presente de aniversário, oferecemos um desconto especial de 15% em qualquer serviço para ${data.petName} durante esta semana.

Use o código: NIVER${data.petName.toUpperCase()}

Venha comemorar conosco!

Atenciosamente,
Equipe Pet Shop`;
  }

  /**
   * Template para aniversário de adoção
   */
  private getAdoptionAnniversaryTemplate(data: PetNotificationTemplateData): string {
    return `Feliz Aniversário de Adoção! 💖 - Pet Shop

Olá ${data.customerName},

Hoje comemoramos uma data muito especial - o aniversário de adoção de ${data.petName}!

${data.additionalInfo ? data.additionalInfo : 'Parabéns por este tempo de companheirismo e amor.'}

Para celebrar este momento, oferecemos um banho especial com desconto de 20% para ${data.petName}.

Use o código: ADOCAO${data.petName.toUpperCase()}

Que venham muitos mais anos de amor e alegria juntos!

Atenciosamente,
Equipe Pet Shop`;
  }
} 