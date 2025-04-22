/**
 * Value Object que representa um valor monetário (dinheiro)
 * Value Objects são imutáveis e não possuem identidade
 */
export class Money {
	private readonly _amount: number;
	private readonly _currency: string;

	private constructor(amount: number, currency: string = "BRL") {
		// Arredonda para 2 casas decimais para evitar problemas de ponto flutuante
		this._amount = Math.round(amount * 100) / 100;
		this._currency = currency;

		Object.freeze(this);
	}

	/**
	 * Cria uma nova instância de Money a partir de um valor
	 */
	public static create(amount: number, currency: string = "BRL"): Money {
		if (isNaN(amount)) {
			throw new Error("Money: valor deve ser um número válido");
		}

		if (amount < 0) {
			throw new Error("Money: valor não pode ser negativo");
		}

		if (!currency || currency.trim().length === 0) {
			throw new Error("Money: moeda é obrigatória");
		}

		return new Money(amount, currency);
	}

	/**
	 * Cria uma instância de Money com valor zero
	 */
	public static zero(currency: string = "BRL"): Money {
		return new Money(0, currency);
	}

	/**
	 * Cria uma instância de Money a partir de centavos
	 */
	public static fromCents(cents: number, currency: string = "BRL"): Money {
		if (isNaN(cents)) {
			throw new Error("Money: valor em centavos deve ser um número válido");
		}

		if (cents < 0) {
			throw new Error("Money: valor em centavos não pode ser negativo");
		}

		return new Money(cents / 100, currency);
	}

	/**
	 * Adiciona um valor e retorna uma nova instância de Money
	 */
	public add(other: Money): Money {
		this.ensureSameCurrency(other);
		return new Money(this._amount + other._amount, this._currency);
	}

	/**
	 * Subtrai um valor e retorna uma nova instância de Money
	 */
	public subtract(other: Money): Money {
		this.ensureSameCurrency(other);
		const result = this._amount - other._amount;

		if (result < 0) {
			throw new Error("Money: resultado da subtração não pode ser negativo");
		}

		return new Money(result, this._currency);
	}

	/**
	 * Multiplica por um fator e retorna uma nova instância de Money
	 */
	public multiply(factor: number): Money {
		if (isNaN(factor)) {
			throw new Error("Money: fator de multiplicação deve ser um número válido");
		}

		if (factor < 0) {
			throw new Error("Money: fator de multiplicação não pode ser negativo");
		}

		return new Money(this._amount * factor, this._currency);
	}

	/**
	 * Verifica se um valor é maior que outro
	 */
	public isGreaterThan(other: Money): boolean {
		this.ensureSameCurrency(other);
		return this._amount > other._amount;
	}

	/**
	 * Verifica se um valor é menor que outro
	 */
	public isLessThan(other: Money): boolean {
		this.ensureSameCurrency(other);
		return this._amount < other._amount;
	}

	/**
	 * Verifica se um valor é igual a outro
	 */
	public isEqualTo(other: Money): boolean {
		return this.equals(other);
	}

	/**
	 * Verifica se um valor é zero
	 */
	public isZero(): boolean {
		return this._amount === 0;
	}

	/**
	 * Valida que duas instâncias de Money usam a mesma moeda
	 */
	private ensureSameCurrency(other: Money): void {
		if (this._currency !== other._currency) {
			throw new Error(
				`Money: não é possível operar com moedas diferentes (${this._currency} e ${other._currency})`,
			);
		}
	}

	/**
	 * Retorna o valor em centavos
	 */
	public getCents(): number {
		return Math.round(this._amount * 100);
	}

	/**
	 * Formata o valor monetário de acordo com a localidade
	 */
	public format(locale: string = "pt-BR"): string {
		return new Intl.NumberFormat(locale, {
			style: "currency",
			currency: this._currency,
		}).format(this._amount);
	}

	/**
	 * Retorna um objeto com os dados do valor monetário
	 */
	public toObject(): {
		amount: number;
		currency: string;
		formatted: string;
		cents: number;
	} {
		return {
			amount: this._amount,
			currency: this._currency,
			formatted: this.format(),
			cents: this.getCents(),
		};
	}

	/**
	 * Serializa o objeto para JSON
	 */
	public toJSON(): string {
		return JSON.stringify(this.toObject());
	}

	/**
	 * Deserializa um JSON para Money
	 */
	public static fromJSON(json: string): Money {
		const data = JSON.parse(json);
		return Money.create(data.amount, data.currency);
	}

	/**
	 * Compara dois valores monetários por igualdade
	 */
	public equals(other: Money): boolean {
		if (!(other instanceof Money)) {
			return false;
		}

		return this._amount === other._amount && this._currency === other._currency;
	}

	// Getters
	get amount(): number {
		return this._amount;
	}

	get currency(): string {
		return this._currency;
	}
}
