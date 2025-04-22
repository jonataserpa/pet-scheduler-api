import { Customer } from "../entities/customer.js";
import { Address } from "../entities/value-objects/address.js";
import { Contact } from "../entities/value-objects/contact.js";

export interface CustomerFilter {
	id?: string;
	name?: string;
	documentNumber?: string;
	email?: string;
	phone?: string;
	active?: boolean;
	city?: string;
	state?: string;
}

export interface CustomerRepository {
	/**
	 * Salva um cliente (cria ou atualiza)
	 * @param customer O cliente a ser salvo
	 */
	save(customer: Customer): Promise<Customer>;

	/**
	 * Cria um novo cliente
	 * @param customer O cliente a ser criado
	 */
	create(
		id: string,
		name: string,
		documentNumber: string,
		address: Address,
		contact: Contact,
		active?: boolean,
	): Promise<Customer>;

	/**
	 * Encontra um cliente pelo ID
	 * @param id O ID do cliente
	 */
	findById(id: string): Promise<Customer | null>;

	/**
	 * Encontra um cliente pelo número do documento (CPF/CNPJ)
	 * @param documentNumber O número do documento do cliente
	 */
	findByDocumentNumber(documentNumber: string): Promise<Customer | null>;

	/**
	 * Procura clientes que correspondam aos filtros fornecidos
	 * @param filter Os filtros para busca de clientes
	 * @param limit Limite de registros a serem retornados
	 * @param offset Deslocamento para paginação
	 */
	findAll(filter: CustomerFilter, limit?: number, offset?: number): Promise<Customer[]>;

	/**
	 * Verifica se um cliente com o documento especificado já existe
	 * @param documentNumber O número do documento a verificar
	 * @param excludeId ID de cliente a excluir da verificação (útil para atualizações)
	 */
	existsByDocumentNumber(documentNumber: string, excludeId?: string): Promise<boolean>;

	/**
	 * Ativa um cliente
	 * @param id O ID do cliente a ser ativado
	 */
	activate(id: string): Promise<Customer>;

	/**
	 * Desativa um cliente
	 * @param id O ID do cliente a ser desativado
	 */
	deactivate(id: string): Promise<Customer>;

	/**
	 * Conta o número total de clientes que correspondem aos filtros
	 * @param filter Os filtros para contagem de clientes
	 */
	count(filter: CustomerFilter): Promise<number>;

	/**
	 * Exclui um cliente pelo ID
	 * @param id O ID do cliente a ser excluído
	 */
	delete(id: string): Promise<void>;
}
