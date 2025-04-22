import { TimePeriod } from "./value-objects/time-period.js";

/**
 * Enum que representa o status de um agendamento
 */
export enum AppointmentStatus {
	SCHEDULED = "SCHEDULED", // Agendado
	CONFIRMED = "CONFIRMED", // Confirmado
	CANCELED = "CANCELED", // Cancelado
	COMPLETED = "COMPLETED", // Concluído
	NO_SHOW = "NO_SHOW", // Cliente não compareceu
}

/**
 * Classe que representa um agendamento de serviço
 */
export class Appointment {
	private readonly _id: string;
	private _petId: string;
	private _serviceId: string;
	private _timePeriod: TimePeriod;
	private _notes?: string;
	private _status: AppointmentStatus;
	private readonly _createdAt: Date;
	private _updatedAt: Date;

	private constructor(
		id: string,
		petId: string,
		serviceId: string,
		timePeriod: TimePeriod,
		status: AppointmentStatus,
		notes?: string,
		createdAt?: Date,
		updatedAt?: Date,
	) {
		this._id = id;
		this._petId = petId;
		this._serviceId = serviceId;
		this._timePeriod = timePeriod;
		this._notes = notes;
		this._status = status;
		this._createdAt = createdAt || new Date();
		this._updatedAt = updatedAt || new Date();
	}

	/**
	 * Cria uma nova instância de Appointment
	 */
	public static create(
		id: string,
		petId: string,
		serviceId: string,
		timePeriod: TimePeriod,
		status = AppointmentStatus.SCHEDULED,
		notes?: string,
		createdAt?: Date,
		updatedAt?: Date,
	): Appointment {
		// Validações
		if (!id) {
			throw new Error("Appointment: ID é obrigatório");
		}

		if (!petId) {
			throw new Error("Appointment: ID do pet é obrigatório");
		}

		if (!serviceId) {
			throw new Error("Appointment: ID do serviço é obrigatório");
		}

		if (!timePeriod) {
			throw new Error("Appointment: período de tempo é obrigatório");
		}

		if (!Object.values(AppointmentStatus).includes(status)) {
			throw new Error("Appointment: status inválido");
		}

		return new Appointment(id, petId, serviceId, timePeriod, status, notes, createdAt, updatedAt);
	}

	/**
	 * Atualiza as informações do agendamento
	 */
	public update(
		petId?: string,
		serviceId?: string,
		timePeriod?: TimePeriod,
		notes?: string | null,
	): void {
		if (petId !== undefined && !petId) {
			throw new Error("Appointment: ID do pet não pode ser vazio");
		}

		if (serviceId !== undefined && !serviceId) {
			throw new Error("Appointment: ID do serviço não pode ser vazio");
		}

		if (petId !== undefined) {
			this._petId = petId;
		}

		if (serviceId !== undefined) {
			this._serviceId = serviceId;
		}

		if (timePeriod !== undefined) {
			this._timePeriod = timePeriod;
		}

		if (notes === null) {
			this._notes = undefined;
		} else if (notes !== undefined) {
			this._notes = notes;
		}

		this._updatedAt = new Date();
	}

	/**
	 * Altera o status do agendamento
	 */
	public changeStatus(status: AppointmentStatus): void {
		if (!Object.values(AppointmentStatus).includes(status)) {
			throw new Error("Appointment: status inválido");
		}

		// Validações específicas de transição de status
		if (this._status === AppointmentStatus.CANCELED) {
			throw new Error("Appointment: não é possível alterar um agendamento já cancelado");
		}

		if (this._status === AppointmentStatus.COMPLETED) {
			throw new Error("Appointment: não é possível alterar um agendamento já concluído");
		}

		if (this._status === AppointmentStatus.NO_SHOW && status !== AppointmentStatus.SCHEDULED) {
			throw new Error(
				"Appointment: um agendamento com falta só pode ser remarcado (status SCHEDULED)",
			);
		}

		this._status = status;
		this._updatedAt = new Date();
	}

	/**
	 * Cancela o agendamento
	 */
	public cancel(): void {
		if (this._status === AppointmentStatus.CANCELED) {
			throw new Error("Appointment: agendamento já está cancelado");
		}

		if (this._status === AppointmentStatus.COMPLETED) {
			throw new Error("Appointment: não é possível cancelar um agendamento já concluído");
		}

		this._status = AppointmentStatus.CANCELED;
		this._updatedAt = new Date();
	}

	/**
	 * Confirma o agendamento
	 */
	public confirm(): void {
		if (this._status !== AppointmentStatus.SCHEDULED) {
			throw new Error(
				"Appointment: apenas agendamentos com status SCHEDULED podem ser confirmados",
			);
		}

		this._status = AppointmentStatus.CONFIRMED;
		this._updatedAt = new Date();
	}

	/**
	 * Marca o agendamento como concluído
	 */
	public complete(): void {
		if (
			this._status !== AppointmentStatus.SCHEDULED &&
			this._status !== AppointmentStatus.CONFIRMED
		) {
			throw new Error(
				"Appointment: apenas agendamentos agendados ou confirmados podem ser concluídos",
			);
		}

		this._status = AppointmentStatus.COMPLETED;
		this._updatedAt = new Date();
	}

	/**
	 * Marca o agendamento como no-show (cliente não compareceu)
	 */
	public markAsNoShow(): void {
		if (
			this._status !== AppointmentStatus.SCHEDULED &&
			this._status !== AppointmentStatus.CONFIRMED
		) {
			throw new Error(
				"Appointment: apenas agendamentos agendados ou confirmados podem ser marcados como no-show",
			);
		}

		this._status = AppointmentStatus.NO_SHOW;
		this._updatedAt = new Date();
	}

	/**
	 * Verifica se há conflito com outro agendamento
	 */
	public hasConflictWith(other: Appointment): boolean {
		// Não há conflito se algum deles estiver cancelado
		if (
			this._status === AppointmentStatus.CANCELED ||
			other.status === AppointmentStatus.CANCELED
		) {
			return false;
		}

		return this._timePeriod.overlaps(other.timePeriod);
	}

	/**
	 * Retorna todas as informações do agendamento em formato de objeto
	 */
	public toObject() {
		return {
			id: this._id,
			petId: this._petId,
			serviceId: this._serviceId,
			timePeriod: this._timePeriod.toObject(),
			notes: this._notes,
			status: this._status,
			createdAt: this._createdAt,
			updatedAt: this._updatedAt,
		};
	}

	/**
	 * Compara se dois agendamentos são iguais (pelo ID)
	 */
	public equals(other: Appointment): boolean {
		if (!(other instanceof Appointment)) {
			return false;
		}

		return this._id === other._id;
	}

	// Getters
	get id(): string {
		return this._id;
	}

	get petId(): string {
		return this._petId;
	}

	get serviceId(): string {
		return this._serviceId;
	}

	get timePeriod(): TimePeriod {
		return this._timePeriod;
	}

	get notes(): string | undefined {
		return this._notes;
	}

	get status(): AppointmentStatus {
		return this._status;
	}

	get createdAt(): Date {
		return new Date(this._createdAt);
	}

	get updatedAt(): Date {
		return new Date(this._updatedAt);
	}
}
