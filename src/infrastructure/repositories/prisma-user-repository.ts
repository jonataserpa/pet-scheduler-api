import { PrismaClient } from "@prisma/client";
import { User, UserRole } from "../../domain/entities/user.js";
import { IUserRepository } from "../../domain/services/auth/auth-service.js";

/**
 * Implementação do repositório de usuários usando Prisma
 */
export class PrismaUserRepository implements IUserRepository {
	private readonly prisma: PrismaClient;

	constructor(prisma: PrismaClient) {
		this.prisma = prisma;
	}

	/**
	 * Encontra um usuário pelo ID
	 */
	async findById(id: string): Promise<User | null> {
		const user = await this.prisma.user.findUnique({
			where: { id },
		});

		if (!user) {
			return null;
		}

		return this.mapToDomain(user);
	}

	/**
	 * Encontra um usuário pelo email
	 */
	async findByEmail(email: string): Promise<User | null> {
		const user = await this.prisma.user.findUnique({
			where: { email },
		});

		if (!user) {
			return null;
		}

		return this.mapToDomain(user);
	}

	/**
	 * Salva um usuário (cria ou atualiza)
	 */
	async save(user: User): Promise<User> {
		const data = {
			name: user.name,
			email: user.email,
			role: user.role,
			updatedAt: new Date(),
			lastLoginAt: user.lastLoginAt,
			active: user.active,
		};

		await this.prisma.user.updateMany({
			where: { id: user.id },
			data,
		});

		// Busca o usuário atualizado para retornar
		const updatedUser = await this.prisma.user.findUnique({
			where: { id: user.id },
		});

		if (!updatedUser) {
			throw new Error(`Usuário com id ${user.id} não encontrado após atualização`);
		}

		return this.mapToDomain(updatedUser);
	}

	/**
	 * Cria um novo usuário
	 */
	async create(user: User, hashedPassword: string): Promise<User> {
		const data = {
			id: user.id,
			name: user.name,
			email: user.email,
			password: hashedPassword,
			role: user.role,
			createdAt: new Date(),
			updatedAt: new Date(),
			lastLoginAt: user.lastLoginAt,
			active: user.active,
		};

		const createdUser = await this.prisma.user.create({
			data,
		});

		return this.mapToDomain(createdUser);
	}

	/**
	 * Mapeia um usuário do Prisma para uma entidade de domínio
	 */
	private mapToDomain(prismaUser: any): User {
		return User.createFromPersistence(
			prismaUser.id,
			prismaUser.email,
			prismaUser.password,
			prismaUser.name,
			prismaUser.role as UserRole,
			prismaUser.createdAt,
			prismaUser.updatedAt,
			prismaUser.lastLoginAt || undefined,
			prismaUser.active,
		);
	}
}
