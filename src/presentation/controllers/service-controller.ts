import { Request, Response } from "express";
import { ServiceRepository } from "../../domain/repositories/service-repository.js";
import { PetSize } from "../../domain/entities/pet.js";
import { logger } from "../../shared/utils/logger.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Controlador para gerenciamento de serviços
 */
export class ServiceController {
	constructor(private readonly serviceRepository: ServiceRepository) {}

	/**
	 * Lista todos os serviços com filtros opcionais
	 */
	async listServices(req: Request, res: Response): Promise<void> {
		try {
			const {
				name,
				minPrice,
				maxPrice,
				minDuration,
				maxDuration,
				petSize,
				active = true,
			} = req.query as Record<string, string>;

			// Converter os parâmetros numéricos
			const minPriceNum = minPrice ? parseFloat(minPrice) : undefined;
			const maxPriceNum = maxPrice ? parseFloat(maxPrice) : undefined;
			const minDurationNum = minDuration ? parseInt(minDuration) : undefined;
			const maxDurationNum = maxDuration ? parseInt(maxDuration) : undefined;
			const activeBoolean = active === "true";
			const petSizeEnum = petSize as PetSize | undefined;

			const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
			const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

			// Montar o filtro
			const filter = {
				name,
				minPrice: minPriceNum,
				maxPrice: maxPriceNum,
				minDuration: minDurationNum,
				maxDuration: maxDurationNum,
				petSize: petSizeEnum,
				active: activeBoolean,
			};

			// Buscar serviços
			const services = await this.serviceRepository.findAll(filter, limit, offset);
			const total = await this.serviceRepository.count(filter);

			// Mapear para objetos simples
			const serviceObjects = services.map((service) => service.toObject());

			res.status(200).json({
				data: serviceObjects,
				meta: {
					total,
					limit,
					offset,
				},
			});
		} catch (error) {
			logger.error("Erro ao listar serviços:", error);
			res.status(500).json({
				status: "error",
				message: "Erro ao processar a solicitação",
				error: (error as Error).message,
			});
		}
	}

