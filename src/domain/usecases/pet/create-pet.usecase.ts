import { randomUUID } from 'crypto';
import { Pet, PetSize } from '../../entities/pet.js';
import { CustomerRepository } from '../../repositories/customer-repository.js';
import { PetRepository } from '../../repositories/pet-repository.js';

export interface CreatePetDTO {
  name: string;
  species: string;
  size: PetSize;
  customerId: string;
  breed?: string;
  birthDate?: Date;
  allergies?: string;
  observations?: string;
}

export interface CreatePetResponseDTO {
  id: string;
  name: string;
  species: string;
  breed?: string;
  size: PetSize;
  birthDate?: Date;
  allergies?: string;
  observations?: string;
  customerId: string;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
}

export class CustomerNotFoundError extends Error {
  constructor(customerId: string) {
    super(`Cliente com ID ${customerId} não encontrado`);
    this.name = 'CustomerNotFoundError';
  }
}

/**
 * Caso de uso para criação de um novo pet
 */
export class CreatePetUseCase {
  constructor(
    private readonly petRepository: PetRepository,
    private readonly customerRepository: CustomerRepository
  ) {}

  /**
   * Executa o caso de uso
   * @param data Dados do pet a ser criado
   * @returns Pet criado
   * @throws CustomerNotFoundError se o cliente não existir
   */
  async execute(data: CreatePetDTO): Promise<CreatePetResponseDTO> {
    // Verifica se o cliente existe
    const customer = await this.customerRepository.findById(data.customerId);
    
    if (!customer) {
      throw new CustomerNotFoundError(data.customerId);
    }

    // Gera um ID único para o pet
    const id = randomUUID();

    // Cria a entidade de pet
    const pet = Pet.create(
      id,
      data.name,
      data.species,
      data.size,
      data.customerId,
      data.breed,
      data.birthDate,
      data.allergies,
      data.observations
    );

    // Persiste o pet
    const savedPet = await this.petRepository.save(pet);

    // Retorna o pet criado
    return savedPet.toObject();
  }
} 