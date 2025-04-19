import { Address } from './value-objects/address.js';
import { Contact } from './value-objects/contact.js';

/**
 * Entidade que representa um cliente no sistema.
 * Diferente de Value Objects, entidades possuem identidade única.
 */
export class Customer {
  private readonly _id: string;
  private _name: string;
  private _documentNumber: string; // CPF/CNPJ
  private _address: Address;
  private _contact: Contact;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _active: boolean;

  private constructor(
    id: string,
    name: string,
    documentNumber: string,
    address: Address,
    contact: Contact,
    createdAt?: Date,
    updatedAt?: Date,
    active: boolean = true,
  ) {
    this._id = id;
    this._name = name;
    this._documentNumber = documentNumber;
    this._address = address;
    this._contact = contact;
    this._createdAt = createdAt || new Date();
    this._updatedAt = updatedAt || new Date();
    this._active = active;
  }

  /**
   * Cria uma nova instância de Cliente
   */
  public static create(
    id: string,
    name: string,
    documentNumber: string, 
    address: Address,
    contact: Contact,
    createdAt?: Date,
    updatedAt?: Date,
    active: boolean = true,
  ): Customer {
    // Validações
    if (!id) {
      throw new Error('Customer: ID é obrigatório');
    }

    if (!name || name.trim() === '') {
      throw new Error('Customer: nome é obrigatório');
    }

    if (!documentNumber || documentNumber.trim() === '') {
      throw new Error('Customer: número de documento é obrigatório');
    }

    // Validação de CPF/CNPJ com remoção de caracteres especiais
    const cleanDocumentNumber = documentNumber.replace(/[^\d]/g, '');

    // Validação básica de CPF/CNPJ pelo tamanho
    if (cleanDocumentNumber.length !== 11 && cleanDocumentNumber.length !== 14) {
      throw new Error('Customer: número de documento inválido. Deve ser CPF (11 dígitos) ou CNPJ (14 dígitos)');
    }

    if (!(address instanceof Address)) {
      throw new Error('Customer: endereço inválido');
    }

    if (!(contact instanceof Contact)) {
      throw new Error('Customer: contato inválido');
    }

    return new Customer(
      id,
      name.trim(),
      cleanDocumentNumber,
      address,
      contact,
      createdAt,
      updatedAt,
      active,
    );
  }

  /**
   * Atualiza as informações do cliente
   */
  public update(
    name: string,
    documentNumber: string,
    address: Address,
    contact: Contact,
  ): void {
    if (!name || name.trim() === '') {
      throw new Error('Customer: nome é obrigatório');
    }

    if (!documentNumber || documentNumber.trim() === '') {
      throw new Error('Customer: número de documento é obrigatório');
    }

    // Validação de CPF/CNPJ com remoção de caracteres especiais
    const cleanDocumentNumber = documentNumber.replace(/[^\d]/g, '');

    // Validação básica de CPF/CNPJ pelo tamanho
    if (cleanDocumentNumber.length !== 11 && cleanDocumentNumber.length !== 14) {
      throw new Error('Customer: número de documento inválido. Deve ser CPF (11 dígitos) ou CNPJ (14 dígitos)');
    }

    if (!(address instanceof Address)) {
      throw new Error('Customer: endereço inválido');
    }

    if (!(contact instanceof Contact)) {
      throw new Error('Customer: contato inválido');
    }

    this._name = name.trim();
    this._documentNumber = cleanDocumentNumber;
    this._address = address;
    this._contact = contact;
    this._updatedAt = new Date();
  }

  /**
   * Ativa um cliente
   */
  public activate(): void {
    this._active = true;
    this._updatedAt = new Date();
  }

  /**
   * Desativa um cliente
   */
  public deactivate(): void {
    this._active = false;
    this._updatedAt = new Date();
  }

  /**
   * Retorna um objeto com os dados do cliente
   */
  public toObject(): {
    id: string;
    name: string;
    documentNumber: string;
    address: ReturnType<Address['toObject']>;
    contact: ReturnType<Contact['toObject']>;
    createdAt: Date;
    updatedAt: Date;
    active: boolean;
  } {
    return {
      id: this._id,
      name: this._name,
      documentNumber: this._documentNumber,
      address: this._address.toObject(),
      contact: this._contact.toObject(),
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

  get documentNumber(): string {
    return this._documentNumber;
  }

  get address(): Address {
    return this._address;
  }

  get contact(): Contact {
    return this._contact;
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
   * Compara dois clientes por igualdade de ID
   */
  public equals(other: Customer): boolean {
    if (!(other instanceof Customer)) {
      return false;
    }

    return this._id === other._id;
  }
} 