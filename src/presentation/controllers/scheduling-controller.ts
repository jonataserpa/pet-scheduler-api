import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { SchedulingRepository } from '../../domain/repositories/scheduling-repository.js';
import { PetRepository } from '../../domain/repositories/pet-repository.js';
import { CustomerRepository } from '../../domain/repositories/customer-repository.js';
import { SchedulingStatus, ScheduledService } from '../../domain/entities/scheduling.js';
import { TimeSlot } from '../../domain/entities/value-objects/time-slot.js';
import { logger } from '../../shared/utils/logger.js';

/**
 * Controlador para gerenciamento de agendamentos
 */
export class SchedulingController {
  constructor(
    private readonly schedulingRepository: SchedulingRepository,
    private readonly petRepository: PetRepository,
    private readonly customerRepository: CustomerRepository
  ) {}

  /**
   * Lista todos os agendamentos com filtros opcionais
   */
  async listSchedulings(req: Request, res: Response): Promise<void> {
    try {
      const { 
        startDate, 
        endDate, 
        status, 
        customerId,
        petId,
        limit = '50', 
        offset = '0' 
      } = req.query;
      
      const filter: any = {
        customerId: customerId as string,
        petId: petId as string,
        status: status as string
      };
      
      // Adicionar filtro de data se fornecido
      if (startDate) {
        filter.startDate = new Date(startDate as string);
      }
      
      if (endDate) {
        filter.endDate = new Date(endDate as string);
      }
      
      const schedulings = await this.schedulingRepository.findAll(
        filter,
        parseInt(limit as string, 10),
        parseInt(offset as string, 10)
      );
      
      const count = await this.schedulingRepository.count(filter);
      
      res.status(200).json({
        data: schedulings.map(scheduling => scheduling.toObject()),
        meta: {
          total: count,
          limit: parseInt(limit as string, 10),
          offset: parseInt(offset as string, 10)
        }
      });
    } catch (error) {
      logger.error('Erro ao listar agendamentos:', { error });
      res.status(500).json({ error: 'Erro ao listar agendamentos' });
    }
  }

  /**
   * Busca um agendamento pelo ID
   */
  async getSchedulingById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const scheduling = await this.schedulingRepository.findById(id);
      
      if (!scheduling) {
        res.status(404).json({ error: 'Agendamento não encontrado' });
        return;
      }
      
