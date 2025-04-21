/**
 * Enum que representa os tamanhos possíveis de um pet
 */
export enum PetSize {
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE',
  EXTRA_LARGE = 'EXTRA_LARGE',
}

/**
 * Entidade que representa um animal de estimação no sistema.
 * Diferente de Value Objects, entidades possuem identidade única.
 */
export class Pet {
  private readonly _id: string;
  private _name: string;
  private _species: string;
  private _breed?: string;
  private _size: PetSize;
  private _birthDate?: Date;
  private _allergies?: string;
  private _observations?: string;
  private readonly _customerId: string;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private _active: boolean;

  private constructor(
    id: string,
    name: string,
    species: string,
    size: PetSize,
    customerId: string,
    breed?: string,
    birthDate?: Date,
    allergies?: string,
    observations?: string,
    createdAt?: Date,
    updatedAt?: Date,
    active: boolean = true,
  ) {
    this._id = id;
    this._name = name;
    this._species = species;
    this._breed = breed;
    this._size = size;
    this._birthDate = birthDate;
    this._allergies = allergies;
    this._observations = observations;
    this._customerId = customerId;
    this._createdAt = createdAt || new Date();
    this._updatedAt = updatedAt || new Date();
    this._active = active;
  }

  /**
   * Cria uma nova instância de Pet
   */
  public static create(
    id: string,
    name: string,
    species: string,
    size: PetSize,
    customerId: string,
    breed?: string,
    birthDate?: Date,
    allergies?: string,
    observations?: string,
    createdAt?: Date,
    updatedAt?: Date,
    active: boolean = true,
  ): Pet {
    // Validações
    if (!id) {
      throw new Error('Pet: ID é obrigatório');
    }

    if (!name || name.trim().length === 0) {
      throw new Error('Pet: nome é obrigatório');
    }

    if (!species || species.trim().length === 0) {
      throw new Error('Pet: espécie é obrigatória');
    }

    if (!Object.values(PetSize).includes(size)) {
      throw new Error('Pet: tamanho inválido');
    }

    if (!customerId) {
      throw new Error('Pet: ID do cliente é obrigatório');
    }

    // Validar data de nascimento (não pode ser no futuro)
    if (birthDate && birthDate > new Date()) {
      throw new Error('Pet: data de nascimento não pode ser no futuro');
    }

    return new Pet(
      id,
      name,
      species,
      size,
      customerId,
      breed,
      birthDate,
      allergies,
      observations,
      createdAt,
      updatedAt,
      active,
    );
  }

  /**
   * Atualiza as informações do pet
   */
  public update(
    name?: string,
    species?: string,
    size?: PetSize,
    breed?: string,
    birthDate?: Date | null,
    allergies?: string | null,
    observations?: string | null,
  ): void {
    if (name !== undefined && name.trim().length === 0) {
      throw new Error('Pet: nome não pode ser vazio');
    }

    if (species !== undefined && species.trim().length === 0) {
      throw new Error('Pet: espécie não pode ser vazia');
    }

    if (size !== undefined && !Object.values(PetSize).includes(size)) {
      throw new Error('Pet: tamanho inválido');
    }

    // Validar data de nascimento (não pode ser no futuro)
    if (birthDate && birthDate > new Date()) {
      throw new Error('Pet: data de nascimento não pode ser no futuro');
    }

    if (name !== undefined) {
      this._name = name;
    }

    if (species !== undefined) {
      this._species = species;
    }

    if (size !== undefined) {
      this._size = size;
    }

    if (breed !== undefined) {
      this._breed = breed;
    }

    if (birthDate === null) {
      this._birthDate = undefined;
    } else if (birthDate !== undefined) {
      this._birthDate = birthDate;
    }

    if (allergies === null) {
      this._allergies = undefined;
    } else if (allergies !== undefined) {
      this._allergies = allergies;
    }

    if (observations === null) {
      this._observations = undefined;
    } else if (observations !== undefined) {
      this._observations = observations;
    }

    this._updatedAt = new Date();
  }

  /**
   * Ativa um pet
   */
  public activate(): void {
    this._active = true;
    this._updatedAt = new Date();
  }

  /**
   * Desativa um pet
   */
  public deactivate(): void {
    this._active = false;
    this._updatedAt = new Date();
  }

  /**
   * Adiciona ou atualiza informações sobre alergias
   */
  public updateAllergies(allergies: string): void {
    this._allergies = allergies.trim();
    this._updatedAt = new Date();
  }

  /**
   * Adiciona ou atualiza observações
   */
  public updateObservations(observations: string): void {
    this._observations = observations.trim();
    this._updatedAt = new Date();
  }

  /**
   * Calcula a idade do pet em anos
   */
  public calculateAge(): number | null {
    if (!this._birthDate) {
      return null;
    }

    const today = new Date();
    let age = today.getFullYear() - this._birthDate.getFullYear();
    
    // Ajusta a idade se ainda não completou aniversário neste ano
    const isBirthdayPassed = 
      today.getMonth() > this._birthDate.getMonth() || 
      (today.getMonth() === this._birthDate.getMonth() && 
      today.getDate() >= this._birthDate.getDate());
    
    if (!isBirthdayPassed) {
      age--;
    }

    return age;
  }

  /**
   * Verifica se o pet tem restrições baseadas no tamanho
   */
  public hasSizeRestrictions(): boolean {
    return this._size === PetSize.LARGE || this._size === PetSize.EXTRA_LARGE;
  }

  /**
   * Verifica se o pet tem alergias
   */
  public hasAllergies(): boolean {
    return !!this._allergies && this._allergies.trim().length > 0;
  }

  /**
   * Retorna todas as informações do pet em formato de objeto
   */
  public toObject() {
    return {
      id: this._id,
      name: this._name,
      species: this._species,
      breed: this._breed,
      size: this._size,
      birthDate: this._birthDate,
      allergies: this._allergies,
      observations: this._observations,
      customerId: this._customerId,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      active: this._active,
    };
  }

  /**
   * Compara se dois pets são iguais (pelo ID)
   */
  public equals(other: Pet): boolean {
    if (!(other instanceof Pet)) {
      return false;
    }

    return this._id === other._id;
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get species(): string {
    return this._species;
  }

  get breed(): string | undefined {
    return this._breed;
  }

  get size(): PetSize {
    return this._size;
  }

  get birthDate(): Date | undefined {
    return this._birthDate ? new Date(this._birthDate) : undefined;
  }

  get allergies(): string | undefined {
    return this._allergies;
  }

  get observations(): string | undefined {
    return this._observations;
  }

  get customerId(): string {
    return this._customerId;
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
} 