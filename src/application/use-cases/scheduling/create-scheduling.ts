import { Scheduling, ScheduledService, SchedulingStatus } from '../../../domain/entities/scheduling.js';
import { SchedulingRepository } from '../../../domain/repositories/scheduling-repository.js';
import { CustomerRepository } from '../../../domain/repositories/customer-repository.js';
import { PetRepository } from '../../../domain/repositories/pet-repository.js';
import { ServiceRepository } from '../../../domain/repositories/service-repository.js';
import { NotificationService } from '../../../domain/services/notification/notification-service.js';
import { NotificationType } from '../../../domain/entities/notification.js';
import { logger } from '../../../shared/utils/logger.js';
import { Result } from '../../../shared/utils/result.js';
import crypto from 'crypto';
import { TimeSlot } from '../../../domain/entities/value-objects/time-slot.js';

interface CreateSchedulingRequest {
  customerId: string;
  petId: string;
  serviceId: string;
  scheduledDateTime: Date;
  notes?: string;
}

interface CreateSchedulingResponse {
  scheduling: Scheduling;
  notificationSent: boolean;
}

/**
 * Caso de uso para criar um agendamento e enviar notificação
 */
export class CreateSchedulingUseCase {
  /**
   * Cria uma nova instância do caso de uso
   */
  constructor(
    private readonly schedulingRepository: SchedulingRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly petRepository: PetRepository,
    private readonly serviceRepository: ServiceRepository,
    private readonly notificationService: NotificationService
  ) {}

  /**
   * Executa o caso de uso
   * @param request Dados para criação do agendamento
   */
  async execute(request: CreateSchedulingRequest): Promise<Result<CreateSchedulingResponse>> {
    try {
      // Validar entrada
      if (!request.customerId || !request.petId || !request.serviceId || !request.scheduledDateTime) {
        logger.warn('Dados incompletos para criação de agendamento', request);
        return Result.fail({
          message: 'Dados incompletos para criação de agendamento',
          code: 'INVALID_INPUT'
        });
      }

      // Verificar existência do cliente
      const customer = await this.customerRepository.findById(request.customerId);
      if (!customer) {
        logger.warn(`Cliente não encontrado para agendamento: ${request.customerId}`);
        return Result.fail({
          message: `Cliente não encontrado: ${request.customerId}`,
          code: 'CUSTOMER_NOT_FOUND'
        });
      }

      // Verificar existência do pet
      const pet = await this.petRepository.findById(request.petId);
      if (!pet) {
        logger.warn(`Pet não encontrado para agendamento: ${request.petId}`);
        return Result.fail({
          message: `Pet não encontrado: ${request.petId}`,
          code: 'PET_NOT_FOUND'
        });
      }

      // Verificar se o pet pertence ao cliente
      if (pet.customerId !== customer.id) {
        logger.warn(`Pet não pertence ao cliente informado`, {
          petId: pet.id,
          customerId: customer.id,
          petCustomerId: pet.customerId
        });
        return Result.fail({
          message: `O pet não pertence ao cliente informado`,
          code: 'PET_CUSTOMER_MISMATCH'
        });
      }

      // Verificar existência do serviço
      const service = await this.serviceRepository.findById(request.serviceId);
      if (!service) {
        logger.warn(`Serviço não encontrado: ${request.serviceId}`);
        return Result.fail({
          message: `Serviço não encontrado: ${request.serviceId}`,
          code: 'SERVICE_NOT_FOUND'
        });
      }

      // Verificar conflitos de agendamento
      // Em uma implementação real, verificaria se há conflitos de horário
      // await this.schedulingRepository.checkConflicts(...)

      // Criar o agendamento
      const schedulingId = crypto.randomUUID();
      
      // Criar TimeSlot com duração padrão de 1 hora para o serviço
      const timeSlot = TimeSlot.createFromDuration(
        request.scheduledDateTime,
        service.duration || 60 // duração em minutos
      );
      
      // Criar serviço agendado
      const scheduledService = new ScheduledService(
        crypto.randomUUID(),
        service.id,
        service.name,
        service.price,
        service.duration || 60
      );
      
      const scheduling = await this.schedulingRepository.create(
        schedulingId,
        timeSlot,
        customer.id,
        pet.id,
        [scheduledService],
        request.notes || '',
        SchedulingStatus.SCHEDULED
      );

      // Enviar notificação de confirmação
      let notificationSent = false;
      try {
        // Formatar data e hora
        const formattedDateTime = request.scheduledDateTime.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        // Enviar notificação
        await this.notificationService.createAndSendNotification({
          type: NotificationType.EMAIL,
          templateCode: 'scheduling_confirmation',
          templateData: {
            customerName: customer.name,
            petName: pet.name,
            serviceName: service.name,
            dateTime: formattedDateTime,
            price: `R$ ${service.price.toFixed(2)}`,
            additionalInfo: scheduling.notes
          },
          schedulingId: scheduling.id
        });
        
        notificationSent = true;
        logger.info('Notificação de confirmação enviada para agendamento', { schedulingId: scheduling.id });
      } catch (error) {
        // Não falhar o caso de uso se a notificação falhar
        logger.error('Erro ao enviar notificação de confirmação:', {
          schedulingId: scheduling.id,
          error
        });
      }

      return Result.ok({
        scheduling,
        notificationSent
      });
    } catch (error) {
      logger.error('Erro ao criar agendamento:', error);
      return Result.fail({
        message: error instanceof Error ? error.message : 'Erro ao criar agendamento',
        details: error
      });
    }
  }
} 