import { DayOfWeek, Locale, TimeFormat, TimePeriod } from "./time-period.js";

/**
 * Value Object que representa um período de tempo recorrente em múltiplos dias da semana
 * Útil para representar horários comerciais, disponibilidade semanal, etc.
 * Value Objects são imutáveis e não possuem identidade
 */
export class RecurringTimePeriod {
	private readonly _timePeriods: TimePeriod[];

	private constructor(timePeriods: TimePeriod[]) {
		this._timePeriods = timePeriods;
		Object.freeze(this);
	}

	/**
	 * Cria uma nova instância de RecurringTimePeriod a partir de múltiplos períodos
	 */
	public static create(timePeriods: TimePeriod[]): RecurringTimePeriod {
		if (!timePeriods || timePeriods.length === 0) {
			throw new Error("RecurringTimePeriod: deve haver pelo menos um período de tempo");
		}

		return new RecurringTimePeriod([...timePeriods]);
	}

	/**
	 * Cria uma nova instância de RecurringTimePeriod a partir de uma lista de dias da semana com o mesmo horário
	 */
	public static createFromDaysOfWeek(
		daysOfWeek: DayOfWeek[],
		startTime: string,
		endTime: string,
	): RecurringTimePeriod {
		if (!daysOfWeek || daysOfWeek.length === 0) {
			throw new Error("RecurringTimePeriod: deve haver pelo menos um dia da semana");
		}

		// Remover dias duplicados
		const uniqueDays = [...new Set(daysOfWeek)];

		// Criar um TimePeriod para cada dia da semana
		const timePeriods = uniqueDays.map((day) => TimePeriod.create(day, startTime, endTime));

		return new RecurringTimePeriod(timePeriods);
	}

	/**
	 * Verifica se um determinado Date está dentro de algum dos períodos recorrentes
	 */
	public includesDateTime(dateTime: Date): boolean {
		if (!(dateTime instanceof Date) || isNaN(dateTime.getTime())) {
			throw new Error("RecurringTimePeriod: data e hora para verificação inválidas");
		}

		return this._timePeriods.some((period) => period.includesDateTime(dateTime));
	}

	/**
	 * Verifica se um horário específico está dentro de algum dos períodos para o dia da semana informado
	 */
	public includesTimeOnDay(time: string, dayOfWeek: DayOfWeek): boolean {
		const periodForDay = this._timePeriods.find((p) => p.dayOfWeek === dayOfWeek);

		if (!periodForDay) {
			return false;
		}

		return periodForDay.includesTime(time);
	}

	/**
	 * Verifica se este período recorrente tem alguma sobreposição com outro período recorrente
	 */
	public overlaps(other: RecurringTimePeriod): boolean {
		return this._timePeriods.some((thisPeriod) =>
			other._timePeriods.some((otherPeriod) => thisPeriod.overlaps(otherPeriod)),
		);
	}

	/**
	 * Retorna um novo RecurringTimePeriod sem os dias especificados
	 */
	public excludeDays(daysToExclude: DayOfWeek[]): RecurringTimePeriod {
		const filteredPeriods = this._timePeriods.filter(
			(period) => !daysToExclude.includes(period.dayOfWeek),
		);

		if (filteredPeriods.length === 0) {
			throw new Error("RecurringTimePeriod: não é possível excluir todos os dias");
		}

		return new RecurringTimePeriod(filteredPeriods);
	}

	/**
	 * Verifica se este período recorrente inclui um determinado dia da semana
	 */
	public includesDay(dayOfWeek: DayOfWeek): boolean {
		return this._timePeriods.some((period) => period.dayOfWeek === dayOfWeek);
	}

	/**
	 * Retorna todos os dias da semana que fazem parte deste período recorrente
	 */
	public getDaysOfWeek(): DayOfWeek[] {
		return this._timePeriods.map((period) => period.dayOfWeek).sort();
	}

	/**
	 * Retorna a duração do período em minutos (considerando que todos os períodos têm a mesma duração)
	 * Se houver períodos com durações diferentes, retorna a duração do primeiro período
	 */
	public getDurationInMinutes(): number {
		if (this._timePeriods.length === 0) {
			return 0;
		}

		return this._timePeriods[0].getDurationInMinutes();
	}

	/**
	 * Retorna um array com os objetos dos períodos
	 */
	public toObject(): Array<{
		dayOfWeek: DayOfWeek;
		startTime: string;
		endTime: string;
	}> {
		return this._timePeriods.map((period) => period.toObject());
	}

	/**
	 * Formata o período recorrente como string
	 * @param locale Idioma para exibição
	 * @param format Formato de hora
	 */
	public toString(locale: Locale = "pt-BR", format: TimeFormat = "24h"): string {
		if (this._timePeriods.length === 0) {
			return "";
		}

		// Se todos os períodos têm o mesmo horário, mas dias diferentes
		const firstPeriod = this._timePeriods[0];
		const allSameTime = this._timePeriods.every(
			(period) =>
				period.startTime === firstPeriod.startTime && period.endTime === firstPeriod.endTime,
		);

		if (allSameTime) {
			const days = this.getDaysOfWeek().map((day) => {
				// Encontrar o período para este dia
				const period = this._timePeriods.find((p) => p.dayOfWeek === day)!;
				return period.toString(locale, format).split(",")[0]; // Extrair apenas o nome do dia
			});

			// Juntar os dias com vírgulas e adicionar o horário do primeiro período
			let daysText = "";

			if (locale === "pt-BR") {
				const lastDay = days.pop();
				daysText = days.length ? `${days.join(", ")} e ${lastDay}` : lastDay!;
				return `${daysText}, das ${this.formatTime(firstPeriod.startTime, format)} às ${this.formatTime(firstPeriod.endTime, format)}`;
			} else if (locale === "en-US") {
				const lastDay = days.pop();
				daysText = days.length ? `${days.join(", ")} and ${lastDay}` : lastDay!;
				return `${daysText}, from ${this.formatTime(firstPeriod.startTime, format)} to ${this.formatTime(firstPeriod.endTime, format)}`;
			} else if (locale === "es-ES") {
				const lastDay = days.pop();
				daysText = days.length ? `${days.join(", ")} y ${lastDay}` : lastDay!;
				return `${daysText}, de ${this.formatTime(firstPeriod.startTime, format)} a ${this.formatTime(firstPeriod.endTime, format)}`;
			}
		}

		// Caso contrário, listar cada período separadamente
		return this._timePeriods.map((period) => period.toString(locale, format)).join("; ");
	}

	/**
	 * Formata a hora no formato especificado
	 */
	private formatTime(time: string, format: TimeFormat): string {
		if (format === "24h") {
			return time;
		}

		// Converter para formato 12h
		const [hours, minutes] = time.split(":").map(Number);
		const period = hours >= 12 ? "PM" : "AM";
		const hours12 = hours % 12 || 12; // Converte 0 para 12

		return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
	}

	/**
	 * Compara dois períodos recorrentes por igualdade de valores
	 */
	public equals(other: RecurringTimePeriod): boolean {
		if (!(other instanceof RecurringTimePeriod)) {
			return false;
		}

		if (this._timePeriods.length !== other._timePeriods.length) {
			return false;
		}

		// Ordenar períodos por dia da semana para comparação consistente
		const thisSorted = [...this._timePeriods].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
		const otherSorted = [...other._timePeriods].sort((a, b) => a.dayOfWeek - b.dayOfWeek);

		return thisSorted.every((period, index) => period.equals(otherSorted[index]));
	}

	// Getters
	get timePeriods(): TimePeriod[] {
		return [...this._timePeriods];
	}
}
