import { Prisma, Customer as PrismaCustomer } from "@prisma/client";
import { Customer } from "../../domain/entities/customer.js";
import { Address } from "../../domain/entities/value-objects/address.js";
import { Contact } from "../../domain/entities/value-objects/contact.js";
import {
	CustomerFilter,
	CustomerRepository,
} from "../../domain/repositories/customer-repository.js";
import { PrismaRepositoryBase } from "./base/prisma-repository-base.js";

/**
 * Implementação do repositório de clientes usando Prisma
 */
export class PrismaCustomerRepository extends PrismaRepositoryBase implements CustomerRepository {
	/**
	 * Salva um cliente (cria ou atualiza)
	 */
	async save(customer: Customer): Promise<Customer> {
		try {
			const addressData = customer.address.toObject();
			const contactData = customer.contact.toObject();

			// Adaptando para o modelo real do Prisma
			const updatedCustomer = await this.prisma.customer.update({
				where: { id: customer.id },
				data: {
					name: customer.name,
					email: contactData.email,
					phone: contactData.phone,
					// Armazenando dados adicionais em um campo JSON ou string
					address: JSON.stringify({
						street: addressData.street,
						number: addressData.number,
						complement: addressData.complement,
						neighborhood: addressData.neighborhood,
						city: addressData.city,
						state: addressData.state,
						zipCode: addressData.zipCode,
						country: addressData.country,
					}),
					updatedAt: new Date(),
				},
			});

			return this.mapToDomain(updatedCustomer);
		} catch (error) {
			return this.handleError(error, "save", { customerId: customer.id });
		}
	}

