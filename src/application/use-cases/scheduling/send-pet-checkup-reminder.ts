import { NotificationService } from '../../../domain/services/notification/notification-service.js';
import { PetRepository } from '../../../domain/repositories/pet-repository.js';
import { CustomerRepository } from '../../../domain/repositories/customer-repository.js';
import { NotificationType } from '../../../domain/entities/notification.js';
import { logger } from '../../../shared/utils/logger.js';

interface SendPetCheckupReminderRequest {
  petId: string;
  checkupType: string; // ex: 'vacina', 'vermífugo', 'exame de rotina'
  dueDate: Date;
  additionalInfo?: string;
}

/**
 * Caso de uso para enviar lembretes de checkup para pets
 */
export class SendPetCheckupReminderUseCase {
  /**
   * Cria uma nova instância do caso de uso
   * @param notificationService Serviço de notificações
   * @param petRepository Repositório de pets
   * @param customerRepository Repositório de clientes
   */
  constructor(
    private readonly notificationService: NotificationService,
    private readonly petRepository: PetRepository,
    private readonly customerRepository: CustomerRepository
  ) {}

  /**
   * Executa o caso de uso
   * @param request Dados da requisição
   */
  async execute(request: SendPetCheckupReminderRequest): Promise<void> {
    try {
      logger.info('Enviando lembrete de checkup para pet', { 
        petId: request.petId,
        checkupType: request.checkupType,
        dueDate: request.dueDate
      });

      // Buscar informações do pet
      const pet = await this.petRepository.findById(request.petId);
      if (!pet) {
        throw new Error(`Pet não encontrado: ${request.petId}`);
      }

      // Buscar informações do cliente
      const customer = await this.customerRepository.findById(pet.customerId);
      if (!customer) {
        throw new Error(`Cliente não encontrado: ${pet.customerId}`);
      }

      // Formatar data para exibição amigável
      const formattedDate = request.dueDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      // Criar notificação para o cliente
      await this.notificationService.createAndSendNotification({
        type: NotificationType.EMAIL,
        templateCode: 'pet_checkup_reminder',
        templateData: {
          customerName: customer.name,
          petName: pet.name,
          checkupType: request.checkupType,
          dueDate: formattedDate,
          petInfo: `${pet.species} - ${pet.breed || 'Raça não informada'}`, // Informações mais genéricas do pet
          additionalInfo: request.additionalInfo || ''
        },
        schedulingId: `checkup-${pet.id}-${Date.now()}` // Criamos um ID único para rastreamento
      });

      logger.info('Lembrete de checkup enviado com sucesso', { 
        petId: request.petId,
        customerId: customer.id
      });
    } catch (error) {
      logger.error('Erro ao enviar lembrete de checkup para pet', {
        petId: request.petId,
        error
      });
      throw error;
    }
  }
} 