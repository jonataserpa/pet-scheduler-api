/**
 * Value Object que representa um período de tempo (início e fim)
 * Value Objects são imutáveis e não possuem identidade
 */
export class TimeSlot {
	private readonly _startTime: Date;
	private readonly _endTime: Date;
	private readonly _durationMinutes: number;

	private constructor(startTime: Date, endTime: Date) {
		this._startTime = startTime;
		this._endTime = endTime;
		this._durationMinutes = this.calculateDurationInMinutes();

		Object.freeze(this);
	}

	/**
	 * Cria uma nova instância de TimeSlot a partir de datas de início e fim
	 */
	public static create(startTime: Date, endTime: Date): TimeSlot {
		// Validações
		if (!(startTime instanceof Date) || isNaN(startTime.getTime())) {
			throw new Error("TimeSlot: data de início inválida");
		}

		if (!(endTime instanceof Date) || isNaN(endTime.getTime())) {
			throw new Error("TimeSlot: data de fim inválida");
		}

		if (startTime >= endTime) {
			throw new Error("TimeSlot: a data de início deve ser anterior à data de fim");
		}

		return new TimeSlot(
			new Date(startTime), // Cria cópias para garantir imutabilidade
			new Date(endTime),
		);
	}

	/**
	 * Cria uma nova instância de TimeSlot a partir de uma data de início e duração em minutos
	 */
	public static createFromDuration(startTime: Date, durationMinutes: number): TimeSlot {
		// Validações
		if (!(startTime instanceof Date) || isNaN(startTime.getTime())) {
			throw new Error("TimeSlot: data de início inválida");
		}

		if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
			throw new Error("TimeSlot: duração deve ser um número inteiro positivo em minutos");
		}

		const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
		return new TimeSlot(
			new Date(startTime), // Cria cópias para garantir imutabilidade
			endTime,
		);
	}

	/**
	 * Cria uma instância de TimeSlot a partir de strings ISO 8601
	 */
	public static createFromISOStrings(startTimeISO: string, endTimeISO: string): TimeSlot {
		const startTime = new Date(startTimeISO);
		const endTime = new Date(endTimeISO);

		return TimeSlot.create(startTime, endTime);
	}

	/**
	 * Calcula a duração do período em minutos
	 */
	private calculateDurationInMinutes(): number {
		return Math.round((this._endTime.getTime() - this._startTime.getTime()) / 60000);
	}

	/**
	 * Verifica se este período tem alguma sobreposição com outro período
	 */
	public overlaps(other: TimeSlot): boolean {
		return (
			(this._startTime < other._endTime && this._endTime > other._startTime) ||
			(other._startTime < this._endTime && other._endTime > this._startTime)
		);
	}

	/**
	 * Verifica se este período contém completamente outro período
	 */
	public contains(other: TimeSlot): boolean {
		return this._startTime <= other._startTime && this._endTime >= other._endTime;
	}

	/**
	 * Verifica se uma data/hora específica está dentro deste período
	 */
	public includesTime(time: Date): boolean {
		return time >= this._startTime && time <= this._endTime;
	}

	/**
	 * Retorna um objeto com os dados do período
	 */
	public toObject(): {
		startTime: Date;
		endTime: Date;
		durationMinutes: number;
	} {
		return {
			startTime: new Date(this._startTime),
			endTime: new Date(this._endTime),
			durationMinutes: this._durationMinutes,
		};
	}

	/**
	 * Serializa o objeto para JSON
	 */
	public toJSON(): string {
		return JSON.stringify({
			startTime: this._startTime.toISOString(),
			endTime: this._endTime.toISOString(),
			durationMinutes: this._durationMinutes,
		});
	}

	/**
	 * Deserializa um JSON para TimeSlot
	 */
	public static fromJSON(json: string): TimeSlot {
		const data = JSON.parse(json);
		return TimeSlot.createFromISOStrings(data.startTime, data.endTime);
	}

	// Getters
	get startTime(): Date {
		return new Date(this._startTime); // Retorna uma cópia para prevenir mutações
	}

	get endTime(): Date {
		return new Date(this._endTime); // Retorna uma cópia para prevenir mutações
	}

	get durationMinutes(): number {
		return this._durationMinutes;
	}

	/**
	 * Formata o período como string
	 */
	public toString(): string {
		const formatDate = (date: Date): string => {
			return date.toLocaleString("pt-BR", {
				day: "2-digit",
				month: "2-digit",
				year: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			});
		};

		return `${formatDate(this._startTime)} até ${formatDate(this._endTime)} (${this._durationMinutes} minutos)`;
	}

	/**
	 * Retorna as datas de início e fim em formato ISO 8601
	 */
	public toISOStrings(): {
		startTimeISO: string;
		endTimeISO: string;
	} {
		return {
			startTimeISO: this._startTime.toISOString(),
			endTimeISO: this._endTime.toISOString(),
		};
	}

	/**
	 * Compara dois períodos por igualdade de valores
	 */
	public equals(other: TimeSlot): boolean {
		if (!(other instanceof TimeSlot)) {
			return false;
		}

		return (
			this._startTime.getTime() === other._startTime.getTime() &&
			this._endTime.getTime() === other._endTime.getTime()
		);
	}
}
