import { Address } from "../../entities/value-objects/address.js";
import { Contact } from "../../entities/value-objects/contact.js";
import { CustomerRepository } from "../../repositories/customer-repository.js";

export interface UpdateCustomerDTO {
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
		country: string;
	};
	contact: {
		email: string;
		phone: string;
		whatsapp?: string;
	};
}

export interface UpdateCustomerResponseDTO {
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

export class CustomerNotFoundError extends Error {
	constructor(id: string) {
		super(`Cliente com ID ${id} não encontrado`);
		this.name = "CustomerNotFoundError";
	}
}

export class DuplicateDocumentError extends Error {
	constructor(documentNumber: string) {
		super(`Já existe outro cliente com o documento ${documentNumber}`);
		this.name = "DuplicateDocumentError";
	}
}

/**
 * Caso de uso para atualização de um cliente existente
 */
export class UpdateCustomerUseCase {
	constructor(private readonly customerRepository: CustomerRepository) {}

	/**
	 * Executa o caso de uso
	 * @param dto Dados do cliente a ser atualizado
	 * @returns Cliente atualizado
	 * @throws CustomerNotFoundError se o cliente não existir
	 * @throws DuplicateDocumentError se o novo documento já estiver em uso por outro cliente
	 */
	async execute(dto: UpdateCustomerDTO): Promise<UpdateCustomerResponseDTO> {
		// Verifica se o cliente existe
		const customer = await this.customerRepository.findById(dto.id);

		if (!customer) {
			throw new CustomerNotFoundError(dto.id);
		}

		// Verifica se o novo número de documento já está em uso por outro cliente
		if (dto.documentNumber !== customer.documentNumber) {
			const exists = await this.customerRepository.existsByDocumentNumber(
				dto.documentNumber,
				dto.id,
			);

			if (exists) {
				throw new DuplicateDocumentError(dto.documentNumber);
			}
		}

		// Cria os value objects atualizados
		const address = Address.create(
			dto.address.street,
			dto.address.number,
			dto.address.neighborhood,
			dto.address.city,
			dto.address.state,
			dto.address.zipCode,
			dto.address.country,
			dto.address.complement,
		);

		const contact = Contact.create(dto.contact.email, dto.contact.phone, dto.contact.whatsapp);

		// Atualiza o cliente
		customer.update(dto.name, dto.documentNumber, address, contact);

		// Persiste as mudanças
		const updatedCustomer = await this.customerRepository.save(customer);

		// Obtém o objeto base do cliente
		const customerObject = updatedCustomer.toObject();

		// Garante que o objeto retornado tem todos os campos necessários na interface UpdateCustomerResponseDTO
		return {
			...customerObject,
			address: {
				...customerObject.address,
				formattedZipCode: address.formatZipCode(), // Assumindo que Address tem um método formatZipCode()
			},
		};
	}
}
