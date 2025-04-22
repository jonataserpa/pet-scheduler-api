import { Pet, PetSize } from "../../domain/entities/pet.js";
import { PetFilter, PetRepository } from "../../domain/repositories/pet-repository.js";
import { PrismaRepositoryBase } from "./base/prisma-repository-base.js";
import { Pet as PrismaPet, PetSize as PrismaPetSize } from "@prisma/client";

// Ampliando o tipo PrismaPet para incluir a propriedade active
interface ExtendedPrismaPet extends PrismaPet {
	active: boolean;
}

/**
 * Implementação do repositório de pets usando Prisma
 */
export class PrismaPetRepository extends PrismaRepositoryBase implements PetRepository {
	/**
	 * Salva um pet (cria ou atualiza)
	 */
	async save(pet: Pet): Promise<Pet> {
		try {
			const data: any = {
				name: pet.name,
				species: pet.species,
				breed: pet.breed || null,
				size: this.mapSizeToPrisma(pet.size),
				birthDate: pet.birthDate || null,
				allergies: pet.allergies || null,
				observations: pet.observations || null,
				updatedAt: new Date(),
				active: pet.active,
			};

			const updatedPet = await this.prisma.pet.update({
				where: { id: pet.id },
				data,
			});

			return this.mapToDomain(updatedPet as ExtendedPrismaPet);
		} catch (error) {
			return this.handleError(error, "save", { petId: pet.id });
		}
	}

	/**
	 * Cria um novo pet
	 */
	async create(
		id: string,
		name: string,
		species: string,
		size: PetSize,
		customerId: string,
		breed?: string,
		birthDate?: Date,
		allergies?: string,
		observations?: string,
		active: boolean = true,
	): Promise<Pet> {
		try {
			const data: any = {
				id,
				name,
				species,
				size: this.mapSizeToPrisma(size),
				customerId,
				breed: breed || null,
				birthDate: birthDate || null,
				allergies: allergies || null,
				observations: observations || null,
				createdAt: new Date(),
				updatedAt: new Date(),
				active,
			};

			const createdPet = await this.prisma.pet.create({
				data,
			});

			return this.mapToDomain(createdPet as ExtendedPrismaPet);
		} catch (error) {
			return this.handleError(error, "create", { id, name, species, customerId });
		}
	}

	/**
	 * Encontra um pet pelo ID
	 */
	async findById(id: string): Promise<Pet | null> {
		try {
			const pet = await this.prisma.pet.findUnique({
				where: { id },
			});

			if (!pet) {
				return null;
			}

			return this.mapToDomain(pet as ExtendedPrismaPet);
		} catch (error) {
			return this.handleError(error, "findById", { id });
		}
	}

	/**
	 * Procura pets que correspondam aos filtros fornecidos
	 */
	async findAll(filter: PetFilter, limit?: number, offset?: number): Promise<Pet[]> {
		try {
			const { id, name, species, breed, size, customerId, active, hasAllergies } = filter;

			// Usando any para contornar verificação de tipo no objeto where
			const where: any = {
				id: id ? { equals: id } : undefined,
				name: name ? { contains: name, mode: "insensitive" } : undefined,
				species: species ? { contains: species, mode: "insensitive" } : undefined,
				breed: breed ? { contains: breed, mode: "insensitive" } : undefined,
				size: size ? { equals: size } : undefined,
				customerId: customerId ? { equals: customerId } : undefined,
				allergies: hasAllergies ? { not: null } : undefined,
			};

			// Adicionar active apenas se definido
			if (active !== undefined) {
				where.active = active;
			}

			const pets = await this.prisma.pet.findMany({
				where,
				take: limit,
				skip: offset,
				orderBy: {
					name: "asc",
				},
			});

			return pets.map((pet) => this.mapToDomain(pet as ExtendedPrismaPet));
		} catch (error) {
			return this.handleError(error, "findAll", { filter, limit, offset });
		}
	}

	/**
	 * Encontra pets por cliente
	 */
	async findByCustomerId(customerId: string, includeInactive: boolean = false): Promise<Pet[]> {
		try {
			// Usando any para contornar verificação de tipo
			const where: any = { customerId };

			// Adicionar filtro de active apenas se não incluir inativos
			if (!includeInactive) {
				where.active = true;
			}

			const pets = await this.prisma.pet.findMany({
				where,
				orderBy: {
					name: "asc",
				},
			});

			return pets.map((pet) => this.mapToDomain(pet as ExtendedPrismaPet));
		} catch (error) {
			return this.handleError(error, "findByCustomerId", { customerId, includeInactive });
		}
	}

