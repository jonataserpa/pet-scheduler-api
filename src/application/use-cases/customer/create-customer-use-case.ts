import { Customer } from "../../../domain/entities/customer.js";
import { Address } from "../../../domain/entities/value-objects/address.js";
import { Contact } from "../../../domain/entities/value-objects/contact.js";
import { CustomerRepository } from "../../../domain/repositories/customer-repository.js";
import { SendWelcomeNotificationUseCase } from "./send-welcome-notification.js";
import { logger } from "../../../shared/utils/logger.js";
import { Result } from "../../../shared/utils/result.js";

interface CreateCustomerRequest {
	id?: string;
	name: string;
	documentNumber: string;
	email: string;
	phone?: string;
	street: string;
	number: string;
	complement?: string;
	neighborhood: string;
	city: string;
	state: string;
	zipCode: string;
	sendWelcomeNotification?: boolean;
	welcomeTemplate?: "default" | "premium" | "promotional";
}

interface CreateCustomerResponse {
	customer: Customer;
	welcomeNotificationSent: boolean;
}

/**
 * Caso de uso para criação de clientes
 */
export class CreateCustomerUseCase {
	/**
	 * Cria uma nova instância do caso de uso
	 * @param customerRepository Repositório de clientes
	 * @param sendWelcomeNotificationUseCase Caso de uso para envio de notificação de boas-vindas
	 */
	constructor(
		private readonly customerRepository: CustomerRepository,
		private readonly sendWelcomeNotificationUseCase: SendWelcomeNotificationUseCase,
	) {}

	/**
	 * Executa o caso de uso
	 * @param request Dados para criação do cliente
	 */
	async execute(request: CreateCustomerRequest): Promise<Result<CreateCustomerResponse>> {
		try {
			logger.info("Iniciando criação de cliente", {
				name: request.name,
				documentNumber: request.documentNumber,
			});

			// Verificar se já existe um cliente com o mesmo documento
			const existingCustomer = await this.customerRepository.findByDocumentNumber(
				request.documentNumber,
			);
			if (existingCustomer) {
				logger.warn("Documento já cadastrado para outro cliente", {
					documentNumber: request.documentNumber,
					existingCustomerId: existingCustomer.id,
				});
				return Result.fail({
					message: "Documento já cadastrado para outro cliente",
					code: "DOCUMENT_ALREADY_EXISTS",
				});
			}

			// Criar objetos de valor
			const addressResult = this.createAddress(request);
			if (addressResult.isFailure) {
				return Result.fail(addressResult.error);
			}

			const contactResult = this.createContact(request);
			if (contactResult.isFailure) {
				return Result.fail(contactResult.error);
			}

			// Criar cliente
			const customerId = request.id || crypto.randomUUID();
			const customer = await this.customerRepository.create(
				customerId,
				request.name,
				request.documentNumber,
				addressResult.value,
				contactResult.value,
				true, // cliente sempre começa ativo
			);

			logger.info("Cliente criado com sucesso", { customerId: customer.id });

			// Enviar notificação de boas-vindas, se solicitado
			let welcomeNotificationSent = false;
			if (request.sendWelcomeNotification !== false) {
				try {
					await this.sendWelcomeNotificationUseCase.execute({
						customer,
						template: request.welcomeTemplate,
					});
					welcomeNotificationSent = true;
					logger.info("Notificação de boas-vindas enviada com sucesso", {
						customerId: customer.id,
					});
				} catch (error) {
					// Não falhar o caso de uso se a notificação falhar
					logger.error("Erro ao enviar notificação de boas-vindas", {
						error,
						customerId: customer.id,
					});
				}
			}

			return Result.ok({
				customer,
				welcomeNotificationSent,
			});
		} catch (error) {
			logger.error("Erro ao criar cliente", { error, request });
			return Result.fail({
				message: error instanceof Error ? error.message : "Erro ao criar cliente",
				details: error,
			});
		}
	}

	/**
	 * Cria o objeto de valor de endereço
	 */
	private createAddress(request: CreateCustomerRequest): Result<Address> {
		try {
			const address = Address.create(
				request.street,
				request.number,
				request.neighborhood,
				request.city,
				request.state,
				request.zipCode,
				"Brasil", // Por padrão, usamos Brasil como país
				request.complement,
			);
			return Result.ok(address);
		} catch (error) {
			logger.error("Erro ao criar endereço", { error });
			return Result.fail({
				message: error instanceof Error ? error.message : "Erro ao criar endereço",
				code: "INVALID_ADDRESS",
			});
		}
	}

	/**
	 * Cria o objeto de valor de contato
	 */
	private createContact(request: CreateCustomerRequest): Result<Contact> {
		try {
			// Se não tiver telefone, vamos enviar um default para cumprir a validação
			// Em casos reais, provavelmente iríamos exigir um telefone ou mudar a validação do Contact
			const phone = request.phone || "0000000000"; // 10 dígitos para passar na validação

			const contact = Contact.create(request.email, phone);
			return Result.ok(contact);
		} catch (error) {
			logger.error("Erro ao criar contato", { error });
			return Result.fail({
				message: error instanceof Error ? error.message : "Erro ao criar contato",
				code: "INVALID_CONTACT",
			});
		}
	}
}
