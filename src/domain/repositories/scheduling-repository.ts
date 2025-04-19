import { Scheduling, SchedulingStatus, ScheduledService } from '../entities/scheduling.js';
import { TimeSlot } from '../entities/value-objects/time-slot.js';

export interface SchedulingFilter {
  id?: string;
  customerId?: string;
  petId?: string;
  serviceIds?: string[];
  status?: SchedulingStatus;
  startDate?: Date;
  endDate?: Date;
  minTotalPrice?: number;
  maxTotalPrice?: number;
}

export interface SchedulingRepository {
  /**
   * Salva um agendamento (cria ou atualiza)
   * @param scheduling O agendamento a ser salvo
   */
  save(scheduling: Scheduling): Promise<Scheduling>;

  /**
   * Cria um novo agendamento
   * @param scheduling O agendamento a ser criado
   */
  create(
    id: string,
    timeSlot: TimeSlot,
    customerId: string,
    petId: string,
    services: ScheduledService[],
    notes?: string,
    status?: SchedulingStatus
  ): Promise<Scheduling>;

  /**
   * Encontra um agendamento pelo ID
   * @param id O ID do agendamento
   */
  findById(id: string): Promise<Scheduling | null>;

  /**
   * Procura agendamentos que correspondam aos filtros fornecidos
   * @param filter Os filtros para busca de agendamentos
   * @param limit Limite de registros a serem retornados
   * @param offset Deslocamento para paginação
   */
  findAll(filter: SchedulingFilter, limit?: number, offset?: number): Promise<Scheduling[]>;

  /**
   * Encontra agendamentos por período
   * @param startDate Data de início
   * @param endDate Data de fim
   * @param status Status opcional para filtrar
   */
  findByPeriod(startDate: Date, endDate: Date, status?: SchedulingStatus): Promise<Scheduling[]>;

  /**
   * Encontra agendamentos por cliente
   * @param customerId O ID do cliente
   * @param status Status opcional para filtrar
   * @param limit Limite de registros a serem retornados
   */
  findByCustomerId(customerId: string, status?: SchedulingStatus, limit?: number): Promise<Scheduling[]>;

  /**
   * Encontra agendamentos por pet
   * @param petId O ID do pet
   * @param status Status opcional para filtrar
   * @param limit Limite de registros a serem retornados
   */
  findByPetId(petId: string, status?: SchedulingStatus, limit?: number): Promise<Scheduling[]>;

  /**
   * Verifica se há conflito com outros agendamentos no mesmo período
   * @param timeSlot O período de tempo a verificar
   * @param excludeId ID opcional de agendamento a excluir da verificação
   */
  findConflicts(timeSlot: TimeSlot, excludeId?: string): Promise<Scheduling[]>;

  /**
   * Atualiza o status de um agendamento
   * @param id O ID do agendamento
   * @param status O novo status
   */
  updateStatus(id: string, status: SchedulingStatus): Promise<Scheduling>;

  /**
   * Atualiza o período de tempo de um agendamento
   * @param id O ID do agendamento
   * @param timeSlot O novo período de tempo
   */
  updateTimeSlot(id: string, timeSlot: TimeSlot): Promise<Scheduling>;

  /**
   * Adiciona observações a um agendamento
   * @param id O ID do agendamento
   * @param notes As observações
   */
  addNotes(id: string, notes: string): Promise<Scheduling>;

  /**
   * Conta o número total de agendamentos que correspondem aos filtros
   * @param filter Os filtros para contagem de agendamentos
   */
  count(filter: SchedulingFilter): Promise<number>;

  /**
   * Exclui um agendamento pelo ID
   * @param id O ID do agendamento a ser excluído
   */
  delete(id: string): Promise<void>;
} 