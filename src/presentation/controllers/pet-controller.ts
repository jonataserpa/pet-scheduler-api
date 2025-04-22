import { Request, Response } from "express";
import { PetRepository } from "../../domain/repositories/pet-repository.js";
import { CustomerRepository } from "../../domain/repositories/customer-repository.js";
import { PetSize } from "../../domain/entities/pet.js";
import { logger } from "../../shared/utils/logger.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Controlador para gerenciamento de pets
 */
export class PetController {
	constructor(
		private readonly petRepository: PetRepository,
		private readonly customerRepository: CustomerRepository,
	) {}

	/**
	 * Lista todos os pets com filtros opcionais
	 */
	async listPets(req: Request, res: Response): Promise<void> {
		try {
			const {
				name,
				species,
				breed,
				size,
				customerId,
				active = true,
				hasAllergies,
			} = req.query as Record<string, string>;

			// Converter os parâmetros conforme necessário
			const sizeEnum = size as PetSize | undefined;
			const activeBoolean = active === "true";
			const hasAllergiesBoolean = hasAllergies === "true";

			const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
			const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

			// Montar o filtro
			const filter = {
				name,
				species,
				breed,
				size: sizeEnum,
				customerId,
				active: activeBoolean,
				hasAllergies: hasAllergiesBoolean,
			};

			// Buscar pets
			const pets = await this.petRepository.findAll(filter, limit, offset);
			const total = await this.petRepository.count(filter);

			// Mapear para objetos simples
			const petObjects = pets.map((pet) => pet.toObject());

			res.status(200).json({
				data: petObjects,
				meta: {
					total,
					limit,
					offset,
				},
			});
		} catch (error) {
			logger.error("Erro ao listar pets:", error);
			res.status(500).json({
				status: "error",
				message: "Erro ao processar a solicitação",
				error: (error as Error).message,
			});
		}
	}

