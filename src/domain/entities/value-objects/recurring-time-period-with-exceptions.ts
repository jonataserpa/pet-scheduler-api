import { DayOfWeek, Locale, TimeFormat } from "./time-period.js";
import { RecurringTimePeriod } from "./recurring-time-period.js";

/**
 * Value Object que representa um período de tempo recorrente com exceções para datas específicas
 * Útil para representar horários comerciais com feriados, recessos, etc.
 * Value Objects são imutáveis e não possuem identidade
 */
export class RecurringTimePeriodWithExceptions {
	private readonly _recurringPeriod: RecurringTimePeriod;
	private readonly _exceptions: Date[];

	private constructor(recurringPeriod: RecurringTimePeriod, exceptions: Date[] = []) {
		this._recurringPeriod = recurringPeriod;

		// Normalizar datas para meia-noite para comparar apenas dia/mês/ano
		this._exceptions = exceptions.map((date) => {
			const normalized = new Date(date);
			normalized.setHours(0, 0, 0, 0);
			return normalized;
		});

		Object.freeze(this);
	}

	/**
	 * Cria uma nova instância de RecurringTimePeriodWithExceptions
	 */
	public static create(
		recurringPeriod: RecurringTimePeriod,
		exceptions: Date[] = [],
	): RecurringTimePeriodWithExceptions {
		if (!recurringPeriod) {
			throw new Error("RecurringTimePeriodWithExceptions: período recorrente é obrigatório");
		}

		return new RecurringTimePeriodWithExceptions(recurringPeriod, [...exceptions]);
	}

	/**
	 * Cria uma nova instância a partir de dias da semana, horários e exceções
	 */
	public static createFromDaysOfWeek(
		daysOfWeek: DayOfWeek[],
		startTime: string,
		endTime: string,
		exceptions: Date[] = [],
	): RecurringTimePeriodWithExceptions {
		const recurringPeriod = RecurringTimePeriod.createFromDaysOfWeek(
			daysOfWeek,
			startTime,
			endTime,
		);

		return RecurringTimePeriodWithExceptions.create(recurringPeriod, exceptions);
	}

	/**
	 * Verifica se uma data específica está nas exceções
	 */
	private isExceptionDate(date: Date): boolean {
		const normalized = new Date(date);
		normalized.setHours(0, 0, 0, 0);

		return this._exceptions.some((exception) => exception.getTime() === normalized.getTime());
	}

	/**
	 * Verifica se um determinado Date está dentro dos períodos recorrentes e não é uma exceção
	 */
	public includesDateTime(dateTime: Date): boolean {
		if (!(dateTime instanceof Date) || isNaN(dateTime.getTime())) {
			throw new Error("RecurringTimePeriodWithExceptions: data e hora para verificação inválidas");
		}

		// Verificar primeiro se a data é uma exceção
		if (this.isExceptionDate(dateTime)) {
			return false;
		}

		// Se não for exceção, verifica se está dentro do período recorrente
		return this._recurringPeriod.includesDateTime(dateTime);
	}

	/**
	 * Adiciona uma nova data de exceção e retorna uma nova instância
	 */
	public addException(date: Date): RecurringTimePeriodWithExceptions {
		if (!(date instanceof Date) || isNaN(date.getTime())) {
			throw new Error("RecurringTimePeriodWithExceptions: data de exceção inválida");
		}

		return new RecurringTimePeriodWithExceptions(this._recurringPeriod, [
			...this._exceptions,
			date,
		]);
	}

	/**
	 * Remove uma data de exceção e retorna uma nova instância
	 */
	public removeException(date: Date): RecurringTimePeriodWithExceptions {
		const normalized = new Date(date);
		normalized.setHours(0, 0, 0, 0);

		const newExceptions = this._exceptions.filter(
			(exception) => exception.getTime() !== normalized.getTime(),
		);

		return new RecurringTimePeriodWithExceptions(this._recurringPeriod, newExceptions);
	}

	/**
	 * Limpa todas as exceções e retorna uma nova instância sem exceções
	 */
	public clearExceptions(): RecurringTimePeriodWithExceptions {
		return new RecurringTimePeriodWithExceptions(this._recurringPeriod, []);
	}

