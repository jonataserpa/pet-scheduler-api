import { Pet, PetSize } from "../../../domain/entities/pet.js";
import { CustomerRepository } from "../../../domain/repositories/customer-repository.js";
import { PetRepository } from "../../../domain/repositories/pet-repository.js";
import { logger } from "../../../shared/utils/logger.js";
import { Result } from "../../../shared/utils/result.js";

interface RegisterPetRequest {
	id?: string;
	name: string;
	species: string;
	breed?: string;
	size: PetSize;
	birthDate?: Date;
	allergies?: string;
	observations?: string;
	customerId: string;
}

interface RegisterPetResponse {
	pet: Pet;
}

/**
 * Caso de uso para registro de um novo pet
 */
export class RegisterPetUseCase {
	/**
	 * Cria uma nova instância do caso de uso
	 * @param petRepository Repositório de pets
	 * @param customerRepository Repositório de clientes
	 */
	constructor(
		private readonly petRepository: PetRepository,
		private readonly customerRepository: CustomerRepository,
	) {}

	/**
	 * Executa o caso de uso
	 * @param request Dados para registro do pet
	 */
	async execute(request: RegisterPetRequest): Promise<Result<RegisterPetResponse>> {
		try {
			logger.info("Iniciando registro de pet", {
				name: request.name,
				species: request.species,
				customerId: request.customerId,
			});

			// Verificar se o cliente existe
			const customer = await this.customerRepository.findById(request.customerId);
			if (!customer) {
				logger.warn("Cliente não encontrado para registro de pet", {
					customerId: request.customerId,
				});
				return Result.fail({
					message: `Cliente não encontrado com ID: ${request.customerId}`,
					code: "CUSTOMER_NOT_FOUND",
				});
			}

			// Validar porte do pet se for de porte grande
			if (request.size === PetSize.LARGE) {
				// Verificar se o sistema permite pets de porte grande
				// Pode haver restrições em serviços específicos que não atendem pets grandes
				logger.info(
					"Pet de porte grande registrado - alertando cliente sobre restrições potenciais",
					{
						customerId: request.customerId,
						petSize: request.size,
					},
				);
			}

			// Verificar alergias
			if (request.allergies && request.allergies.trim() !== "") {
				logger.info("Pet com alergias registrado - marcando para cuidados especiais", {
					customerId: request.customerId,
					allergies: request.allergies,
				});
			}

			// Criar o pet
			const petId = request.id || crypto.randomUUID();
			const pet = await this.petRepository.create(
				petId,
				request.name,
				request.species,
				request.size,
				request.customerId,
				request.breed,
				request.birthDate,
				request.allergies,
				request.observations,
				true, // pet sempre começa ativo
			);

			logger.info("Pet registrado com sucesso", {
				petId: pet.id,
				customerId: request.customerId,
			});

			return Result.ok({ pet });
		} catch (error) {
			logger.error("Erro ao registrar pet", { error, request });
			return Result.fail({
				message: error instanceof Error ? error.message : "Erro ao registrar pet",
				details: error,
			});
		}
	}
}