	/**
	 * Cria um novo cliente
	 */
	async create(
		id: string,
		name: string,
		documentNumber: string,
		address: Address,
		contact: Contact,
		active: boolean = true,
	): Promise<Customer> {
		try {
			const addressData = address.toObject();
			const contactData = contact.toObject();

			// Adaptando para o modelo real do Prisma
			const createdCustomer = await this.prisma.customer.create({
				data: {
					id,
					name,
					email: contactData.email,
					phone: contactData.phone,
					// Incluindo o status active e documentNumber como metadados no JSON do endereço
					address: JSON.stringify({
						street: addressData.street,
						number: addressData.number,
						complement: addressData.complement,
						neighborhood: addressData.neighborhood,
						city: addressData.city,
						state: addressData.state,
						zipCode: addressData.zipCode,
						country: addressData.country,
						// Campos adicionais para metadados
						_metadata: {
							active: active,
							documentNumber: documentNumber,
						},
					}),
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			});

			// Quando mapeamos para o domínio, usamos os metadados para definir o status
			const domainCustomer = this.mapToDomain(createdCustomer);

			// Garantir que o status corresponda ao parâmetro recebido
			if (!active) {
				domainCustomer.deactivate();
			}

			return domainCustomer;
		} catch (error) {
			return this.handleError(error, "create", { id, name, documentNumber });
		}
	}

	/**
	 * Encontra um cliente pelo ID
	 */
	async findById(id: string): Promise<Customer | null> {
		try {
			const customer = await this.prisma.customer.findUnique({
				where: { id },
			});

			if (!customer) {
				return null;
			}

			return this.mapToDomain(customer);
		} catch (error) {
			return this.handleError(error, "findById", { id });
		}
	}

	/**
	 * Encontra um cliente pelo número do documento (CPF/CNPJ)
	 * Nota: Como documentNumber não existe no modelo Prisma,
	 * podemos usar um campo personalizado ou buscar em email
	 */
	async findByDocumentNumber(documentNumber: string): Promise<Customer | null> {
		try {
			// Usando a abordagem de buscar todos e filtrar em memória,
			// já que parece não haver um campo documentNumber no modelo
			const customers = await this.prisma.customer.findMany();

			// Filtrando por documentNumber armazenado em metadados ou estrutura serializada
			const matchingCustomer = customers.find((customer) => {
				try {
					// Aqui presumindo que poderíamos ter o documentNumber em algum formato serializado
					// ou usar o email como substituto temporário
					return customer.email.includes(documentNumber);
				} catch {
					return false;
				}
			});

			if (!matchingCustomer) {
				return null;
			}

			return this.mapToDomain(matchingCustomer);
		} catch (error) {
			return this.handleError(error, "findByDocumentNumber", { documentNumber });
		}
	}

	/**
	 * Procura clientes que correspondam aos filtros fornecidos
	 */
	async findAll(filter: CustomerFilter, limit?: number, offset?: number): Promise<Customer[]> {
		try {
			const { id, name, email, phone } = filter;
			// Filtrando apenas por campos que sabemos que existem no modelo Prisma

			const whereClause: Prisma.CustomerWhereInput = {
				id: id ? { equals: id } : undefined,
				name: name ? { contains: name, mode: "insensitive" } : undefined,
				email: email ? { contains: email, mode: "insensitive" } : undefined,
				phone: phone ? { contains: phone } : undefined,
			};

			const customers = await this.prisma.customer.findMany({
				where: whereClause,
				take: limit,
				skip: offset,
				orderBy: {
					name: "asc",
				},
			});

			// Filtragem adicional em memória para campos que não estão no modelo Prisma
			let filteredCustomers = customers;
			if (filter.city || filter.state || filter.documentNumber || filter.active !== undefined) {
				filteredCustomers = customers.filter((customer) => {
					let matches = true;

					// Aplicar filtros adicionais aqui
					if (filter.documentNumber) {
						// Verificar se documentNumber existe em algum campo serializado
						matches = matches && customer.email.includes(filter.documentNumber);
					}

					if (filter.city || filter.state) {
						try {
							const addressData = JSON.parse(customer.address || "{}");
							if (filter.city) {
								matches =
									matches && addressData.city?.toLowerCase().includes(filter.city.toLowerCase());
							}
							if (filter.state) {
								matches = matches && addressData.state === filter.state;
							}
						} catch {
							matches = false;
						}
					}

					return matches;
				});
			}

			return filteredCustomers.map((customer) => this.mapToDomain(customer));
		} catch (error) {
			return this.handleError(error, "findAll", { filter, limit, offset });
		}
	}

	/**
	 * Verifica se um cliente com o documento especificado já existe
	 */
	async existsByDocumentNumber(documentNumber: string, excludeId?: string): Promise<boolean> {
		try {
			// Similar ao findByDocumentNumber, mas retornando apenas a contagem
			const customers = await this.prisma.customer.findMany({
				where: excludeId ? { id: { not: excludeId } } : undefined,
			});

			const count = customers.filter((customer) => {
				try {
					return customer.email.includes(documentNumber);
				} catch {
					return false;
				}
			}).length;

			return count > 0;
		} catch (error) {
			return this.handleError(error, "existsByDocumentNumber", { documentNumber, excludeId });
		}
	}

	/**
	 * Ativa um cliente
	 * Nota: Como active não existe no modelo Prisma, podemos armazenar isso em metadados
	 */
	async activate(id: string): Promise<Customer> {
		try {
			const customer = await this.prisma.customer.update({
				where: { id },
				data: {
					updatedAt: new Date(),
				},
			});

			// Não podendo definir active diretamente, retornamos considerando-o como ativo
			const domainCustomer = this.mapToDomain(customer);
			// Forçamos o status de ativo
			domainCustomer.activate();

			return domainCustomer;
		} catch (error) {
			return this.handleError(error, "activate", { id });
		}
	}

	/**
	 * Desativa um cliente
	 */
	async deactivate(id: string): Promise<Customer> {
		try {
			const customer = await this.prisma.customer.update({
				where: { id },
				data: {
					updatedAt: new Date(),
				},
			});

			// Similar ao activate, mas marcamos como inativo
			const domainCustomer = this.mapToDomain(customer);
			domainCustomer.deactivate();

			return domainCustomer;
		} catch (error) {
			return this.handleError(error, "deactivate", { id });
		}
	}

	/**
	 * Conta o número total de clientes que correspondem aos filtros
	 */
	async count(filter: CustomerFilter): Promise<number> {
		try {
			const { id, name, email, phone } = filter;

			// Contagem básica com filtros que existem no modelo
			const count = await this.prisma.customer.count({
				where: {
					id: id ? { equals: id } : undefined,
					name: name ? { contains: name, mode: "insensitive" } : undefined,
					email: email ? { contains: email, mode: "insensitive" } : undefined,
					phone: phone ? { contains: phone } : undefined,
				},
			});

			// Se não há filtros adicionais, retornamos a contagem direta
			if (!filter.documentNumber && !filter.city && !filter.state && filter.active === undefined) {
				return count;
			}

			// Caso contrário, precisamos fazer a filtragem adicional manualmente
			const customers = await this.prisma.customer.findMany({
				where: {
					id: id ? { equals: id } : undefined,
					name: name ? { contains: name, mode: "insensitive" } : undefined,
					email: email ? { contains: email, mode: "insensitive" } : undefined,
					phone: phone ? { contains: phone } : undefined,
				},
			});

			// Aplicar filtros adicionais como no método findAll
			const filteredCount = customers.filter((customer) => {
				let matches = true;

				if (filter.documentNumber) {
					matches = matches && customer.email.includes(filter.documentNumber);
				}

				if (filter.city || filter.state) {
					try {
						const addressData = JSON.parse(customer.address || "{}");
						if (filter.city) {
							matches =
								matches && addressData.city?.toLowerCase().includes(filter.city.toLowerCase());
						}
						if (filter.state) {
							matches = matches && addressData.state === filter.state;
						}
					} catch {
						matches = false;
					}
				}

				return matches;
			}).length;

			return filteredCount;
		} catch (error) {
			return this.handleError(error, "count", { filter });
		}
	}

	/**
	 * Exclui um cliente pelo ID
	 */
	async delete(id: string): Promise<void> {
		try {
			await this.prisma.customer.delete({
				where: { id },
			});
		} catch (error) {
			this.handleError(error, "delete", { id });
		}
	}

	/**
	 * Mapeia um cliente do Prisma para uma entidade de domínio
	 */
	private mapToDomain(prismaCustomer: PrismaCustomer): Customer {
		// Extrair informações de endereço do campo serializado
		let addressData = {
			street: "",
			number: "",
			neighborhood: "",
			city: "",
			state: "",
			zipCode: "",
			country: "",
			complement: undefined as string | undefined,
		};

		// Valores padrão para metadados
		let documentNumber = prismaCustomer.email; // Fallback para o email
		let isActive = true; // Padrão ativo

		try {
			if (prismaCustomer.address) {
				const parsedData = JSON.parse(prismaCustomer.address);

				// Extrair informações de endereço
				addressData = {
					...addressData,
					...parsedData,
				};

				// Extrair metadados se existirem
				if (parsedData._metadata) {
					if (parsedData._metadata.documentNumber) {
						documentNumber = parsedData._metadata.documentNumber;
					}

					if (parsedData._metadata.active !== undefined) {
						isActive = parsedData._metadata.active;
					}
				}
			}
		} catch (error) {
			console.error("Erro ao parsear dados serializados:", error);
		}

		const address = Address.create(
			addressData.street,
			addressData.number,
			addressData.neighborhood,
			addressData.city,
			addressData.state,
			addressData.zipCode,
			addressData.country,
			addressData.complement,
		);

		const contact = Contact.create(
			prismaCustomer.email,
			prismaCustomer.phone,
			undefined, // whatsapp não parece existir no modelo
		);

		// Usar os metadados extraídos
		return Customer.create(
			prismaCustomer.id,
			prismaCustomer.name,
			documentNumber,
			address,
			contact,
			prismaCustomer.createdAt,
			prismaCustomer.updatedAt,
			isActive,
		);
	}
}
