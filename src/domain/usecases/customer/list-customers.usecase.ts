import { CustomerFilter, CustomerRepository } from "../../repositories/customer-repository.js";

export interface ListCustomersDTO {
	filter?: {
		name?: string;
		documentNumber?: string;
		email?: string;
		phone?: string;
		city?: string;
		state?: string;
		active?: boolean;
	};
	page?: number;
	limit?: number;
}

export interface ListCustomersResponseDTO {
	customers: Array<{
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
	}>;
	pagination: {
		total: number;
		page: number;
		limit: number;
		totalPages: number;
	};
}

/**
 * Caso de uso para listar clientes com filtros e paginação
 */
export class ListCustomersUseCase {
	constructor(private readonly customerRepository: CustomerRepository) {}

	/**
	 * Executa o caso de uso
	 * @param dto Parâmetros de filtragem e paginação
	 * @returns Lista de clientes paginada
	 */
	async execute(dto: ListCustomersDTO): Promise<ListCustomersResponseDTO> {
		const filter: CustomerFilter = {
			...dto.filter,
		};

		const page = dto.page || 1;
		const limit = dto.limit || 10;
		const offset = (page - 1) * limit;

		// Busca clientes com os filtros e paginação
		const customers = await this.customerRepository.findAll(filter, limit, offset);

		// Conta o total de registros para calcular a paginação
		const total = await this.customerRepository.count(filter);

		const totalPages = Math.ceil(total / limit);

		return {
			customers: customers.map((customer) => {
				const customerObject = customer.toObject();
				return {
					...customerObject,
					address: {
						...customerObject.address,
						formattedZipCode: customer.address.formatZipCode(),
					},
				};
			}),
			pagination: {
				total,
				page,
				limit,
				totalPages,
			},
		};
	}
}
