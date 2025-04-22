/**
 * Tipo que representa o resultado de uma tentativa de login
 */
export enum LoginResult {
	SUCCESS = "SUCCESS", // Login bem-sucedido
	INVALID_CREDENTIALS = "INVALID_CREDENTIALS", // Senha incorreta
	USER_NOT_FOUND = "USER_NOT_FOUND", // Usuário não encontrado
	USER_INACTIVE = "USER_INACTIVE", // Usuário inativo
	ACCOUNT_LOCKED = "ACCOUNT_LOCKED", // Conta bloqueada por muitas tentativas
	SUSPICIOUS = "SUSPICIOUS", // Comportamento suspeito detectado
}

export type LoginStatus = "success" | "failed" | "locked" | "password_reset" | "suspicious";
export type AuthMethod = "password" | "google" | "facebook" | "github" | "token" | "recovery";

export interface GeoLocation {
	country?: string;
	region?: string;
	city?: string;
	latitude?: number;
	longitude?: number;
}

export interface LoginDetails {
	reason?: string;
	deviceId?: string;
	browser?: string;
	os?: string;
	[key: string]: unknown;
}

/**
 * Entidade para rastrear histórico de logins para fins de auditoria e segurança
 * Armazena informações sobre tentativas de login bem-sucedidas e falhas
 */
export class LoginHistory {
	private constructor(
		public readonly id: string,
		public readonly userId: string | null,
		public readonly email: string,
		public readonly status: LoginStatus,
		public readonly timestamp: Date,
		public readonly ipAddress: string,
		public readonly userAgent: string,
		public readonly location: GeoLocation | null,
		public readonly authMethod: AuthMethod,
		public readonly details: LoginDetails | null,
	) {
		Object.freeze(this);
	}

	/**
	 * Cria uma nova instância de LoginHistory
	 */
	static create(
		id: string,
		userId: string | null,
		email: string,
		status: LoginStatus,
		timestamp: Date,
		ipAddress: string,
		userAgent: string,
		location: GeoLocation | null = null,
		authMethod: AuthMethod = "password",
		details: LoginDetails | null = null,
	): LoginHistory {
		// Validações básicas
		if (!id) throw new Error("ID é obrigatório");
		if (!email) throw new Error("Email é obrigatório");
		if (!timestamp) throw new Error("Timestamp é obrigatório");
		if (!ipAddress) throw new Error("Endereço IP é obrigatório");
		if (!userAgent) throw new Error("User-Agent é obrigatório");
		if (!status) throw new Error("Status é obrigatório");

		// Validação de status válido
		const validStatuses: LoginStatus[] = [
			"success",
			"failed",
			"locked",
			"password_reset",
			"suspicious",
		];
		if (!validStatuses.includes(status)) {
			throw new Error(
				`Status inválido: ${status}. Os valores permitidos são: ${validStatuses.join(", ")}`,
			);
		}

		// Validação de formato de email
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			throw new Error(`Email inválido: ${email}`);
		}

		return new LoginHistory(
			id,
			userId,
			email,
			status,
			timestamp,
			ipAddress,
			userAgent,
			location,
			authMethod,
			details,
		);
	}

	/**
	 * Cria um registro de login com sucesso
	 */
	static createSuccessLogin(
		id: string,
		userId: string,
		email: string,
		ipAddress: string,
		userAgent: string,
		authMethod: AuthMethod = "password",
		location: GeoLocation | null = null,
		details: LoginDetails | null = null,
	): LoginHistory {
		return LoginHistory.create(
			id,
			userId,
			email,
			"success",
			new Date(),
			ipAddress,
			userAgent,
			location,
			authMethod,
			details,
		);
	}

	/**
	 * Cria um registro de falha de login
	 */
	static createFailedLogin(
		id: string,
		email: string,
		ipAddress: string,
		userAgent: string,
		reason: string = "Invalid credentials",
		location: GeoLocation | null = null,
	): LoginHistory {
		return LoginHistory.create(
			id,
			null,
			email,
			"failed",
			new Date(),
			ipAddress,
			userAgent,
			location,
			"password",
			{ reason },
		);
	}

	/**
	 * Cria um registro de login suspeito
	 */
	static createSuspiciousLogin(
		id: string,
		email: string,
		ipAddress: string,
		userAgent: string,
		reason: string,
		location: GeoLocation | null = null,
	): LoginHistory {
		return LoginHistory.create(
			id,
			null,
			email,
			"suspicious",
			new Date(),
			ipAddress,
			userAgent,
			location,
			"password",
			{ reason },
		);
	}

	/**
	 * Retorna uma representação em objeto puro do histórico de login
	 */
	toObject() {
		return {
			id: this.id,
			userId: this.userId,
			email: this.email,
			status: this.status,
			timestamp: this.timestamp,
			ipAddress: this.ipAddress,
			userAgent: this.userAgent,
			location: this.location,
			authMethod: this.authMethod,
			details: this.details,
		};
	}
}
