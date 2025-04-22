/**
 * Classe Value Object para representar um endereço
 */
export class Address {
	private readonly _street: string;
	private readonly _number: string;
	private readonly _complement?: string;
	private readonly _neighborhood: string;
	private readonly _city: string;
	private readonly _state: string;
	private readonly _zipCode: string;
	private readonly _country: string;

	private constructor(
		street: string,
		number: string,
		neighborhood: string,
		city: string,
		state: string,
		zipCode: string,
		country: string,
		complement?: string,
	) {
		this._street = street;
		this._number = number;
		this._complement = complement;
		this._neighborhood = neighborhood;
		this._city = city;
		this._state = state;
		this._zipCode = zipCode;
		this._country = country;
	}

	/**
	 * Cria uma instância de Address após validação
	 */
	public static create(
		street: string,
		number: string,
		neighborhood: string,
		city: string,
		state: string,
		zipCode: string,
		country: string = "Brasil",
		complement?: string,
	): Address {
		// Validações
		if (!street || street.trim().length === 0) {
			throw new Error("Endereço: rua é obrigatória");
		}

		if (!number || number.trim().length === 0) {
			throw new Error("Endereço: número é obrigatório");
		}

		if (!neighborhood || neighborhood.trim().length === 0) {
			throw new Error("Endereço: bairro é obrigatório");
		}

		if (!city || city.trim().length === 0) {
			throw new Error("Endereço: cidade é obrigatória");
		}

		if (!state || state.trim().length === 0) {
			throw new Error("Endereço: estado é obrigatório");
		}

		if (!zipCode || zipCode.trim().length === 0) {
			throw new Error("Endereço: CEP é obrigatório");
		}

		if (!country || country.trim().length === 0) {
			throw new Error("Endereço: país é obrigatório");
		}

		// Sanitização do CEP (remove caracteres não numéricos)
		const cleanZipCode = zipCode.replace(/\D/g, "");

		// Validação específica para CEP brasileiro (8 dígitos)
		if (country.toLowerCase() === "brasil" && cleanZipCode.length !== 8) {
			throw new Error("Endereço: CEP inválido");
		}

		return new Address(
			street.trim(),
			number.trim(),
			neighborhood.trim(),
			city.trim(),
			state.trim(),
			cleanZipCode,
			country.trim(),
			complement?.trim(),
		);
	}

	/**
	 * Retorna o endereço formatado em uma linha
	 */
	public getFormattedLine(): string {
		const address = [
			`${this._street}, ${this._number}`,
			this._complement,
			this._neighborhood,
			`${this._city} - ${this._state}`,
			this.formatZipCode(),
			this._country !== "Brasil" ? this._country : undefined,
		].filter(Boolean);

		return address.join(", ");
	}

	/**
	 * Retorna a representação em string do endereço
	 */
	public toString(): string {
		return this.getFormattedLine();
	}

	/**
	 * Formata o CEP
	 */
	public formatZipCode(): string {
		if (this._country.toLowerCase() === "brasil") {
			return `${this._zipCode.substring(0, 5)}-${this._zipCode.substring(5)}`;
		}
		return this._zipCode;
	}

	/**
	 * Verifica se dois endereços são iguais
	 */
	public equals(other: Address): boolean {
		if (!(other instanceof Address)) {
			return false;
		}

		return (
			this._street === other.street &&
			this._number === other.number &&
			this._complement === other.complement &&
			this._neighborhood === other.neighborhood &&
			this._city === other.city &&
			this._state === other.state &&
			this._zipCode === other.zipCode &&
			this._country === other.country
		);
	}

	/**
	 * Retorna uma cópia do objeto com um campo alterado
	 */
	public withStreet(street: string): Address {
		return Address.create(
			street,
			this._number,
			this._neighborhood,
			this._city,
			this._state,
			this._zipCode,
			this._country,
			this._complement,
		);
	}

	/**
	 * Retorna uma cópia do objeto com um campo alterado
	 */
	public withNumber(number: string): Address {
		return Address.create(
			this._street,
			number,
			this._neighborhood,
			this._city,
			this._state,
			this._zipCode,
			this._country,
			this._complement,
		);
	}

	/**
	 * Retorna uma representação em objeto do endereço
	 */
	public toObject(): {
		street: string;
		number: string;
		complement?: string;
		neighborhood: string;
		city: string;
		state: string;
		zipCode: string;
		country: string;
	} {
		return {
			street: this._street,
			number: this._number,
			complement: this._complement,
			neighborhood: this._neighborhood,
			city: this._city,
			state: this._state,
			zipCode: this._zipCode,
			country: this._country,
		};
	}

	/**
	 * Retorna uma representação em JSON do endereço
	 */
	public toJSON(): string {
		return JSON.stringify(this.toObject());
	}

	/**
	 * Cria uma instância a partir de uma representação em JSON
	 */
	public static fromJSON(json: string): Address {
		const data = JSON.parse(json);
		return Address.create(
			data.street,
			data.number,
			data.neighborhood,
			data.city,
			data.state,
			data.zipCode,
			data.country,
			data.complement,
		);
	}

	// Getters
	get street(): string {
		return this._street;
	}

	get number(): string {
		return this._number;
	}

	get complement(): string | undefined {
		return this._complement;
	}

	get neighborhood(): string {
		return this._neighborhood;
	}

	get city(): string {
		return this._city;
	}

	get state(): string {
		return this._state;
	}

	get zipCode(): string {
		return this._zipCode;
	}

	get country(): string {
		return this._country;
	}
}