	/**
	 * Busca um pet pelo ID
	 */
	async getPetById(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;

			const pet = await this.petRepository.findById(id);

			if (!pet) {
				res.status(404).json({
					status: "error",
					message: "Pet não encontrado",
				});
				return;
			}

			res.status(200).json({
				data: pet.toObject(),
			});
		} catch (error) {
			logger.error(`Erro ao buscar pet ${req.params.id}:`, error);
			res.status(500).json({
				status: "error",
				message: "Erro ao processar a solicitação",
				error: (error as Error).message,
			});
		}
	}

	/**
	 * Cria um novo pet
	 */
	async createPet(req: Request, res: Response): Promise<void> {
		try {
			const { name, species, breed, size, customerId, birthDate, allergies, observations } =
				req.body;

			// Validar se o cliente existe
			const customer = await this.customerRepository.findById(customerId);
			if (!customer) {
				res.status(404).json({
					status: "error",
					message: "Cliente não encontrado",
				});
				return;
			}

			// Validar se o tamanho do pet é válido
			if (!Object.values(PetSize).includes(size)) {
				res.status(400).json({
					status: "error",
					message: "Tamanho do pet inválido",
				});
				return;
			}

			// Validar data de nascimento (se fornecida)
			let birthDateObj: Date | undefined;
			if (birthDate) {
				birthDateObj = new Date(birthDate);
				if (isNaN(birthDateObj.getTime()) || birthDateObj > new Date()) {
					res.status(400).json({
						status: "error",
						message: "Data de nascimento inválida",
					});
					return;
				}
			}

			// Criar o pet
			const pet = await this.petRepository.create(
				uuidv4(),
				name,
				species,
				size as PetSize,
				customerId,
				breed,
				birthDateObj,
				allergies,
				observations,
			);

			res.status(201).json({
				status: "success",
				message: "Pet criado com sucesso",
				data: pet.toObject(),
			});
		} catch (error) {
			logger.error("Erro ao criar pet:", error);
			res.status(500).json({
				status: "error",
				message: "Erro ao processar a solicitação",
				error: (error as Error).message,
			});
		}
	}

	/**
	 * Atualiza um pet existente
	 */
	async updatePet(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			const { name, species, breed, size, birthDate, allergies, observations } = req.body;

			// Buscar o pet
			const pet = await this.petRepository.findById(id);
			if (!pet) {
				res.status(404).json({
					status: "error",
					message: "Pet não encontrado",
				});
				return;
			}

			// Validar se o tamanho do pet é válido (se fornecido)
			if (size && !Object.values(PetSize).includes(size)) {
				res.status(400).json({
					status: "error",
					message: "Tamanho do pet inválido",
				});
				return;
			}

			// Validar data de nascimento (se fornecida)
			let birthDateObj: Date | null | undefined;
			if (birthDate === null) {
				birthDateObj = null;
			} else if (birthDate) {
				birthDateObj = new Date(birthDate);
				if (isNaN(birthDateObj.getTime()) || birthDateObj > new Date()) {
					res.status(400).json({
						status: "error",
						message: "Data de nascimento inválida",
					});
					return;
				}
			}

			// Atualizar o pet
			pet.update(
				name,
				species,
				size as PetSize,
				breed,
				birthDateObj === null ? null : birthDateObj,
				allergies === null ? null : allergies,
				observations === null ? null : observations,
			);

			const updatedPet = await this.petRepository.save(pet);

			res.status(200).json({
				status: "success",
				message: "Pet atualizado com sucesso",
				data: updatedPet.toObject(),
			});
		} catch (error) {
			logger.error(`Erro ao atualizar pet ${req.params.id}:`, error);
			res.status(500).json({
				status: "error",
				message: "Erro ao processar a solicitação",
				error: (error as Error).message,
			});
		}
	}

	/**
	 * Ativa um pet
	 */
	async activatePet(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;

			const pet = await this.petRepository.findById(id);
			if (!pet) {
				res.status(404).json({
					status: "error",
					message: "Pet não encontrado",
				});
				return;
			}

			if (pet.active) {
				res.status(400).json({
					status: "error",
					message: "Pet já está ativo",
				});
				return;
			}

			const updatedPet = await this.petRepository.activate(id);

			res.status(200).json({
				status: "success",
				message: "Pet ativado com sucesso",
				data: updatedPet.toObject(),
			});
		} catch (error) {
			logger.error(`Erro ao ativar pet ${req.params.id}:`, error);
			res.status(500).json({
				status: "error",
				message: "Erro ao processar a solicitação",
				error: (error as Error).message,
			});
		}
	}

	/**
	 * Desativa um pet
	 */
	async deactivatePet(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;

			const pet = await this.petRepository.findById(id);
			if (!pet) {
				res.status(404).json({
					status: "error",
					message: "Pet não encontrado",
				});
				return;
			}

			if (!pet.active) {
				res.status(400).json({
					status: "error",
					message: "Pet já está inativo",
				});
				return;
			}

			const updatedPet = await this.petRepository.deactivate(id);

			res.status(200).json({
				status: "success",
				message: "Pet desativado com sucesso",
				data: updatedPet.toObject(),
			});
		} catch (error) {
			logger.error(`Erro ao desativar pet ${req.params.id}:`, error);
			res.status(500).json({
				status: "error",
				message: "Erro ao processar a solicitação",
				error: (error as Error).message,
			});
		}
	}

	/**
	 * Busca pets de um cliente
	 */
	async getPetsByCustomer(req: Request, res: Response): Promise<void> {
		try {
			const { customerId } = req.params;
			const includeInactive = req.query.includeInactive === "true";

			// Validar se o cliente existe
			const customer = await this.customerRepository.findById(customerId);
			if (!customer) {
				res.status(404).json({
					status: "error",
					message: "Cliente não encontrado",
				});
				return;
			}

			const pets = await this.petRepository.findByCustomerId(customerId, includeInactive);

			// Mapear para objetos simples
			const petObjects = pets.map((pet) => pet.toObject());

			res.status(200).json({
				data: petObjects,
				meta: {
					total: petObjects.length,
					customerId,
				},
			});
		} catch (error) {
			logger.error(`Erro ao buscar pets do cliente ${req.params.customerId}:`, error);
			res.status(500).json({
				status: "error",
				message: "Erro ao processar a solicitação",
				error: (error as Error).message,
			});
		}
	}
}
