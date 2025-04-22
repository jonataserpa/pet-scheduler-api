import { Service } from "../entities/service.js";
import { PetSize } from "../entities/pet.js";

export interface ServiceFilter {
	id?: string;
	name?: string;
	minPrice?: number;
	maxPrice?: number;
	minDuration?: number;
	maxDuration?: number;
	petSize?: PetSize;
	active?: boolean;
}

export interface ServiceRepository {
	/**
	 * Salva um serviço (cria ou atualiza)
	 * @param service O serviço a ser salvo
	 */
	save(service: Service): Promise<Service>;

	/**
	 * Cria um novo serviço
	 * @param service O serviço a ser criado
	 */
	create(
		id: string,
		name: string,
		duration: number,
		price: number,
		petSizes: PetSize[],
		description?: string,
		active?: boolean,
	): Promise<Service>;

	/**
	 * Encontra um serviço pelo ID
	 * @param id O ID do serviço
	 */
	findById(id: string): Promise<Service | null>;

	/**
	 * Procura serviços que correspondam aos filtros fornecidos
	 * @param filter Os filtros para busca de serviços
	 * @param limit Limite de registros a serem retornados
	 * @param offset Deslocamento para paginação
	 */
	findAll(filter: ServiceFilter, limit?: number, offset?: number): Promise<Service[]>;

	/**
	 * Encontra serviços compatíveis com um tamanho de pet específico
	 * @param petSize O tamanho do pet
	 * @param activeOnly Se deve incluir apenas serviços ativos
	 */
	findByPetSize(petSize: PetSize, activeOnly?: boolean): Promise<Service[]>;

	/**
	 * Ativa um serviço
	 * @param id O ID do serviço a ser ativado
	 */
	activate(id: string): Promise<Service>;

	/**
	 * Desativa um serviço
	 * @param id O ID do serviço a ser desativado
	 */
	deactivate(id: string): Promise<Service>;

	/**
	 * Atualiza o preço de um serviço
	 * @param id O ID do serviço
	 * @param price O novo preço do serviço
	 */
	updatePrice(id: string, price: number): Promise<Service>;

	/**
	 * Atualiza a duração de um serviço
	 * @param id O ID do serviço
	 * @param duration A nova duração do serviço em minutos
	 */
	updateDuration(id: string, duration: number): Promise<Service>;

	/**
	 * Conta o número total de serviços que correspondem aos filtros
	 * @param filter Os filtros para contagem de serviços
	 */
	count(filter: ServiceFilter): Promise<number>;

	/**
	 * Exclui um serviço pelo ID
	 * @param id O ID do serviço a ser excluído
	 */
	delete(id: string): Promise<void>;
}
