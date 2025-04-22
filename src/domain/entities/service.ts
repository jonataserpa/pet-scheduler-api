import { PetSize } from "./pet.js";

/**
 * Entidade que representa um serviço oferecido pelo pet shop.
 * Diferente de Value Objects, entidades possuem identidade única.
 */
export class Service {
	private readonly _id: string;
	private _name: string;
	private _description?: string;
	private _duration: number; // duração em minutos
	private _price: number;
	private _petSizes: PetSize[];
	private _createdAt: Date;
	private _updatedAt: Date;
	private _active: boolean;

	private constructor(
		id: string,
		name: string,
		duration: number,
		price: number,
		petSizes: PetSize[],
		description?: string,
		createdAt?: Date,
		updatedAt?: Date,
		active: boolean = true,
	) {
		this._id = id;
		this._name = name;
		this._description = description;
		this._duration = duration;
		this._price = price;
		this._petSizes = [...petSizes]; // Cria uma cópia do array para evitar mutações externas
		this._createdAt = createdAt || new Date();
		this._updatedAt = updatedAt || new Date();
		this._active = active;
	}

	/**
	 * Cria uma nova instância de Service
	 */
	public static create(
		id: string,
		name: string,
		duration: number,
		price: number,
		petSizes: PetSize[],
		description?: string,
		createdAt?: Date,
		updatedAt?: Date,
		active: boolean = true,
	): Service {
		// Validações
		if (!id) {
			throw new Error("Service: ID é obrigatório");
		}

		if (!name || name.trim() === "") {
			throw new Error("Service: nome é obrigatório");
		}

		if (!Number.isInteger(duration) || duration <= 0) {
			throw new Error("Service: duração deve ser um número inteiro positivo em minutos");
		}

		if (isNaN(price) || price <= 0) {
			throw new Error("Service: preço deve ser um número positivo");
		}

		if (!Array.isArray(petSizes) || petSizes.length === 0) {
			throw new Error("Service: pelo menos um tamanho de pet deve ser especificado");
		}

		// Valida se todos os tamanhos de pet são válidos
		for (const size of petSizes) {
			if (!Object.values(PetSize).includes(size)) {
				throw new Error(
					`Service: tamanho de pet inválido: ${size}. Deve ser um dos valores: ${Object.values(PetSize).join(", ")}`,
				);
			}
		}

		return new Service(
			id,
			name.trim(),
			duration,
			price,
			petSizes,
			description?.trim(),
			createdAt,
			updatedAt,
			active,
		);
	}

	/**
	 * Atualiza as informações do serviço
	 */
	public update(
		name: string,
		duration: number,
		price: number,
		petSizes: PetSize[],
		description?: string,
	): void {
		if (!name || name.trim() === "") {
			throw new Error("Service: nome é obrigatório");
		}

		if (!Number.isInteger(duration) || duration <= 0) {
			throw new Error("Service: duração deve ser um número inteiro positivo em minutos");
		}

		if (isNaN(price) || price <= 0) {
			throw new Error("Service: preço deve ser um número positivo");
		}

		if (!Array.isArray(petSizes) || petSizes.length === 0) {
			throw new Error("Service: pelo menos um tamanho de pet deve ser especificado");
		}

		// Valida se todos os tamanhos de pet são válidos
		for (const size of petSizes) {
			if (!Object.values(PetSize).includes(size)) {
				throw new Error(
					`Service: tamanho de pet inválido: ${size}. Deve ser um dos valores: ${Object.values(PetSize).join(", ")}`,
				);
			}
		}

		this._name = name.trim();
		this._duration = duration;
		this._price = price;
		this._petSizes = [...petSizes];
		this._description = description?.trim();
		this._updatedAt = new Date();
	}

	/**
	 * Ativa um serviço
	 */
	public activate(): void {
		this._active = true;
		this._updatedAt = new Date();
	}

	/**
	 * Desativa um serviço
	 */
	public deactivate(): void {
		this._active = false;
		this._updatedAt = new Date();
	}

	/**
	 * Atualiza o preço do serviço
	 */
	public updatePrice(price: number): void {
		if (isNaN(price) || price <= 0) {
			throw new Error("Service: preço deve ser um número positivo");
		}

		this._price = price;
		this._updatedAt = new Date();
	}

	/**
	 * Atualiza a duração do serviço
	 */
	public updateDuration(duration: number): void {
		if (!Number.isInteger(duration) || duration <= 0) {
			throw new Error("Service: duração deve ser um número inteiro positivo em minutos");
		}

		this._duration = duration;
		this._updatedAt = new Date();
	}

	/**
	 * Adiciona um tamanho de pet compatível com o serviço
	 */
	public addPetSize(size: PetSize): void {
		if (!Object.values(PetSize).includes(size)) {
			throw new Error(
				`Service: tamanho de pet inválido: ${size}. Deve ser um dos valores: ${Object.values(PetSize).join(", ")}`,
			);
		}

		if (!this._petSizes.includes(size)) {
			this._petSizes.push(size);
			this._updatedAt = new Date();
		}
	}

	/**
	 * Remove um tamanho de pet compatível com o serviço
	 */
	public removePetSize(size: PetSize): void {
		if (!Object.values(PetSize).includes(size)) {
			throw new Error(
				`Service: tamanho de pet inválido: ${size}. Deve ser um dos valores: ${Object.values(PetSize).join(", ")}`,
			);
		}

		if (this._petSizes.length <= 1) {
			throw new Error(
				"Service: não é possível remover o último tamanho de pet. Um serviço deve ter pelo menos um tamanho compatível.",
			);
		}

		const index = this._petSizes.indexOf(size);
		if (index !== -1) {
			this._petSizes.splice(index, 1);
			this._updatedAt = new Date();
		}
	}

	/**
	 * Verifica se o serviço é compatível com um determinado tamanho de pet
	 */
	public isCompatibleWithPetSize(size: PetSize): boolean {
		return this._petSizes.includes(size);
	}

	/**
	 * Retorna um objeto com os dados do serviço
	 */
	public toObject(): {
		id: string;
		name: string;
		description?: string;
		duration: number;
		price: number;
		petSizes: PetSize[];
		createdAt: Date;
		updatedAt: Date;
		active: boolean;
	} {
		return {
			id: this._id,
			name: this._name,
			description: this._description,
			duration: this._duration,
			price: this._price,
			petSizes: [...this._petSizes],
			createdAt: new Date(this._createdAt),
			updatedAt: new Date(this._updatedAt),
			active: this._active,
		};
	}

	// Getters
	get id(): string {
		return this._id;
	}

	get name(): string {
		return this._name;
	}

	get description(): string | undefined {
		return this._description;
	}

	get duration(): number {
		return this._duration;
	}

	get price(): number {
		return this._price;
	}

	get petSizes(): PetSize[] {
		return [...this._petSizes]; // Retorna uma cópia para evitar mutações externas
	}

	get createdAt(): Date {
		return new Date(this._createdAt);
	}

	get updatedAt(): Date {
		return new Date(this._updatedAt);
	}

	get active(): boolean {
		return this._active;
	}

	/**
	 * Compara dois serviços por igualdade de ID
	 */
	public equals(other: Service): boolean {
		if (!(other instanceof Service)) {
			return false;
		}

		return this._id === other._id;
	}
}
