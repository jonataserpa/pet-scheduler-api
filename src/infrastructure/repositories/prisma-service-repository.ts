import { Service } from "../../domain/entities/service.js";
import { ServiceFilter, ServiceRepository } from "../../domain/repositories/service-repository.js";
import { PrismaRepositoryBase } from "./base/prisma-repository-base.js";
import { PetSize } from "../../domain/entities/pet.js";

type PrismaServiceResult = {
	id: string;
	name: string;
	description: string | null;
	duration: number;
	price: number;
	createdAt: Date;
	updatedAt: Date;
	active: boolean;
	petSizes: string[];
};

/**
 * Implementação do repositório de serviços usando Prisma
 */
export class PrismaServiceRepository extends PrismaRepositoryBase implements ServiceRepository {
	/**
	 * Salva um serviço (cria ou atualiza)
	 */
	async save(service: Service): Promise<Service> {
		try {
			const petSizesJson = service.petSizes.map((size) => size.toString());

			const data: any = {
				name: service.name,
				description: service.description || null,
				duration: service.duration,
				price: service.price,
				updatedAt: new Date(),
				active: service.active,
				petSizes: petSizesJson,
			};

			const updatedService = await this.prisma.service.update({
				where: { id: service.id },
				data,
			});

			return this.mapToDomain(updatedService as PrismaServiceResult);
		} catch (error) {
			return this.handleError(error, "save", { serviceId: service.id });
		}
	}

	/**
	 * Cria um novo serviço
	 */
	async create(
		id: string,
		name: string,
		duration: number,
		price: number,
		petSizes: PetSize[],
		description?: string,
		active: boolean = true,
	): Promise<Service> {
		try {
			const petSizesJson = petSizes.map((size) => size.toString());

			const data: any = {
				id,
				name,
				description: description || null,
				duration,
				price,
				active,
				createdAt: new Date(),
				updatedAt: new Date(),
				petSizes: petSizesJson,
			};

			const createdService = await this.prisma.service.create({
				data,
			});

			return this.mapToDomain(createdService as PrismaServiceResult);
		} catch (error) {
			return this.handleError(error, "create", { id, name, duration });
		}
	}

	/**
	 * Encontra um serviço pelo ID
	 */
	async findById(id: string): Promise<Service | null> {
		try {
			const service = await this.prisma.service.findUnique({
				where: { id },
			});

			if (!service) {
				return null;
			}

			return this.mapToDomain(service as PrismaServiceResult);
		} catch (error) {
			return this.handleError(error, "findById", { id });
		}
	}

	/**
	 * Procura serviços que correspondam aos filtros fornecidos
	 */
	async findAll(filter: ServiceFilter, limit?: number, offset?: number): Promise<Service[]> {
		try {
			const { id, name, minPrice, maxPrice, minDuration, maxDuration, active, petSize } = filter;

			const where: any = {
				id: id ? { equals: id } : undefined,
				name: name ? { contains: name, mode: "insensitive" } : undefined,
				price: {
					gte: minPrice !== undefined ? minPrice : undefined,
					lte: maxPrice !== undefined ? maxPrice : undefined,
				},
				duration: {
					gte: minDuration !== undefined ? minDuration : undefined,
					lte: maxDuration !== undefined ? maxDuration : undefined,
				},
				active: active !== undefined ? active : undefined,
			};

			if (petSize) {
				where.petSizes = {
					has: petSize.toString(),
				};
			}

			const services = await this.prisma.service.findMany({
				where,
				skip: offset,
				take: limit,
				orderBy: {
					name: "asc",
				},
			});

			return services.map((service) => this.mapToDomain(service as PrismaServiceResult));
		} catch (error) {
			return this.handleError(error, "findAll", { filter, limit, offset });
		}
	}

	/**
	 * Encontra serviços por categoria
	 */
	async findByCategory(categoryName: string, includeInactive: boolean = false): Promise<Service[]> {
		try {
			const where: any = {
				name: { contains: categoryName, mode: "insensitive" },
				description: { contains: categoryName, mode: "insensitive" },
			};

			if (!includeInactive) {
				where.active = true;
			}

			const services = await this.prisma.service.findMany({
				where,
				orderBy: {
					name: "asc",
				},
			});

			return services.map((service) => this.mapToDomain(service as PrismaServiceResult));
		} catch (error) {
			return this.handleError(error, "findByCategory", { categoryName, includeInactive });
		}
	}

