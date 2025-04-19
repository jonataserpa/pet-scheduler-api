import { TimeSlot } from './value-objects/time-slot.js';

/**
 * Enum que representa o status de um agendamento
 */
export enum SchedulingStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

/**
 * Classe auxiliar para representar um serviço agendado
 */
export class ScheduledService {
  private readonly _id: string;
  private readonly _serviceId: string;
  private readonly _serviceName: string;
  private readonly _price: number;
  private readonly _duration: number;

  constructor(
    id: string,
    serviceId: string,
    serviceName: string,
    price: number,
    duration: number,
  ) {
    this._id = id;
    this._serviceId = serviceId;
    this._serviceName = serviceName;
    this._price = price;
    this._duration = duration;
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get serviceId(): string {
    return this._serviceId;
  }

  get serviceName(): string {
    return this._serviceName;
  }

  get price(): number {
    return this._price;
  }

  get duration(): number {
    return this._duration;
  }

  /**
   * Retorna um objeto com os dados do serviço agendado
   */
  public toObject(): {
    id: string;
    serviceId: string;
    serviceName: string;
    price: number;
    duration: number;
  } {
    return {
      id: this._id,
      serviceId: this._serviceId,
      serviceName: this._serviceName,
      price: this._price,
      duration: this._duration,
    };
  }
}

/**
 * Entidade que representa um agendamento no sistema
 */
export class Scheduling {
  private readonly _id: string;
  private _timeSlot: TimeSlot;
  private _status: SchedulingStatus;
  private _totalPrice: number;
  private _notes?: string;
  private readonly _customerId: string;
  private readonly _petId: string;
  private _services: ScheduledService[];
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    id: string,
    timeSlot: TimeSlot,
    status: SchedulingStatus,
    totalPrice: number,
    customerId: string,
    petId: string,
    services: ScheduledService[],
    notes?: string,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    this._id = id;
    this._timeSlot = timeSlot;
    this._status = status;
    this._totalPrice = totalPrice;
    this._customerId = customerId;
    this._petId = petId;
    this._services = [...services]; // Cria uma cópia do array para evitar mutações externas
    this._notes = notes;
    this._createdAt = createdAt || new Date();
    this._updatedAt = updatedAt || new Date();
  }

  /**
   * Cria uma nova instância de Scheduling
   */
  public static create(
    id: string,
    timeSlot: TimeSlot,
    customerId: string,
    petId: string,
    services: ScheduledService[],
    notes?: string,
    status: SchedulingStatus = SchedulingStatus.SCHEDULED,
    createdAt?: Date,
    updatedAt?: Date,
  ): Scheduling {
    // Validações
    if (!id) {
      throw new Error('Scheduling: ID é obrigatório');
    }

    if (!(timeSlot instanceof TimeSlot)) {
      throw new Error('Scheduling: time slot inválido');
    }

    if (!customerId) {
      throw new Error('Scheduling: ID do cliente é obrigatório');
    }

    if (!petId) {
      throw new Error('Scheduling: ID do pet é obrigatório');
    }

    if (!Array.isArray(services) || services.length === 0) {
      throw new Error('Scheduling: pelo menos um serviço deve ser especificado');
    }

    // Valida o status
    if (!Object.values(SchedulingStatus).includes(status)) {
      throw new Error(`Scheduling: status inválido: ${status}. Deve ser um dos valores: ${Object.values(SchedulingStatus).join(', ')}`);
    }

    // Calcula o preço total
    const totalPrice = services.reduce((sum, service) => sum + service.price, 0);

    return new Scheduling(
      id,
      timeSlot,
      status,
      totalPrice,
      customerId,
      petId,
      services,
      notes?.trim(),
      createdAt,
      updatedAt,
    );
  }

  /**
   * Atualiza o time slot (período) do agendamento
   */
  public updateTimeSlot(timeSlot: TimeSlot): void {
    if (this._status === SchedulingStatus.COMPLETED || 
        this._status === SchedulingStatus.CANCELLED || 
        this._status === SchedulingStatus.NO_SHOW) {
      throw new Error(`Scheduling: não é possível alterar o período de um agendamento com status ${this._status}`);
    }

    this._timeSlot = timeSlot;
    this._updatedAt = new Date();
  }

  /**
   * Atualiza o status do agendamento
   */
  public updateStatus(status: SchedulingStatus): void {
    if (!Object.values(SchedulingStatus).includes(status)) {
      throw new Error(`Scheduling: status inválido: ${status}. Deve ser um dos valores: ${Object.values(SchedulingStatus).join(', ')}`);
    }

    // Valida transições de status permitidas
    if (this._status === SchedulingStatus.COMPLETED && 
        status !== SchedulingStatus.COMPLETED) {
      throw new Error('Scheduling: não é possível alterar o status de um agendamento já completado');
    }

    if (this._status === SchedulingStatus.CANCELLED && 
        status !== SchedulingStatus.CANCELLED) {
      throw new Error('Scheduling: não é possível alterar o status de um agendamento já cancelado');
    }

    if (this._status === SchedulingStatus.NO_SHOW && 
        status !== SchedulingStatus.NO_SHOW && 
        status !== SchedulingStatus.SCHEDULED) {
      throw new Error('Scheduling: não é possível alterar o status de um agendamento com no-show, exceto para reagendar');
    }

    this._status = status;
    this._updatedAt = new Date();
  }

