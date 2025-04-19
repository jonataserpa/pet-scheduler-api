import { Pet, PetSize } from '../entities/pet.js';

export interface PetFilter {
  id?: string;
  name?: string;
  species?: string;
  breed?: string;
  size?: PetSize;
  customerId?: string;
  active?: boolean;
  hasAllergies?: boolean;
}

export interface PetRepository {
  /**
   * Salva um pet (cria ou atualiza)
   * @param pet O pet a ser salvo
   */
  save(pet: Pet): Promise<Pet>;

  /**
   * Cria um novo pet
   * @param pet O pet a ser criado
   */
  create(
    id: string,
    name: string,
    species: string,
    size: PetSize,
    customerId: string,
    breed?: string,
    birthDate?: Date,
    allergies?: string,
    observations?: string,
    active?: boolean
  ): Promise<Pet>;

  /**
   * Encontra um pet pelo ID
   * @param id O ID do pet
   */
  findById(id: string): Promise<Pet | null>;

  /**
   * Procura pets que correspondam aos filtros fornecidos
   * @param filter Os filtros para busca de pets
   * @param limit Limite de registros a serem retornados
   * @param offset Deslocamento para paginação
   */
  findAll(filter: PetFilter, limit?: number, offset?: number): Promise<Pet[]>;

  /**
   * Encontra pets por cliente
   * @param customerId O ID do cliente
   * @param includeInactive Se deve incluir pets inativos
   */
  findByCustomerId(customerId: string, includeInactive?: boolean): Promise<Pet[]>;

  /**
   * Ativa um pet
   * @param id O ID do pet a ser ativado
   */
  activate(id: string): Promise<Pet>;

  /**
   * Desativa um pet
   * @param id O ID do pet a ser desativado
   */
  deactivate(id: string): Promise<Pet>;

  /**
   * Atualiza as alergias de um pet
   * @param id O ID do pet
   * @param allergies As alergias do pet
   */
  updateAllergies(id: string, allergies: string): Promise<Pet>;

  /**
   * Atualiza as observações de um pet
   * @param id O ID do pet
   * @param observations As observações do pet
   */
  updateObservations(id: string, observations: string): Promise<Pet>;

  /**
   * Conta o número total de pets que correspondem aos filtros
   * @param filter Os filtros para contagem de pets
   */
  count(filter: PetFilter): Promise<number>;

  /**
   * Exclui um pet pelo ID
   * @param id O ID do pet a ser excluído
   */
  delete(id: string): Promise<void>;
} 