	/**
	 * Ativa um serviço
	 */
	async activate(id: string): Promise<Service> {
		try {
			const data: any = {
				active: true,
				updatedAt: new Date(),
			};

			const service = await this.prisma.service.update({
				where: { id },
				data,
			});

			return this.mapToDomain(service as PrismaServiceResult);
		} catch (error) {
			return this.handleError(error, "activate", { id });
		}
	}

	/**
	 * Desativa um serviço
	 */
	async deactivate(id: string): Promise<Service> {
		try {
			const data: any = {
				active: false,
				updatedAt: new Date(),
			};

			const service = await this.prisma.service.update({
				where: { id },
				data,
			});

			return this.mapToDomain(service as PrismaServiceResult);
		} catch (error) {
			return this.handleError(error, "deactivate", { id });
		}
	}

	/**
	 * Atualiza a descrição de um serviço
	 */
	async updateDescription(id: string, description: string): Promise<Service> {
		try {
			const service = await this.prisma.service.update({
				where: { id },
				data: {
					description,
					updatedAt: new Date(),
				},
			});

			return this.mapToDomain(service as PrismaServiceResult);
		} catch (error) {
			return this.handleError(error, "updateDescription", { id, description });
		}
	}

	/**
	 * Atualiza o preço de um serviço
	 */
	async updatePrice(id: string, price: number): Promise<Service> {
		try {
			const service = await this.prisma.service.update({
				where: { id },
				data: {
					price,
					updatedAt: new Date(),
				},
			});

			return this.mapToDomain(service as PrismaServiceResult);
		} catch (error) {
			return this.handleError(error, "updatePrice", { id, price });
		}
	}

	/**
	 * Atualiza a duração de um serviço
	 */
	async updateDuration(id: string, duration: number): Promise<Service> {
		try {
			const service = await this.prisma.service.update({
				where: { id },
				data: {
					duration,
					updatedAt: new Date(),
				},
			});

			return this.mapToDomain(service as PrismaServiceResult);
		} catch (error) {
			return this.handleError(error, "updateDuration", { id, duration });
		}
	}

	/**
	 * Conta o número total de serviços que correspondem aos filtros
	 */
	async count(filter: ServiceFilter): Promise<number> {
		try {
			const { id, name, minPrice, maxPrice, minDuration, maxDuration, active, petSize } = filter;

			const where: any = {
				id: id ? { equals: id } : undefined,
				name: name ? { contains: name, mode: "insensitive" } : undefined,
				price: {
					gte: minPrice !== undefined ? minPrice : undefined,
					lte: maxPrice !== undefined ? maxPrice : undefined,
				},
				duration: {
					gte: minDuration !== undefined ? minDuration : undefined,
					lte: maxDuration !== undefined ? maxDuration : undefined,
				},
				active: active !== undefined ? active : undefined,
			};

			if (petSize) {
				where.petSizes = {
					has: petSize.toString(),
				};
			}

			return await this.prisma.service.count({
				where,
			});
		} catch (error) {
			return this.handleError(error, "count", { filter });
		}
	}

	/**
	 * Exclui um serviço pelo ID
	 */
	async delete(id: string): Promise<void> {
		try {
			await this.prisma.service.delete({
				where: { id },
			});
		} catch (error) {
			this.handleError(error, "delete", { id });
		}
	}

	/**
	 * Mapeia um serviço do Prisma para uma entidade de domínio
	 */
	private mapToDomain(prismaService: PrismaServiceResult): Service {
		const petSizesEnum = Array.isArray(prismaService.petSizes)
			? prismaService.petSizes.map((size) => size as unknown as PetSize)
			: [];

		return Service.create(
			prismaService.id,
			prismaService.name,
			prismaService.duration,
			prismaService.price,
			petSizesEnum,
			prismaService.description || undefined,
			prismaService.createdAt,
			prismaService.updatedAt,
			prismaService.active,
		);
	}

	/**
	 * Implementação do método findByPetSize requerido pela interface
	 */
	async findByPetSize(petSize: PetSize, activeOnly: boolean = true): Promise<Service[]> {
		try {
			const where: any = {
				petSizes: {
					has: petSize.toString(),
				},
			};

			if (activeOnly) {
				where.active = true;
			}

			const services = await this.prisma.service.findMany({
				where,
				orderBy: {
					name: "asc",
				},
			});

			return services.map((service) => this.mapToDomain(service as PrismaServiceResult));
		} catch (error) {
			return this.handleError(error, "findByPetSize", { petSize, activeOnly });
		}
	}
}