	/**
	 * Ativa um pet
	 */
	async activate(id: string): Promise<Pet> {
		try {
			// Usando any para contornar verificação de tipo
			const data: any = {
				active: true,
				updatedAt: new Date(),
			};

			const pet = await this.prisma.pet.update({
				where: { id },
				data,
			});

			return this.mapToDomain(pet as ExtendedPrismaPet);
		} catch (error) {
			return this.handleError(error, "activate", { id });
		}
	}

	/**
	 * Desativa um pet
	 */
	async deactivate(id: string): Promise<Pet> {
		try {
			// Usando any para contornar verificação de tipo
			const data: any = {
				active: false,
				updatedAt: new Date(),
			};

			const pet = await this.prisma.pet.update({
				where: { id },
				data,
			});

			return this.mapToDomain(pet as ExtendedPrismaPet);
		} catch (error) {
			return this.handleError(error, "deactivate", { id });
		}
	}

	/**
	 * Atualiza as alergias de um pet
	 */
	async updateAllergies(id: string, allergies: string): Promise<Pet> {
		try {
			const pet = await this.prisma.pet.update({
				where: { id },
				data: {
					allergies,
					updatedAt: new Date(),
				},
			});

			return this.mapToDomain(pet as ExtendedPrismaPet);
		} catch (error) {
			return this.handleError(error, "updateAllergies", { id, allergies });
		}
	}

	/**
	 * Atualiza as observações de um pet
	 */
	async updateObservations(id: string, observations: string): Promise<Pet> {
		try {
			const pet = await this.prisma.pet.update({
				where: { id },
				data: {
					observations,
					updatedAt: new Date(),
				},
			});

			return this.mapToDomain(pet as ExtendedPrismaPet);
		} catch (error) {
			return this.handleError(error, "updateObservations", { id, observations });
		}
	}

	/**
	 * Conta o número total de pets que correspondem aos filtros
	 */
	async count(filter: PetFilter): Promise<number> {
		try {
			const { id, name, species, breed, size, customerId, active, hasAllergies } = filter;

			// Usando any para contornar verificação de tipo no objeto where
			const where: any = {
				id: id ? { equals: id } : undefined,
				name: name ? { contains: name, mode: "insensitive" } : undefined,
				species: species ? { contains: species, mode: "insensitive" } : undefined,
				breed: breed ? { contains: breed, mode: "insensitive" } : undefined,
				size: size ? { equals: size } : undefined,
				customerId: customerId ? { equals: customerId } : undefined,
				allergies: hasAllergies ? { not: null } : undefined,
			};

			// Adicionar active apenas se definido
			if (active !== undefined) {
				where.active = active;
			}

			return await this.prisma.pet.count({
				where,
			});
		} catch (error) {
			return this.handleError(error, "count", { filter });
		}
	}

	/**
	 * Exclui um pet pelo ID
	 */
	async delete(id: string): Promise<void> {
		try {
			await this.prisma.pet.delete({
				where: { id },
			});
		} catch (error) {
			this.handleError(error, "delete", { id });
		}
	}

	/**
	 * Mapeia um pet do Prisma para uma entidade de domínio
	 */
	private mapToDomain(prismaPet: ExtendedPrismaPet): Pet {
		return Pet.create(
			prismaPet.id,
			prismaPet.name,
			prismaPet.species,
			this.mapSizeToDomain(prismaPet.size),
			prismaPet.customerId,
			prismaPet.breed || undefined,
			prismaPet.birthDate || undefined,
			prismaPet.allergies || undefined,
			prismaPet.observations || undefined,
			prismaPet.createdAt,
			prismaPet.updatedAt,
			prismaPet.active,
		);
	}

	/**
	 * Mapeia o enum PetSize do domínio para o enum PetSize do Prisma
	 */
	private mapSizeToPrisma(size: PetSize): PrismaPetSize {
		return size as unknown as PrismaPetSize;
	}

	/**
	 * Mapeia o enum PetSize do Prisma para o enum PetSize do domínio
	 */
	private mapSizeToDomain(size: PrismaPetSize): PetSize {
		return size as unknown as PetSize;
	}
}
