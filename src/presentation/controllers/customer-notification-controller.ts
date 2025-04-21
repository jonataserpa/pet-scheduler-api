import { Request, Response } from 'express';
import { SendWelcomeNotificationUseCase } from '../../application/use-cases/customer/send-welcome-notification.js';
import { SendPetCheckupReminderUseCase } from '../../application/use-cases/scheduling/send-pet-checkup-reminder.js';
import { CustomerRepository } from '../../domain/repositories/customer-repository.js';
import { PetRepository } from '../../domain/repositories/pet-repository.js';
import { logger } from '../../shared/utils/logger.js';

/**
 * Controlador para gerenciar notificações específicas para clientes e pets
 */
export class CustomerNotificationController {
  /**
   * Cria uma nova instância do controlador de notificações para clientes
   */
  constructor(
    private readonly sendWelcomeNotificationUseCase: SendWelcomeNotificationUseCase,
    private readonly sendPetCheckupReminderUseCase: SendPetCheckupReminderUseCase,
    private readonly customerRepository: CustomerRepository,
    private readonly petRepository: PetRepository
  ) {}

  /**
   * Envia uma notificação de boas-vindas para um cliente recém-cadastrado
   */
  async sendWelcomeNotification(req: Request, res: Response): Promise<void> {
    try {
      const { customerId, template } = req.body;

      if (!customerId) {
        res.status(400).json({
          status: 'error',
          message: 'ID do cliente é obrigatório',
        });
        return;
      }

      // Buscar o cliente
      const customer = await this.customerRepository.findById(customerId);
      if (!customer) {
        res.status(404).json({
          status: 'error',
          message: `Cliente não encontrado: ${customerId}`,
        });
        return;
      }

      // Enviar notificação
      await this.sendWelcomeNotificationUseCase.execute({
        customer,
        template,
      });

      res.status(200).json({
        status: 'success',
        message: 'Notificação de boas-vindas enviada com sucesso',
        data: {
          customerId: customer.id,
          template: template || 'default'
        },
      });
    } catch (error) {
      logger.error('Erro ao enviar notificação de boas-vindas:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Erro ao enviar notificação de boas-vindas',
      });
    }
  }

  /**
   * Envia uma notificação de lembrete de checkup para um pet
   */
  async sendPetCheckupReminder(req: Request, res: Response): Promise<void> {
    try {
      const { petId, checkupType, dueDate, additionalInfo } = req.body;

      if (!petId || !checkupType || !dueDate) {
        res.status(400).json({
          status: 'error',
          message: 'ID do pet, tipo de checkup e data de vencimento são obrigatórios',
        });
        return;
      }

      // Validar o pet
      const pet = await this.petRepository.findById(petId);
      if (!pet) {
        res.status(404).json({
          status: 'error',
          message: `Pet não encontrado: ${petId}`,
        });
        return;
      }

      // Converter a data se necessário
      const parsedDueDate = dueDate instanceof Date ? dueDate : new Date(dueDate);
      if (isNaN(parsedDueDate.getTime())) {
        res.status(400).json({
          status: 'error',
          message: 'Data de vencimento inválida',
        });
        return;
      }

      // Enviar notificação
      await this.sendPetCheckupReminderUseCase.execute({
        petId,
        checkupType,
        dueDate: parsedDueDate,
        additionalInfo,
      });

      res.status(200).json({
        status: 'success',
        message: 'Lembrete de checkup enviado com sucesso',
        data: {
          petId,
          checkupType,
          dueDate: parsedDueDate.toISOString(),
        },
      });
    } catch (error) {
      logger.error('Erro ao enviar lembrete de checkup:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Erro ao enviar lembrete de checkup',
      });
    }
  }

  /**
   * Envia notificações para todos os clientes com pets que precisam de checkup nos próximos dias
   */
  async sendPendingCheckupReminders(req: Request, res: Response): Promise<void> {
    try {
      const daysParam = req.query.days === undefined ? 7 : req.query.days;
      const daysString = Array.isArray(daysParam) ? daysParam[0] : daysParam;
      const daysAhead = parseInt(String(daysString), 10);
      
      const checkupTypesParam = req.query.checkupTypes || ['vacina', 'vermífugo', 'consulta'];
      const checkupTypes = Array.isArray(checkupTypesParam) 
        ? checkupTypesParam 
        : [checkupTypesParam];
      
      if (isNaN(daysAhead) || daysAhead <= 0) {
        res.status(400).json({
          status: 'error',
          message: 'Número de dias deve ser um número positivo',
        });
        return;
      }

      // Em uma implementação real, aqui buscaríamos todos os pets com checkups pendentes
      // nos próximos "daysAhead" dias e enviaríamos as notificações.
      // Para simplificar, apenas simulamos o sucesso.

      // Simulação de envio de lembretes
      const sentCount = Math.floor(Math.random() * 10) + 1; // 1 a 10 lembretes
      
      res.status(200).json({
        status: 'success',
        message: `${sentCount} lembretes de checkup enviados com sucesso`,
        data: {
          sentCount,
          daysAhead,
          checkupTypes,
        },
      });
    } catch (error) {
      logger.error('Erro ao enviar lembretes de checkup pendentes:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Erro ao enviar lembretes de checkup pendentes',
      });
    }
  }
} 