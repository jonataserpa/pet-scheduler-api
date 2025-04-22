/**
 * Enum para tipos de documento suportados
 */
export enum DocumentType {
	CPF = "CPF",
	CNPJ = "CNPJ",
	RG = "RG",
	PASSPORT = "PASSPORT",
}

/**
 * Classe de Value Object para representar documentos de identificação
 */
export class DocumentNumber {
	private readonly _value: string;
	private readonly _type: DocumentType;

	private constructor(value: string, type: DocumentType) {
		this._value = value;
		this._type = type;

		Object.freeze(this);
	}

	/**
	 * Cria uma instância de DocumentNumber após validação
	 */
	public static create(value: string, type?: DocumentType): DocumentNumber {
		if (!value) {
			throw new Error("DocumentNumber: documento é obrigatório");
		}

		const cleanValue = value.replace(/[^\d]/g, "");

		// Se o tipo não foi fornecido, inferir pelo comprimento
		if (!type) {
			if (cleanValue.length === 11) {
				type = DocumentType.CPF;
			} else if (cleanValue.length === 14) {
				type = DocumentType.CNPJ;
			} else {
				throw new Error("DocumentNumber: documento deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ)");
			}
		}

		// Validação específica por tipo de documento
		switch (type) {
			case DocumentType.CPF:
				if (!DocumentNumber.isValidCpf(cleanValue)) {
					throw new Error("DocumentNumber: CPF inválido");
				}
				break;
			case DocumentType.CNPJ:
				if (!DocumentNumber.isValidCnpj(cleanValue)) {
					throw new Error("DocumentNumber: CNPJ inválido");
				}
				break;
			case DocumentType.RG:
				if (cleanValue.length < 5) {
					throw new Error("DocumentNumber: RG inválido");
				}
				break;
			case DocumentType.PASSPORT:
				if (value.length < 6) {
					throw new Error("DocumentNumber: Passaporte inválido");
				}
				break;
			default:
				throw new Error(`Tipo de documento não suportado: ${type}`);
		}

		return new DocumentNumber(cleanValue, type);
	}

	/**
	 * Cria uma instância de DocumentNumber para CPF
	 */
	public static createCPF(value: string): DocumentNumber {
		if (!value) {
			throw new Error("DocumentNumber: CPF é obrigatório");
		}

		const cleanValue = value.replace(/[^\d]/g, "");

		if (cleanValue.length !== 11) {
			throw new Error("DocumentNumber: CPF deve ter 11 dígitos");
		}

		if (!DocumentNumber.isValidCpf(cleanValue)) {
			throw new Error("DocumentNumber: CPF inválido");
		}

		return new DocumentNumber(cleanValue, DocumentType.CPF);
	}

	/**
	 * Cria uma instância de DocumentNumber para CNPJ
	 */
	public static createCNPJ(value: string): DocumentNumber {
		if (!value) {
			throw new Error("DocumentNumber: CNPJ é obrigatório");
		}

		const cleanValue = value.replace(/[^\d]/g, "");

		if (cleanValue.length !== 14) {
			throw new Error("DocumentNumber: CNPJ deve ter 14 dígitos");
		}

		if (!DocumentNumber.isValidCnpj(cleanValue)) {
			throw new Error("DocumentNumber: CNPJ inválido");
		}

		return new DocumentNumber(cleanValue, DocumentType.CNPJ);
	}

	/**
	 * Valida CPF
	 */
	private static isValidCpf(cpf: string): boolean {
		if (cpf.length !== 11) return false;

		// Verifica se todos os dígitos são iguais
		if (/^(\d)\1+$/.test(cpf)) return false;

		// Algoritmo de validação
		let sum = 0;
		let remainder;

		// Primeiro dígito verificador
		for (let i = 1; i <= 9; i++) {
			sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
		}
		remainder = (sum * 10) % 11;
		if (remainder === 10 || remainder === 11) remainder = 0;
		if (remainder !== parseInt(cpf.substring(9, 10))) return false;

		// Segundo dígito verificador
		sum = 0;
		for (let i = 1; i <= 10; i++) {
			sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
		}
		remainder = (sum * 10) % 11;
		if (remainder === 10 || remainder === 11) remainder = 0;
		if (remainder !== parseInt(cpf.substring(10, 11))) return false;

		return true;
	}

	/**
	 * Valida CNPJ
	 */
	private static isValidCnpj(cnpj: string): boolean {
		if (cnpj.length !== 14) return false;

		// Verifica se todos os dígitos são iguais
		if (/^(\d)\1+$/.test(cnpj)) return false;

		// Algoritmo de validação
		let size = cnpj.length - 2;
		let numbers = cnpj.substring(0, size);
		const digits = cnpj.substring(size);
		let sum = 0;
		let pos = size - 7;

		// Primeiro dígito verificador
		for (let i = size; i >= 1; i--) {
			sum += parseInt(numbers.charAt(size - i)) * pos--;
			if (pos < 2) pos = 9;
		}
		let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
		if (result !== parseInt(digits.charAt(0))) return false;

		// Segundo dígito verificador
		size = size + 1;
		numbers = cnpj.substring(0, size);
		sum = 0;
		pos = size - 7;
		for (let i = size; i >= 1; i--) {
			sum += parseInt(numbers.charAt(size - i)) * pos--;
			if (pos < 2) pos = 9;
		}
		result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
		if (result !== parseInt(digits.charAt(1))) return false;

		return true;
	}

	/**
	 * Retorna o valor formatado do documento
	 */
	public format(): string {
		switch (this._type) {
			case DocumentType.CPF:
				return this._value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
			case DocumentType.CNPJ:
				return this._value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
			default:
				return this._value;
		}
	}

	/**
	 * Retorna apenas os dígitos do documento
	 */
	get value(): string {
		return this._value;
	}

	/**
	 * Retorna o tipo do documento
	 */
	get type(): DocumentType {
		return this._type;
	}

	/**
	 * Método compatível com testes anteriores
	 */
	public getValue(): string {
		return this._value;
	}

	/**
	 * Método compatível com testes anteriores
	 */
	public getType(): DocumentType {
		return this._type;
	}

	/**
	 * Compara com outro DocumentNumber
	 */
	public equals(other: DocumentNumber): boolean {
		if (!(other instanceof DocumentNumber)) return false;
		return this._value === other.value && this._type === other.type;
	}

	/**
	 * Representação em string
	 */
	public toString(): string {
		return this.format();
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
		return DocumentNumber.create(data.value, data.type);
	}
}
