import { randomUUID } from "crypto";
import { Customer } from "../../entities/customer.js";
import { Address } from "../../entities/value-objects/address.js";
import { Contact } from "../../entities/value-objects/contact.js";
import { CustomerRepository } from "../../repositories/customer-repository.js";

export interface CreateCustomerDTO {
	name: string;
	documentNumber: string;
	address: {
		street: string;
		number: string;
		complement?: string;
		neighborhood: string;
		city: string;
		state: string;
		zipCode: string;
		country: string;
	};
	contact: {
		email: string;
		phone: string;
		whatsapp?: string;
	};
}

export interface CreateCustomerResponseDTO {
	id: string;
	name: string;
	documentNumber: string;
	address: {
		street: string;
		number: string;
		complement?: string;
		neighborhood: string;
		city: string;
		state: string;
		zipCode: string;
		formattedZipCode: string;
		country: string;
	};
	contact: {
		email: string;
		phone: string;
		whatsapp?: string;
		formattedPhone: string;
		formattedWhatsapp: string;
	};
	createdAt: Date;
	updatedAt: Date;
	active: boolean;
}

/**
 * Caso de uso para criação de um novo cliente
 */
export class CreateCustomerUseCase {
	constructor(private readonly customerRepository: CustomerRepository) {}

	/**
	 * Executa o caso de uso
	 * @param data Dados do cliente a ser criado
	 * @returns Cliente criado
	 * @throws Error se o cliente já existir com o mesmo documento
	 */
	async execute(data: CreateCustomerDTO): Promise<CreateCustomerResponseDTO> {
		// Verifica se já existe um cliente com o mesmo documento
		const exists = await this.customerRepository.existsByDocumentNumber(data.documentNumber);

		if (exists) {
			throw new Error(`Cliente com documento ${data.documentNumber} já existe`);
		}

		// Cria os value objects
		const address = Address.create(
			data.address.street,
			data.address.number,
			data.address.neighborhood,
			data.address.city,
			data.address.state,
			data.address.zipCode,
			data.address.country,
			data.address.complement,
		);

		const contact = Contact.create(data.contact.email, data.contact.phone, data.contact.whatsapp);

		// Gera um ID único para o cliente
		const id = randomUUID();

		// Cria a entidade de cliente
		const customer = Customer.create(id, data.name, data.documentNumber, address, contact);

		// Persiste o cliente
		const savedCustomer = await this.customerRepository.save(customer);

		// Obtém o objeto base do cliente
		const customerObject = savedCustomer.toObject();

		// Garante que o objeto retornado tem todos os campos necessários na interface CreateCustomerResponseDTO
		return {
			...customerObject,
			address: {
				...customerObject.address,
				formattedZipCode: address.formatZipCode(),
			},
		};
	}
}