      res.status(200).json(scheduling.toObject());
    } catch (error) {
      logger.error('Erro ao buscar agendamento por ID:', { error, id: req.params.id });
      res.status(500).json({ error: 'Erro ao buscar agendamento' });
    }
  }

  /**
   * Cria um novo agendamento
   */
  async createScheduling(req: Request, res: Response): Promise<void> {
    try {
      const { 
        startTime, 
        endTime, 
        customerId, 
        petId, 
        services, 
        notes,
        status = SchedulingStatus.SCHEDULED
      } = req.body;
      
      // Validação básica
      if (!startTime || !endTime || !customerId || !petId || !services || !Array.isArray(services)) {
        res.status(400).json({ 
          error: 'Dados incompletos. Data/hora de início e fim, cliente, pet e serviços são obrigatórios' 
        });
        return;
      }
      
      // Verificar se cliente existe
      const customer = await this.customerRepository.findById(customerId);
      if (!customer) {
        res.status(404).json({ error: 'Cliente não encontrado' });
        return;
      }
      
      // Verificar se pet existe e pertence ao cliente
      const pet = await this.petRepository.findById(petId);
      if (!pet) {
        res.status(404).json({ error: 'Pet não encontrado' });
        return;
      }
      
      if (pet.customerId !== customerId) {
        res.status(400).json({ error: 'O pet não pertence ao cliente informado' });
        return;
      }
      
      // Criar time slot
      const start = new Date(startTime);
      const end = new Date(endTime);
      
      // Verificar se a data de início é antes da data de fim
      if (start >= end) {
        res.status(400).json({ error: 'A data/hora de início deve ser anterior à data/hora de fim' });
        return;
      }
      
      const timeSlot = TimeSlot.create(start, end);
      
      // Verificar conflitos de agendamento
      const conflicts = await this.schedulingRepository.findConflicts(timeSlot);
      if (conflicts.length > 0) {
        res.status(409).json({ 
          error: 'Existe conflito com outro agendamento neste horário',
          conflicts: conflicts.map(conflict => conflict.toObject())
        });
        return;
      }
      
      // Criar serviços agendados (mock até termos o ServiceRepository)
      const scheduledServices: ScheduledService[] = services.map((serviceId: string) => {
        return new ScheduledService(
          uuidv4(),
          serviceId,
          `Serviço ${serviceId}`, // Nome do serviço (mockado)
          100.0, // Preço (mockado)
          60 // Duração em minutos (mockado)
        );
      });
      
      // Calcular preço total (não usado diretamente aqui, mas será calculado pelo repositório)
      // Mantemos o cálculo para referência do preço total esperado
      const totalPrice = scheduledServices.reduce((sum, service) => sum + service.price, 0);
      logger.debug('Preço total calculado para o agendamento:', { totalPrice, serviceCount: scheduledServices.length });
      
      // Criar agendamento
      const scheduling = await this.schedulingRepository.create(
        uuidv4(),
        timeSlot,
        customerId,
        petId,
        scheduledServices,
        notes,
        status as SchedulingStatus
      );
      
      res.status(201).json(scheduling.toObject());
    } catch (error) {
      logger.error('Erro ao criar agendamento:', { error, body: req.body });
      
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erro ao criar agendamento' });
      }
    }
  }

  /**
   * Atualiza um agendamento existente
   */
  async updateScheduling(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { startTime, endTime, services, notes } = req.body;
      
      // Checar se o agendamento existe
      const scheduling = await this.schedulingRepository.findById(id);
      
      if (!scheduling) {
        res.status(404).json({ error: 'Agendamento não encontrado' });
        return;
      }
      
      // Se services foi fornecido, utilizamos para criar os ScheduledServices
      if (services && Array.isArray(services)) {
        logger.debug('Serviços a serem atualizados:', { services });
        // Implementação de atualização de serviços seria aqui
        // (não implementada totalmente neste exemplo)
      }
      
      // Criar time slot se startTime e endTime foram fornecidos
      if (startTime && endTime) {
        const start = new Date(startTime);
        const end = new Date(endTime);
        
        // Verificar se a data de início é antes da data de fim
        if (start >= end) {
          res.status(400).json({ error: 'A data/hora de início deve ser anterior à data/hora de fim' });
          return;
        }
        
        const timeSlot = TimeSlot.create(start, end);
        
        // Verificar conflitos de agendamento
        const conflicts = await this.schedulingRepository.findConflicts(timeSlot, id);
        if (conflicts.length > 0) {
          res.status(409).json({ 
            error: 'Existe conflito com outro agendamento neste horário',
            conflicts: conflicts.map(conflict => conflict.toObject())
          });
          return;
        }
        
        // Atualizar horário
        await this.schedulingRepository.updateTimeSlot(id, timeSlot);
      }
      
      // Atualizar notas se fornecidas
      if (notes !== undefined) {
        await this.schedulingRepository.addNotes(id, notes);
      }
      
      // Buscar o agendamento atualizado
      const updatedScheduling = await this.schedulingRepository.findById(id);
      
      res.status(200).json(updatedScheduling?.toObject());
    } catch (error) {
      logger.error('Erro ao atualizar agendamento:', { error, id: req.params.id, body: req.body });
      
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erro ao atualizar agendamento' });
      }
    }
  }

  /**
   * Atualiza o status de um agendamento
   */
  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status || !Object.values(SchedulingStatus).includes(status as SchedulingStatus)) {
        res.status(400).json({ error: 'Status inválido' });
        return;
      }
      
      // Verificar se o agendamento existe
      const scheduling = await this.schedulingRepository.findById(id);
      
      if (!scheduling) {
        res.status(404).json({ error: 'Agendamento não encontrado' });
        return;
      }
      
      // Atualizar o status
      const updatedScheduling = await this.schedulingRepository.updateStatus(id, status as SchedulingStatus);
      
      res.status(200).json(updatedScheduling.toObject());
    } catch (error) {
      logger.error('Erro ao atualizar status do agendamento:', { error, id: req.params.id, body: req.body });
      res.status(500).json({ error: 'Erro ao atualizar status do agendamento' });
    }
  }

  /**
   * Adiciona notas a um agendamento
   */
  async addNotes(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      
      if (!notes) {
        res.status(400).json({ error: 'Notas não fornecidas' });
        return;
      }
      
      // Verificar se o agendamento existe
      const scheduling = await this.schedulingRepository.findById(id);
      
      if (!scheduling) {
        res.status(404).json({ error: 'Agendamento não encontrado' });
        return;
      }
      
      // Adicionar notas
      const updatedScheduling = await this.schedulingRepository.addNotes(id, notes);
      
      res.status(200).json(updatedScheduling.toObject());
    } catch (error) {
      logger.error('Erro ao adicionar notas ao agendamento:', { error, id: req.params.id, body: req.body });
      res.status(500).json({ error: 'Erro ao adicionar notas ao agendamento' });
    }
  }

  /**
   * Busca agendamentos de um cliente
   */
  async getSchedulingsByCustomer(req: Request, res: Response): Promise<void> {
    try {
      const { customerId } = req.params;
      const { status, limit = '10' } = req.query;
      
      // Verificar se o cliente existe
      const customer = await this.customerRepository.findById(customerId);
      
      if (!customer) {
        res.status(404).json({ error: 'Cliente não encontrado' });
        return;
      }
      
      // Buscar agendamentos
      const schedulings = await this.schedulingRepository.findByCustomerId(
        customerId,
        status as SchedulingStatus | undefined,
        parseInt(limit as string, 10)
      );
      
      res.status(200).json(schedulings.map(scheduling => scheduling.toObject()));
    } catch (error) {
      logger.error('Erro ao buscar agendamentos do cliente:', { error, customerId: req.params.customerId });
      res.status(500).json({ error: 'Erro ao buscar agendamentos do cliente' });
    }
  }

  /**
   * Busca agendamentos de um pet
   */
  async getSchedulingsByPet(req: Request, res: Response): Promise<void> {
    try {
      const { petId } = req.params;
      const { status, limit = '10' } = req.query;
      
      // Verificar se o pet existe
      const pet = await this.petRepository.findById(petId);
      
      if (!pet) {
        res.status(404).json({ error: 'Pet não encontrado' });
        return;
      }
      
      // Buscar agendamentos
      const schedulings = await this.schedulingRepository.findByPetId(
        petId,
        status as SchedulingStatus | undefined,
        parseInt(limit as string, 10)
      );
      
      res.status(200).json(schedulings.map(scheduling => scheduling.toObject()));
    } catch (error) {
      logger.error('Erro ao buscar agendamentos do pet:', { error, petId: req.params.petId });
      res.status(500).json({ error: 'Erro ao buscar agendamentos do pet' });
    }
  }

  /**
   * Busca agendamentos em um período específico
   */
  async getSchedulingsByPeriod(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate, status } = req.query;
      
      if (!startDate || !endDate) {
        res.status(400).json({ error: 'Datas de início e fim são obrigatórias' });
        return;
      }
      
      // Converter strings para datas
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      // Validar datas
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        res.status(400).json({ error: 'Datas inválidas' });
        return;
      }
      
      if (start > end) {
        res.status(400).json({ error: 'A data de início deve ser anterior ou igual à data de fim' });
        return;
      }
      
      // Buscar agendamentos no período
      const schedulings = await this.schedulingRepository.findByPeriod(
        start,
        end,
        status as SchedulingStatus | undefined
      );
      
      res.status(200).json(schedulings.map(scheduling => scheduling.toObject()));
    } catch (error) {
      logger.error('Erro ao buscar agendamentos por período:', { 
        error, 
        startDate: req.query.startDate, 
        endDate: req.query.endDate 
      });
      res.status(500).json({ error: 'Erro ao buscar agendamentos por período' });
    }
  }

  /**
   * Remove um agendamento
   */
  async deleteScheduling(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Verificar se o agendamento existe
      const scheduling = await this.schedulingRepository.findById(id);
      
      if (!scheduling) {
        res.status(404).json({ error: 'Agendamento não encontrado' });
        return;
      }
      
      // Remover o agendamento
      await this.schedulingRepository.delete(id);
      
      res.status(204).send();
    } catch (error) {
      logger.error('Erro ao remover agendamento:', { error, id: req.params.id });
      res.status(500).json({ error: 'Erro ao remover agendamento' });
    }
  }
} 