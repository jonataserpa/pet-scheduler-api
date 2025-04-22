import { LoginHistory } from "../entities/login-history.js";

export interface LoginHistoryFilter {
	email?: string;
	userId?: string;
	status?: "success" | "failed" | "blocked";
	ipAddress?: string;
	startDate?: Date;
	endDate?: Date;
}

export interface LoginHistoryRepository {
	/**
	 * Salva um registro de histórico de login
	 * @param loginHistory O registro de histórico a ser salvo
	 */
	save(loginHistory: LoginHistory): Promise<void>;

	/**
	 * Recupera históricos de login de acordo com os filtros fornecidos
	 * @param filter Filtros para busca de históricos de login
	 * @param limit Limite de registros a serem retornados
	 * @param offset Deslocamento para paginação
	 */
	findAll(filter: LoginHistoryFilter, limit?: number, offset?: number): Promise<LoginHistory[]>;

	/**
	 * Recupera um histórico de login por ID
	 * @param id O ID do histórico de login
	 */
	findById(id: string): Promise<LoginHistory | null>;

	/**
	 * Recupera os últimos históricos de login para um determinado email
	 * @param email O email para buscar históricos
	 * @param limit Limite de registros a serem retornados
	 */
	findRecentByEmail(email: string, limit: number): Promise<LoginHistory[]>;

	/**
	 * Recupera os últimos históricos de login para um determinado usuário
	 * @param userId O ID do usuário para buscar históricos
	 * @param limit Limite de registros a serem retornados
	 */
	findRecentByUserId(userId: string, limit: number): Promise<LoginHistory[]>;

	/**
	 * Conta o número de falhas de login para um determinado email em um período de tempo
	 * @param email O email para contar falhas
	 * @param timeWindowMinutes Janela de tempo em minutos para considerar as falhas
	 */
	countFailedAttempts(email: string, timeWindowMinutes: number): Promise<number>;

	/**
	 * Verifica se um determinado IP está sendo usado em muitas tentativas de login falhas
	 * @param ipAddress O endereço IP para verificar
	 * @param timeWindowMinutes Janela de tempo em minutos para considerar as falhas
	 * @param threshold Limite de falhas para considerar suspeito
	 */
	isSuspiciousIpActivity(
		ipAddress: string,
		timeWindowMinutes: number,
		threshold: number,
	): Promise<boolean>;
}
