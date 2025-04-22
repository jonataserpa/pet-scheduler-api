/**
 * Value Object que representa um documento brasileiro (CPF/CNPJ)
 * Value Objects são imutáveis e não possuem identidade
 */
export enum DocumentType {
	CPF = "CPF",
	CNPJ = "CNPJ",
}

export class DocumentNumber {
	private readonly _value: string;
	private readonly _type: DocumentType;

	private constructor(value: string, type: DocumentType) {
		this._value = value;
		this._type = type;

		Object.freeze(this);
	}

	/**
	 * Cria uma nova instância de DocumentNumber a partir de um número de documento
	 */
	public static create(value: string): DocumentNumber {
		if (!value || value.trim().length === 0) {
			throw new Error("DocumentNumber: documento é obrigatório");
		}

		// Remove caracteres não numéricos
		const cleanValue = value.replace(/\D/g, "");

		// Verifica se é CPF ou CNPJ com base no tamanho
		let type: DocumentType;
		if (cleanValue.length === 11) {
			type = DocumentType.CPF;
			if (!DocumentNumber.isValidCPF(cleanValue)) {
				throw new Error("DocumentNumber: CPF inválido");
			}
		} else if (cleanValue.length === 14) {
			type = DocumentType.CNPJ;
			if (!DocumentNumber.isValidCNPJ(cleanValue)) {
				throw new Error("DocumentNumber: CNPJ inválido");
			}
		} else {
			throw new Error("DocumentNumber: documento deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ)");
		}

		return new DocumentNumber(cleanValue, type);
	}

	/**
	 * Cria uma nova instância específica de CPF
	 */
	public static createCPF(value: string): DocumentNumber {
		if (!value || value.trim().length === 0) {
			throw new Error("DocumentNumber: CPF é obrigatório");
		}

		// Remove caracteres não numéricos
		const cleanValue = value.replace(/\D/g, "");

		if (cleanValue.length !== 11) {
			throw new Error("DocumentNumber: CPF deve ter 11 dígitos");
		}

		if (!DocumentNumber.isValidCPF(cleanValue)) {
			throw new Error("DocumentNumber: CPF inválido");
		}

		return new DocumentNumber(cleanValue, DocumentType.CPF);
	}

	/**
	 * Cria uma nova instância específica de CNPJ
	 */
	public static createCNPJ(value: string): DocumentNumber {
		if (!value || value.trim().length === 0) {
			throw new Error("DocumentNumber: CNPJ é obrigatório");
		}

		// Remove caracteres não numéricos
		const cleanValue = value.replace(/\D/g, "");

		if (cleanValue.length !== 14) {
			throw new Error("DocumentNumber: CNPJ deve ter 14 dígitos");
		}

		if (!DocumentNumber.isValidCNPJ(cleanValue)) {
			throw new Error("DocumentNumber: CNPJ inválido");
		}

		return new DocumentNumber(cleanValue, DocumentType.CNPJ);
	}

	/**
	 * Valida um CPF
	 * Implementa o algoritmo de validação de CPF
	 */
	private static isValidCPF(cpf: string): boolean {
		// Verifica padrões inválidos (todos os dígitos iguais)
		if (/^(\d)\1{10}$/.test(cpf)) {
			return false;
		}

		// Validação do primeiro dígito verificador
		let sum = 0;
		for (let i = 0; i < 9; i++) {
			sum += parseInt(cpf.charAt(i)) * (10 - i);
		}

		let remainder = sum % 11;
		const digit1 = remainder < 2 ? 0 : 11 - remainder;

		if (parseInt(cpf.charAt(9)) !== digit1) {
			return false;
		}

		// Validação do segundo dígito verificador
		sum = 0;
		for (let i = 0; i < 10; i++) {
			sum += parseInt(cpf.charAt(i)) * (11 - i);
		}

		remainder = sum % 11;
		const digit2 = remainder < 2 ? 0 : 11 - remainder;

		return parseInt(cpf.charAt(10)) === digit2;
	}

	/**
	 * Valida um CNPJ
	 * Implementa o algoritmo de validação de CNPJ
	 */
	private static isValidCNPJ(cnpj: string): boolean {
		// Verifica padrões inválidos (todos os dígitos iguais)
		if (/^(\d)\1{13}$/.test(cnpj)) {
			return false;
		}

		// Validação do primeiro dígito verificador
		let size = 12;
		let numbers = cnpj.substring(0, size);
		let digits = cnpj.substring(size);

		let sum = 0;
		let pos = size - 7;

		for (let i = size; i >= 1; i--) {
			sum += parseInt(numbers.charAt(size - i)) * pos--;
			if (pos < 2) pos = 9;
		}

		let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
		if (result !== parseInt(digits.charAt(0))) {
			return false;
		}

		// Validação do segundo dígito verificador
		size = 13;
		numbers = cnpj.substring(0, size);
		digits = cnpj.substring(size);

		sum = 0;
		pos = size - 7;

		for (let i = size; i >= 1; i--) {
			sum += parseInt(numbers.charAt(size - i)) * pos--;
			if (pos < 2) pos = 9;
		}

		result = sum % 11 < 2 ? 0 : 11 - (sum % 11);

		return result === parseInt(digits.charAt(0));
	}

	/**
	 * Formata o documento de acordo com o tipo (CPF ou CNPJ)
	 */
	public format(): string {
		if (this._type === DocumentType.CPF) {
			return this._value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
		} else {
			return this._value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
		}
	}

	/**
	 * Retorna apenas os números do documento, sem formatação
	 */
	public getValue(): string {
		return this._value;
	}

	/**
	 * Retorna o tipo do documento (CPF ou CNPJ)
	 */
	public getType(): DocumentType {
		return this._type;
	}

	/**
	 * Retorna um objeto com os dados do documento
	 */
	public toObject(): {
		value: string;
		type: DocumentType;
		formatted: string;
	} {
		return {
			value: this._value,
			type: this._type,
			formatted: this.format(),
		};
	}

	/**
	 * Serializa o objeto para JSON
	 */
	public toJSON(): string {
		return JSON.stringify(this.toObject());
	}

	/**
	 * Deserializa um JSON para DocumentNumber
	 */
	public static fromJSON(json: string): DocumentNumber {
		const data = JSON.parse(json);
		return DocumentNumber.create(data.value);
	}

	/**
	 * Compara dois documentos por igualdade de valores
	 */
	public equals(other: DocumentNumber): boolean {
		if (!(other instanceof DocumentNumber)) {
			return false;
		}

		return this._value === other._value && this._type === other._type;
	}

	// Getters
	get value(): string {
		return this._value;
	}

	get type(): DocumentType {
		return this._type;
	}
}
