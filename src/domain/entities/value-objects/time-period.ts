/**
 * Enumeração para os dias da semana
 */
export enum DayOfWeek {
	SUNDAY = 0,
	MONDAY = 1,
	TUESDAY = 2,
	WEDNESDAY = 3,
	THURSDAY = 4,
	FRIDAY = 5,
	SATURDAY = 6,
}

/**
 * Tipo que representa formatos de exibição de hora
 */
export type TimeFormat = "12h" | "24h";

/**
 * Tipo que representa idiomas suportados
 */
export type Locale = "pt-BR" | "en-US" | "es-ES";

/**
 * Mapeamento de idiomas para nomes de dias da semana
 */
const DAY_NAMES: Record<Locale, string[]> = {
	"pt-BR": [
		"Domingo",
		"Segunda-feira",
		"Terça-feira",
		"Quarta-feira",
		"Quinta-feira",
		"Sexta-feira",
		"Sábado",
	],
	"en-US": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
	"es-ES": ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
};

/**
 * Value Object para representar um período de tempo em um dia da semana
 */
export class TimePeriod {
	private readonly _dayOfWeek: DayOfWeek;
	private readonly _startTime: string;
	private readonly _endTime: string;

	private constructor(dayOfWeek: DayOfWeek, startTime: string, endTime: string) {
		this._dayOfWeek = dayOfWeek;
		this._startTime = startTime;
		this._endTime = endTime;

		Object.freeze(this);
	}

	/**
	 * Cria uma instância de TimePeriod após validação
	 */
	public static create(dayOfWeek: DayOfWeek, startTime: string, endTime: string): TimePeriod {
		// Validar dia da semana
		if (dayOfWeek < 0 || dayOfWeek > 6 || !Number.isInteger(dayOfWeek)) {
			throw new Error("TimePeriod: dia da semana inválido");
		}

		// Validar formato de hora (HH:MM)
		const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
		if (!timeRegex.test(startTime)) {
			throw new Error("TimePeriod: formato de hora inválido");
		}

		if (!timeRegex.test(endTime)) {
			throw new Error("TimePeriod: formato de hora inválido");
		}

		// Validar que a hora inicial é anterior à hora final
		if (TimePeriod.compareTime(startTime, endTime) >= 0) {
			throw new Error("TimePeriod: a hora de início deve ser anterior à hora de fim");
		}

		return new TimePeriod(dayOfWeek, startTime, endTime);
	}

	/**
	 * Compara dois horários no formato HH:MM
	 * Retorna negativo se t1 < t2, 0 se t1 = t2, positivo se t1 > t2
	 */
	private static compareTime(t1: string, t2: string): number {
		const [h1, m1] = t1.split(":").map((n) => parseInt(n));
		const [h2, m2] = t2.split(":").map((n) => parseInt(n));

		if (h1 !== h2) {
			return h1 - h2;
		}

		return m1 - m2;
	}

	/**
	 * Verifica se um horário específico está dentro do período
	 */
	public includesTime(time: string): boolean {
		// Validar formato de hora
		const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
		if (!timeRegex.test(time)) {
			throw new Error("TimePeriod: formato de hora inválido");
		}

		return (
			TimePeriod.compareTime(time, this._startTime) >= 0 &&
			TimePeriod.compareTime(time, this._endTime) <= 0
		);
	}

	/**
	 * Verifica se uma data/hora específica está dentro do período
	 */
	public includesDateTime(dateTime: Date): boolean {
		// Verificar se é o mesmo dia da semana
		if (dateTime.getDay() !== this._dayOfWeek) {
			return false;
		}

		// Obter o horário da data
		const hours = dateTime.getHours().toString().padStart(2, "0");
		const minutes = dateTime.getMinutes().toString().padStart(2, "0");
		const time = `${hours}:${minutes}`;

		return this.includesTime(time);
	}

	/**
	 * Verifica se há sobreposição com outro período
	 */
	public overlaps(other: TimePeriod): boolean {
		// Se são dias diferentes, não há sobreposição
		if (this._dayOfWeek !== other.dayOfWeek) {
			return false;
		}

		// Verifica se há sobreposição de horários
		return (
			TimePeriod.compareTime(this._startTime, other.endTime) < 0 &&
			TimePeriod.compareTime(this._endTime, other.startTime) > 0
		);
	}

	/**
	 * Calcula a duração do período em minutos
	 */
	public getDurationInMinutes(): number {
		const [startHours, startMinutes] = this._startTime.split(":").map((n) => parseInt(n));
		const [endHours, endMinutes] = this._endTime.split(":").map((n) => parseInt(n));

		return endHours * 60 + endMinutes - (startHours * 60 + startMinutes);
	}

	/**
	 * Formata o período para exibição
	 */
	public toString(locale: string = "pt-BR", format: "24h" | "12h" = "24h"): string {
		let dayName = "";

		// Formatação do dia da semana
		if (locale === "pt-BR") {
			dayName = DAY_NAMES["pt-BR"][this._dayOfWeek];
		} else if (locale === "en-US") {
			dayName = DAY_NAMES["en-US"][this._dayOfWeek];
		} else if (locale === "es-ES") {
			dayName = DAY_NAMES["es-ES"][this._dayOfWeek];
		} else {
			// Fallback para inglês caso o locale não seja suportado
			dayName = DAY_NAMES["en-US"][this._dayOfWeek];
		}

		// Formatação da hora
		let startTimeFormatted = this._startTime;
		let endTimeFormatted = this._endTime;

		if (format === "12h") {
			startTimeFormatted = this.formatTo12Hour(this._startTime);
			endTimeFormatted = this.formatTo12Hour(this._endTime);
		}

		// Conector
		const connector = locale === "pt-BR" ? "até" : "to";

		return `${dayName}, ${startTimeFormatted} ${connector} ${endTimeFormatted}`;
	}

	/**
	 * Converte hora do formato 24h para 12h
	 */
	private formatTo12Hour(time: string): string {
		const [hours, minutes] = time.split(":").map((n) => parseInt(n));
		const period = hours >= 12 ? "PM" : "AM";
		const hour12 = hours % 12 || 12;
		return `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`;
	}

	/**
	 * Verifica se dois períodos são iguais
	 */
	public equals(other: TimePeriod): boolean {
		if (!(other instanceof TimePeriod)) {
			return false;
		}

		return (
			this._dayOfWeek === other.dayOfWeek &&
			this._startTime === other.startTime &&
			this._endTime === other.endTime
		);
	}

	/**
	 * Converte para objeto simples
	 */
	public toObject(): { dayOfWeek: DayOfWeek; startTime: string; endTime: string } {
		return {
			dayOfWeek: this._dayOfWeek,
			startTime: this._startTime,
			endTime: this._endTime,
		};
	}

	/**
	 * Serializa o objeto para JSON
	 */
	public toJSON(): string {
		return JSON.stringify(this.toObject());
	}

	/**
	 * Cria uma instância a partir de um objeto JSON
	 */
	public static fromJSON(json: string): TimePeriod {
		const data = JSON.parse(json);
		return TimePeriod.create(data.dayOfWeek, data.startTime, data.endTime);
	}

	// Getters
	get dayOfWeek(): DayOfWeek {
		return this._dayOfWeek;
	}

	get startTime(): string {
		return this._startTime;
	}

	get endTime(): string {
		return this._endTime;
	}
}