	/**
	 * Busca um serviço pelo ID
	 */
	async getServiceById(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;

			const service = await this.serviceRepository.findById(id);

			if (!service) {
				res.status(404).json({
					status: "error",
					message: "Serviço não encontrado",
				});
				return;
			}

			res.status(200).json({
				data: service.toObject(),
			});
		} catch (error) {
			logger.error(`Erro ao buscar serviço ${req.params.id}:`, error);
			res.status(500).json({
				status: "error",
				message: "Erro ao processar a solicitação",
				error: (error as Error).message,
			});
		}
	}

	/**
	 * Cria um novo serviço
	 */
	async createService(req: Request, res: Response): Promise<void> {
		try {
			const { name, description, duration, price, petSizes } = req.body;

			// Validar se os tamanhos de pet são válidos
			if (!Array.isArray(petSizes) || petSizes.length === 0) {
				res.status(400).json({
					status: "error",
					message: "Pelo menos um tamanho de pet deve ser especificado",
				});
				return;
			}

			for (const size of petSizes) {
				if (!Object.values(PetSize).includes(size)) {
					res.status(400).json({
						status: "error",
						message: `Tamanho de pet inválido: ${size}`,
					});
					return;
				}
			}

			// Validar duração e preço
			if (!Number.isInteger(duration) || duration <= 0) {
				res.status(400).json({
					status: "error",
					message: "Duração deve ser um número inteiro positivo em minutos",
				});
				return;
			}

			if (isNaN(price) || price <= 0) {
				res.status(400).json({
					status: "error",
					message: "Preço deve ser um número positivo",
				});
				return;
			}

			// Criar o serviço
			const service = await this.serviceRepository.create(
				uuidv4(),
				name,
				duration,
				price,
				petSizes,
				description,
			);

			res.status(201).json({
				status: "success",
				message: "Serviço criado com sucesso",
				data: service.toObject(),
			});
		} catch (error) {
			logger.error("Erro ao criar serviço:", error);
			res.status(500).json({
				status: "error",
				message: "Erro ao processar a solicitação",
				error: (error as Error).message,
			});
		}
	}

	/**
	 * Atualiza um serviço existente
	 */
	async updateService(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			const { name, description, duration, price, petSizes } = req.body;

			// Buscar o serviço
			const service = await this.serviceRepository.findById(id);
			if (!service) {
				res.status(404).json({
					status: "error",
					message: "Serviço não encontrado",
				});
				return;
			}

			// Validações
			if (petSizes) {
				if (!Array.isArray(petSizes) || petSizes.length === 0) {
					res.status(400).json({
						status: "error",
						message: "Pelo menos um tamanho de pet deve ser especificado",
					});
					return;
				}

				for (const size of petSizes) {
					if (!Object.values(PetSize).includes(size)) {
						res.status(400).json({
							status: "error",
							message: `Tamanho de pet inválido: ${size}`,
						});
						return;
					}
				}
			}

			if (duration !== undefined && (!Number.isInteger(duration) || duration <= 0)) {
				res.status(400).json({
					status: "error",
					message: "Duração deve ser um número inteiro positivo em minutos",
				});
				return;
			}

			if (price !== undefined && (isNaN(price) || price <= 0)) {
				res.status(400).json({
					status: "error",
					message: "Preço deve ser um número positivo",
				});
				return;
			}

			// Atualizar o serviço
			service.update(
				name || service.name,
				duration || service.duration,
				price || service.price,
				petSizes || service.petSizes,
				description !== undefined ? description : service.description,
			);

			const updatedService = await this.serviceRepository.save(service);

			res.status(200).json({
				status: "success",
				message: "Serviço atualizado com sucesso",
				data: updatedService.toObject(),
			});
		} catch (error) {
			logger.error(`Erro ao atualizar serviço ${req.params.id}:`, error);
			res.status(500).json({
				status: "error",
				message: "Erro ao processar a solicitação",
				error: (error as Error).message,
			});
		}
	}

	/**
	 * Ativa um serviço
	 */
	async activateService(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;

			const service = await this.serviceRepository.findById(id);
			if (!service) {
				res.status(404).json({
					status: "error",
					message: "Serviço não encontrado",
				});
				return;
			}

			if (service.active) {
				res.status(400).json({
					status: "error",
					message: "Serviço já está ativo",
				});
				return;
			}

			const updatedService = await this.serviceRepository.activate(id);

			res.status(200).json({
				status: "success",
				message: "Serviço ativado com sucesso",
				data: updatedService.toObject(),
			});
		} catch (error) {
			logger.error(`Erro ao ativar serviço ${req.params.id}:`, error);
			res.status(500).json({
				status: "error",
				message: "Erro ao processar a solicitação",
				error: (error as Error).message,
			});
		}
	}

	/**
	 * Desativa um serviço
	 */
	async deactivateService(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;

			const service = await this.serviceRepository.findById(id);
			if (!service) {
				res.status(404).json({
					status: "error",
					message: "Serviço não encontrado",
				});
				return;
			}

			if (!service.active) {
				res.status(400).json({
					status: "error",
					message: "Serviço já está inativo",
				});
				return;
			}

			const updatedService = await this.serviceRepository.deactivate(id);

			res.status(200).json({
				status: "success",
				message: "Serviço desativado com sucesso",
				data: updatedService.toObject(),
			});
		} catch (error) {
			logger.error(`Erro ao desativar serviço ${req.params.id}:`, error);
			res.status(500).json({
				status: "error",
				message: "Erro ao processar a solicitação",
				error: (error as Error).message,
			});
		}
	}

	/**
	 * Busca serviços compatíveis com um tamanho de pet
	 */
	async getServicesByPetSize(req: Request, res: Response): Promise<void> {
		try {
			const { size } = req.params;

			// Validar se o tamanho do pet é válido
			if (!Object.values(PetSize).includes(size as PetSize)) {
				res.status(400).json({
					status: "error",
					message: "Tamanho de pet inválido",
				});
				return;
			}

			const services = await this.serviceRepository.findByPetSize(size as PetSize);

			// Mapear para objetos simples
			const serviceObjects = services.map((service) => service.toObject());

			res.status(200).json({
				data: serviceObjects,
				meta: {
					total: serviceObjects.length,
					petSize: size,
				},
			});
		} catch (error) {
			logger.error(`Erro ao buscar serviços por tamanho ${req.params.size}:`, error);
			res.status(500).json({
				status: "error",
				message: "Erro ao processar a solicitação",
				error: (error as Error).message,
			});
		}
	}
}
