import { Customer } from "../../../domain/entities/customer.js";
import { Address } from "../../../domain/entities/value-objects/address.js";
import { Contact } from "../../../domain/entities/value-objects/contact.js";
import { CustomerRepository } from "../../../domain/repositories/customer-repository.js";
import { logger } from "../../../shared/utils/logger.js";
import { Result } from "../../../shared/utils/result.js";

interface UpdateCustomerRequest {
	id: string;
	name?: string;
	email?: string;
	phone?: string;
	street?: string;
	number?: string;
	complement?: string;
	neighborhood?: string;
	city?: string;
	state?: string;
	zipCode?: string;
}

interface UpdateCustomerResponse {
	customer: Customer;
}

/**
 * Caso de uso para atualização de dados de cliente
 */
export class UpdateCustomerUseCase {
	/**
	 * Cria uma nova instância do caso de uso
	 * @param customerRepository Repositório de clientes
	 */
	constructor(private readonly customerRepository: CustomerRepository) {}

	/**
	 * Executa o caso de uso
	 * @param request Dados para atualização do cliente
	 */
	async execute(request: UpdateCustomerRequest): Promise<Result<UpdateCustomerResponse>> {
		try {
			logger.info("Iniciando atualização de cliente", { customerId: request.id });

			// Buscar o cliente existente
			const existingCustomer = await this.customerRepository.findById(request.id);
			if (!existingCustomer) {
				logger.warn("Cliente não encontrado para atualização", { customerId: request.id });
				return Result.fail({
					message: `Cliente não encontrado com ID: ${request.id}`,
					code: "CUSTOMER_NOT_FOUND",
				});
			}

			// Converter o cliente para objeto para facilitar a manipulação
			const customerData = existingCustomer.toObject();

			// Verificar se precisa atualizar o endereço
			let updatedAddress = existingCustomer.address;
			if (this.needsAddressUpdate(request)) {
				const addressResult = this.createUpdatedAddress(existingCustomer.address, request);
				if (addressResult.isFailure) {
					return Result.fail(addressResult.error);
				}
				updatedAddress = addressResult.value;
			}

			// Verificar se precisa atualizar o contato
			let updatedContact = existingCustomer.contact;
			if (this.needsContactUpdate(request)) {
				const contactResult = this.createUpdatedContact(existingCustomer.contact, request);
				if (contactResult.isFailure) {
					return Result.fail(contactResult.error);
				}
				updatedContact = contactResult.value;
			}

			// Criar o cliente atualizado
			const updatedCustomer = Customer.create(
				existingCustomer.id,
				request.name || customerData.name,
				customerData.documentNumber, // Não permitimos alterar documento
				updatedAddress,
				updatedContact,
				customerData.createdAt,
				new Date(), // updatedAt
				customerData.active,
			);

			// Salvar as alterações
			const savedCustomer = await this.customerRepository.save(updatedCustomer);

			logger.info("Cliente atualizado com sucesso", { customerId: savedCustomer.id });

			return Result.ok({ customer: savedCustomer });
		} catch (error) {
			logger.error("Erro ao atualizar cliente", { error, customerId: request.id });
			return Result.fail({
				message: error instanceof Error ? error.message : "Erro ao atualizar cliente",
				details: error,
			});
		}
	}

	/**
	 * Verifica se há alterações de endereço na requisição
	 */
	private needsAddressUpdate(request: UpdateCustomerRequest): boolean {
		return !!(
			request.street ||
			request.number ||
			request.complement ||
			request.neighborhood ||
			request.city ||
			request.state ||
			request.zipCode
		);
	}

	/**
	 * Cria um novo objeto de endereço com as atualizações
	 */
	private createUpdatedAddress(
		currentAddress: Address,
		request: UpdateCustomerRequest,
	): Result<Address> {
		try {
			// Extrair os valores atuais do endereço
			const addressData = currentAddress.toObject();

			// Criar um novo endereço com os valores atualizados
			return Result.ok(
				Address.create(
					request.street || addressData.street,
					request.number || addressData.number,
					request.neighborhood || addressData.neighborhood,
					request.city || addressData.city,
					request.state || addressData.state,
					request.zipCode || addressData.zipCode,
					addressData.country, // Não permitimos alterar o país
					request.complement !== undefined ? request.complement : addressData.complement,
				),
			);
		} catch (error) {
			logger.error("Erro ao atualizar endereço", { error });
			return Result.fail({
				message: error instanceof Error ? error.message : "Erro ao atualizar endereço",
				code: "INVALID_ADDRESS",
			});
		}
	}

	/**
	 * Verifica se há alterações de contato na requisição
	 */
	private needsContactUpdate(request: UpdateCustomerRequest): boolean {
		return !!(request.email || request.phone);
	}

	/**
	 * Cria um novo objeto de contato com as atualizações
	 */
	private createUpdatedContact(
		currentContact: Contact,
		request: UpdateCustomerRequest,
	): Result<Contact> {
		try {
			// Extrair os valores atuais do contato
			const contactData = currentContact.toObject();

			// Criar um novo contato com os valores atualizados
			return Result.ok(
				Contact.create(
					request.email || contactData.email,
					request.phone || contactData.phone,
					contactData.whatsapp, // Não permitimos alterar o WhatsApp por este caso de uso
				),
			);
		} catch (error) {
			logger.error("Erro ao atualizar contato", { error });
			return Result.fail({
				message: error instanceof Error ? error.message : "Erro ao atualizar contato",
				code: "INVALID_CONTACT",
			});
		}
	}
}
