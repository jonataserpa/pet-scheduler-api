/**
 * Value Object que representa um endereço
 * Value Objects são imutáveis e não possuem identidade
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

    Object.freeze(this);
  }

  /**
   * Cria uma nova instância de Address
   */
  public static create(
    street: string,
    number: string,
    neighborhood: string,
    city: string,
    state: string,
    zipCode: string,
    country: string,
    complement?: string,
  ): Address {
    // Validações
    if (!street || street.trim().length === 0) {
      throw new Error('Endereço: rua é obrigatória');
    }

    if (!number || number.trim().length === 0) {
      throw new Error('Endereço: número é obrigatório');
    }

    if (!neighborhood || neighborhood.trim().length === 0) {
      throw new Error('Endereço: bairro é obrigatório');
    }

    if (!city || city.trim().length === 0) {
      throw new Error('Endereço: cidade é obrigatória');
    }

    if (!state || state.trim().length === 0) {
      throw new Error('Endereço: estado é obrigatório');
    }

    if (!zipCode || zipCode.trim().length === 0) {
      throw new Error('Endereço: CEP é obrigatório');
    }

    if (!country || country.trim().length === 0) {
      throw new Error('Endereço: país é obrigatório');
    }

    // Limpa o CEP, mantendo apenas dígitos
    const cleanZipCode = zipCode.trim().replace(/\D/g, '');
    
    // Validação específica para CEP brasileiro
    if (country.trim().toUpperCase() === 'BRASIL' || country.trim().toUpperCase() === 'BRAZIL') {
      if (!Address.isValidBrazilianZipCode(cleanZipCode)) {
        throw new Error('Endereço: CEP brasileiro deve conter 8 dígitos');
      }
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
   * Valida um CEP brasileiro
   */
  private static isValidBrazilianZipCode(zipCode: string): boolean {
    return /^\d{8}$/.test(zipCode);
  }

  /**
   * Formata um CEP brasileiro (12345678 -> 12345-678)
   */
  private formatBrazilianZipCode(): string {
    return this._zipCode.replace(/^(\d{5})(\d{3})$/, '$1-$2');
  }

  /**
   * Retorna o CEP formatado de acordo com o país
   */
  public getFormattedZipCode(): string {
    if (this._country.toUpperCase() === 'BRASIL' || this._country.toUpperCase() === 'BRAZIL') {
      return this.formatBrazilianZipCode();
    }
    return this._zipCode;
  }

  /**
   * Retorna o endereço formatado como string
   */
  public toString(): string {
    let fullAddress = `${this._street}, ${this._number}`;
    
    if (this._complement) {
      fullAddress += ` - ${this._complement}`;
    }
    
    fullAddress += `, ${this._neighborhood}, ${this._city} - ${this._state}, ${this.getFormattedZipCode()}, ${this._country}`;
    
    return fullAddress;
  }

  /**
   * Retorna um objeto com os dados do endereço
   */
  public toObject(): {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    formattedZipCode: string;
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
      formattedZipCode: this.getFormattedZipCode(),
      country: this._country,
    };
  }

  /**
   * Serializa o objeto para JSON
   */
  public toJSON(): string {
    return JSON.stringify(this.toObject());
  }

  /**
   * Deserializa um JSON para Address
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

  /**
   * Compara dois endereços por igualdade de valores
   */
  public equals(other: Address): boolean {
    if (!(other instanceof Address)) {
      return false;
    }

    return (
      this._street === other._street &&
      this._number === other._number &&
      this._complement === other._complement &&
      this._neighborhood === other._neighborhood &&
      this._city === other._city &&
      this._state === other._state &&
      this._zipCode === other._zipCode &&
      this._country === other._country
    );
  }
} 