  /**
   * Adiciona observações ao agendamento
   */
  public addNotes(notes: string): void {
    this._notes = notes.trim();
    this._updatedAt = new Date();
  }

  /**
   * Cancela o agendamento
   */
  public cancel(): void {
    if (this._status === SchedulingStatus.COMPLETED) {
      throw new Error('Scheduling: não é possível cancelar um agendamento já completado');
    }

    if (this._status === SchedulingStatus.CANCELLED) {
      throw new Error('Scheduling: agendamento já está cancelado');
    }

    this._status = SchedulingStatus.CANCELLED;
    this._updatedAt = new Date();
  }

  /**
   * Confirma o agendamento
   */
  public confirm(): void {
    if (this._status !== SchedulingStatus.SCHEDULED) {
      throw new Error(`Scheduling: não é possível confirmar um agendamento com status ${this._status}`);
    }

    this._status = SchedulingStatus.CONFIRMED;
    this._updatedAt = new Date();
  }

  /**
   * Marca o agendamento como em andamento
   */
  public markAsInProgress(): void {
    if (this._status !== SchedulingStatus.CONFIRMED && 
        this._status !== SchedulingStatus.SCHEDULED) {
      throw new Error(`Scheduling: não é possível marcar como em andamento um agendamento com status ${this._status}`);
    }

    this._status = SchedulingStatus.IN_PROGRESS;
    this._updatedAt = new Date();
  }

  /**
   * Marca o agendamento como completo
   */
  public complete(): void {
    if (this._status !== SchedulingStatus.IN_PROGRESS) {
      throw new Error(`Scheduling: não é possível completar um agendamento com status ${this._status}`);
    }

    this._status = SchedulingStatus.COMPLETED;
    this._updatedAt = new Date();
  }

  /**
   * Marca o agendamento como não comparecimento (no-show)
   */
  public markAsNoShow(): void {
    if (this._status !== SchedulingStatus.SCHEDULED &&
        this._status !== SchedulingStatus.CONFIRMED) {
      throw new Error(`Scheduling: não é possível marcar como no-show um agendamento com status ${this._status}`);
    }

    this._status = SchedulingStatus.NO_SHOW;
    this._updatedAt = new Date();
  }

  /**
   * Atualiza os serviços do agendamento
   */
  public updateServices(services: ScheduledService[]): void {
    if (this._status === SchedulingStatus.COMPLETED || 
        this._status === SchedulingStatus.CANCELLED || 
        this._status === SchedulingStatus.NO_SHOW) {
      throw new Error(`Scheduling: não é possível alterar os serviços de um agendamento com status ${this._status}`);
    }

    if (!Array.isArray(services) || services.length === 0) {
      throw new Error('Scheduling: pelo menos um serviço deve ser especificado');
    }

    this._services = [...services];
    
    // Recalcula o preço total
    this._totalPrice = services.reduce((sum, service) => sum + service.price, 0);
    
    this._updatedAt = new Date();
  }

  /**
   * Verifica se o agendamento tem conflito com outro agendamento
   */
  public hasConflictWith(other: Scheduling): boolean {
    return this._timeSlot.overlaps(other._timeSlot);
  }

  /**
   * Retorna a duração total do agendamento em minutos
   */
  public getTotalDuration(): number {
    // Se o agendamento já tem uma duração definida no TimeSlot, usa ela
    return this._timeSlot.durationMinutes;
  }

  /**
   * Retorna um objeto com os dados do agendamento
   */
  public toObject(): {
    id: string;
    startTime: Date;
    endTime: Date;
    status: SchedulingStatus;
    totalPrice: number;
    notes?: string;
    customerId: string;
    petId: string;
    services: Array<ReturnType<ScheduledService['toObject']>>;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this._id,
      startTime: this._timeSlot.startTime,
      endTime: this._timeSlot.endTime,
      status: this._status,
      totalPrice: this._totalPrice,
      notes: this._notes,
      customerId: this._customerId,
      petId: this._petId,
      services: this._services.map(service => service.toObject()),
      createdAt: new Date(this._createdAt),
      updatedAt: new Date(this._updatedAt),
    };
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get timeSlot(): TimeSlot {
    return this._timeSlot;
  }

  get startTime(): Date {
    return this._timeSlot.startTime;
  }

  get endTime(): Date {
    return this._timeSlot.endTime;
  }

  get status(): SchedulingStatus {
    return this._status;
  }

  get totalPrice(): number {
    return this._totalPrice;
  }

  get notes(): string | undefined {
    return this._notes;
  }

  get customerId(): string {
    return this._customerId;
  }

  get petId(): string {
    return this._petId;
  }

  get services(): ScheduledService[] {
    return [...this._services]; // Retorna uma cópia para evitar mutações externas
  }

  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }

  /**
   * Compara dois agendamentos por igualdade de ID
   */
  public equals(other: Scheduling): boolean {
    if (!(other instanceof Scheduling)) {
      return false;
    }

    return this._id === other._id;
  }
} 