	/**
	 * Verifica se este período recorrente tem alguma sobreposição com outro
	 */
	public overlaps(other: RecurringTimePeriodWithExceptions): boolean {
		return this._recurringPeriod.overlaps(other._recurringPeriod);
	}

	/**
	 * Retorna a próxima ocorrência válida do período a partir de uma data
	 */
	public getNextOccurrence(fromDate: Date): Date | null {
		if (!(fromDate instanceof Date) || isNaN(fromDate.getTime())) {
			throw new Error("RecurringTimePeriodWithExceptions: data de início inválida");
		}

		// Verificar até 30 dias no futuro (ajuste conforme necessário)
		const maxDaysToCheck = 30;
		const currentDate = new Date(fromDate);

		for (let i = 0; i < maxDaysToCheck; i++) {
			// Avançar para o próximo dia se já passou do horário de hoje
			if (i > 0 || currentDate.getHours() >= 23) {
				currentDate.setDate(currentDate.getDate() + 1);
				currentDate.setHours(0, 0, 0, 0);
			}

			// Se for um dia da semana incluído no período recorrente
			if (this._recurringPeriod.includesDay(currentDate.getDay() as DayOfWeek)) {
				// E não for uma data de exceção
				if (!this.isExceptionDate(currentDate)) {
					// Verificar os períodos para este dia da semana
					const periodsForDay = this._recurringPeriod.timePeriods.filter(
						(p) => p.dayOfWeek === currentDate.getDay(),
					);

					if (periodsForDay.length > 0) {
						// Usar o startTime do primeiro período
						const [hours, minutes] = periodsForDay[0].startTime.split(":").map(Number);

						const nextOccurrence = new Date(currentDate);
						nextOccurrence.setHours(hours, minutes, 0, 0);

						// Se a data resultante for futura em relação à data de referência
						if (nextOccurrence > fromDate) {
							return nextOccurrence;
						}
					}
				}
			}
		}

		return null; // Nenhuma ocorrência encontrada nos próximos dias
	}

	/**
	 * Retorna um objeto com os dados do período recorrente e suas exceções
	 */
	public toObject(): {
		periods: Array<{
			dayOfWeek: DayOfWeek;
			startTime: string;
			endTime: string;
		}>;
		exceptions: Date[];
	} {
		return {
			periods: this._recurringPeriod.toObject(),
			exceptions: this._exceptions.map((date) => new Date(date)),
		};
	}

	/**
	 * Formata o período recorrente como string, incluindo exceções
	 */
	public toString(locale: Locale = "pt-BR", format: TimeFormat = "24h"): string {
		const recurringText = this._recurringPeriod.toString(locale, format);

		if (this._exceptions.length === 0) {
			return recurringText;
		}

		// Formatar as exceções com base no locale
		const dateFormatter = new Intl.DateTimeFormat(locale, {
			day: "numeric",
			month: "long",
			year: "numeric",
		});

		const exceptionDates = this._exceptions.map((date) => dateFormatter.format(date)).join(", ");

		const exceptionMessages = {
			"pt-BR": `${recurringText} (exceto: ${exceptionDates})`,
			"en-US": `${recurringText} (except: ${exceptionDates})`,
			"es-ES": `${recurringText} (excepto: ${exceptionDates})`,
		};

		return exceptionMessages[locale];
	}

	/**
	 * Compara dois períodos recorrentes com exceções por igualdade de valores
	 */
	public equals(other: RecurringTimePeriodWithExceptions): boolean {
		if (!(other instanceof RecurringTimePeriodWithExceptions)) {
			return false;
		}

		// Verificar se os períodos recorrentes são iguais
		if (!this._recurringPeriod.equals(other._recurringPeriod)) {
			return false;
		}

		// Verificar se têm o mesmo número de exceções
		if (this._exceptions.length !== other._exceptions.length) {
			return false;
		}

		// Normalizar todas as datas para meia-noite para comparação
		const thisExceptions = this._exceptions.map((d) => d.getTime());
		const otherExceptions = other._exceptions.map((d) => d.getTime());

		// Verificar se todas as exceções desta instância existem na outra
		return thisExceptions.every((time) => otherExceptions.includes(time));
	}

	// Getters
	get recurringPeriod(): RecurringTimePeriod {
		return this._recurringPeriod;
	}

	get exceptions(): Date[] {
		return this._exceptions.map((date) => new Date(date)); // Cópias para evitar mutação
	}
}
