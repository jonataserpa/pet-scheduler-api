import { compare, hash } from "bcrypt";

/**
 * Enum que representa o papel/função do usuário no sistema
 */
export enum UserRole {
	ADMIN = "ADMIN",
	EMPLOYEE = "EMPLOYEE",
}

/**
 * Entidade que representa um usuário no sistema
 */
export class User {
	private readonly _id: string;
	private _email: string;
	private _password: string;
	private _name: string;
	private _role: UserRole;
	private readonly _createdAt: Date;
	private _updatedAt: Date;
	private _lastLoginAt?: Date;
	private _active: boolean;

	private constructor(
		id: string,
		email: string,
		password: string,
		name: string,
		role: UserRole,
		createdAt?: Date,
		updatedAt?: Date,
		lastLoginAt?: Date,
		active: boolean = true,
	) {
		this._id = id;
		this._email = email;
		this._password = password;
		this._name = name;
		this._role = role;
		this._createdAt = createdAt || new Date();
		this._updatedAt = updatedAt || new Date();
		this._lastLoginAt = lastLoginAt;
		this._active = active;
	}

	/**
	 * Cria uma nova instância de User
	 */
	public static async create(
		id: string,
		email: string,
		plainPassword: string,
		name: string,
		role: UserRole = UserRole.EMPLOYEE,
		createdAt?: Date,
		updatedAt?: Date,
		lastLoginAt?: Date,
		active: boolean = true,
	): Promise<User> {
		// Validações
		if (!id) {
			throw new Error("User: ID é obrigatório");
		}

		if (!email) {
			throw new Error("User: Email é obrigatório");
		}

		// Validação básica de formato de email
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			throw new Error("User: Email inválido");
		}

		if (!plainPassword || plainPassword.length < 8) {
			throw new Error("User: Senha deve ter pelo menos 8 caracteres");
		}

		if (!name) {
			throw new Error("User: Nome é obrigatório");
		}

		// Verifica se o role é válido
		if (!Object.values(UserRole).includes(role)) {
			throw new Error(
				`User: Role inválido. Deve ser um dos valores: ${Object.values(UserRole).join(", ")}`,
			);
		}

		// Hash da senha
		const hashedPassword = await hash(plainPassword, 10);

		return new User(
			id,
			email.toLowerCase().trim(),
			hashedPassword,
			name.trim(),
			role,
			createdAt,
			updatedAt,
			lastLoginAt,
			active,
		);
	}

	/**
	 * Cria um usuário a partir de dados persistidos (senha já em hash)
	 */
	public static createFromPersistence(
		id: string,
		email: string,
		hashedPassword: string,
		name: string,
		role: UserRole,
		createdAt: Date,
		updatedAt: Date,
		lastLoginAt?: Date,
		active: boolean = true,
	): User {
		return new User(
			id,
			email,
			hashedPassword,
			name,
			role,
			createdAt,
			updatedAt,
			lastLoginAt,
			active,
		);
	}

	/**
	 * Verifica se a senha fornecida corresponde à senha armazenada
	 */
	public async validatePassword(plainPassword: string): Promise<boolean> {
		return compare(plainPassword, this._password);
	}

	/**
	 * Altera a senha do usuário
	 */
	public async changePassword(
		currentPassword: string | null,
		newPassword: string,
		skipValidation: boolean = false,
	): Promise<void> {
		// Validar a senha atual, a menos que estejamos no fluxo de recuperação de senha
		if (!skipValidation && currentPassword) {
			const isValid = await this.validatePassword(currentPassword);
			if (!isValid) {
				throw new Error("User: Senha atual inválida");
			}
		} else if (!skipValidation) {
			throw new Error("User: Senha atual é obrigatória");
		}

		// Validar a nova senha
		if (!newPassword || newPassword.length < 8) {
			throw new Error("User: Nova senha deve ter pelo menos 8 caracteres");
		}

		// Gerar o hash da nova senha usando a função hash importada
		this._password = await hash(newPassword, 10);
		this._updatedAt = new Date();
	}

	/**
	 * Atualiza as informações básicas do usuário
	 */
	public update(name: string, email: string): void {
		if (!name) {
			throw new Error("User: Nome é obrigatório");
		}

		if (!email) {
			throw new Error("User: Email é obrigatório");
		}

		// Validação básica de formato de email
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			throw new Error("User: Email inválido");
		}

		this._name = name.trim();
		this._email = email.toLowerCase().trim();
		this._updatedAt = new Date();
	}

	/**
	 * Promove o usuário para o papel de administrador
	 */
	public promoteToAdmin(): void {
		if (this._role === UserRole.ADMIN) {
			throw new Error("User: Usuário já é um administrador");
		}

		this._role = UserRole.ADMIN;
		this._updatedAt = new Date();
	}

	/**
	 * Rebaixa o usuário para o papel de funcionário
	 */
	public demoteToEmployee(): void {
		if (this._role === UserRole.EMPLOYEE) {
			throw new Error("User: Usuário já é um funcionário");
		}

		this._role = UserRole.EMPLOYEE;
		this._updatedAt = new Date();
	}

	/**
	 * Registra um login do usuário
	 */
	public registerLogin(): void {
		this._lastLoginAt = new Date();
	}

	/**
	 * Ativa o usuário
	 */
	public activate(): void {
		if (this._active) {
			throw new Error("User: Usuário já está ativo");
		}

		this._active = true;
		this._updatedAt = new Date();
	}

	/**
	 * Desativa o usuário
	 */
	public deactivate(): void {
		if (!this._active) {
			throw new Error("User: Usuário já está inativo");
		}

		this._active = false;
		this._updatedAt = new Date();
	}

	/**
	 * Retorna um objeto com os dados do usuário (sem a senha)
	 */
	public toObject(): {
		id: string;
		email: string;
		name: string;
		role: UserRole;
		createdAt: Date;
		updatedAt: Date;
		lastLoginAt?: Date;
		active: boolean;
	} {
		return {
			id: this._id,
			email: this._email,
			name: this._name,
			role: this._role,
			createdAt: new Date(this._createdAt),
			updatedAt: new Date(this._updatedAt),
			lastLoginAt: this._lastLoginAt ? new Date(this._lastLoginAt) : undefined,
			active: this._active,
		};
	}

	/**
	 * Verifica se o usuário pode realizar uma ação específica
	 */
	public can(action: string): boolean {
		// Simplificado - em uma aplicação real, teria um sistema mais robusto de permissões
		const adminActions = ["manage-users", "view-reports", "delete-records"];

		// Admins podem fazer tudo
		if (this._role === UserRole.ADMIN) {
			return true;
		}

		// Ações restritas a admin
		if (adminActions.includes(action)) {
			return false;
		}

		// Ações que todos funcionários podem fazer
		return true;
	}

	// Getters
	get id(): string {
		return this._id;
	}

	get email(): string {
		return this._email;
	}

	get name(): string {
		return this._name;
	}

	get role(): UserRole {
		return this._role;
	}

	get createdAt(): Date {
		return new Date(this._createdAt);
	}

	get updatedAt(): Date {
		return new Date(this._updatedAt);
	}

	get lastLoginAt(): Date | undefined {
		return this._lastLoginAt ? new Date(this._lastLoginAt) : undefined;
	}

	get active(): boolean {
		return this._active;
	}

	/**
	 * Compara dois usuários por igualdade de ID
	 */
	public equals(other: User): boolean {
		if (!(other instanceof User)) {
			return false;
		}

		return this._id === other._id;
	}
}
