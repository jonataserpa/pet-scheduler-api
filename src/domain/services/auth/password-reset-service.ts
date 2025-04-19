import crypto from 'crypto';
import { RedisClientType, createClient } from 'redis';
import { User } from '../../entities/user.js';
import { IUserRepository } from './auth-service.js';
import { env } from '../../../shared/config/env.js';
import { logger } from '../../../shared/utils/logger.js';

/**
 * Serviço para gerenciamento de tokens de recuperação de senha
 */
export class PasswordResetService {
  private readonly client: RedisClientType;
  private readonly userRepository: IUserRepository;
  private readonly keyPrefix: string;
  private readonly tokenExpires: number; // em segundos

  constructor(
    redisUrl: string,
    userRepository: IUserRepository,
    keyPrefix: string = 'pwd:reset:',
    tokenExpires: number = env.PASSWORD_RESET_TOKEN_EXPIRES // 1 hora por padrão
  ) {
    this.client = createClient({ url: redisUrl });
    this.userRepository = userRepository;
    this.keyPrefix = keyPrefix;
    this.tokenExpires = tokenExpires;
  }

  /**
   * Inicializa a conexão com o Redis
   */
  public async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (error) {
      throw new Error(`PasswordResetService: Erro ao conectar ao Redis: ${(error as Error).message}`);
    }
  }

  /**
   * Encerra a conexão com o Redis
   */
  public async disconnect(): Promise<void> {
    try {
      await this.client.disconnect();
    } catch (error) {
      throw new Error(`PasswordResetService: Erro ao desconectar do Redis: ${(error as Error).message}`);
    }
  }

  /**
   * Gera um token de recuperação de senha para um usuário
   */
  public async generateToken(email: string): Promise<{ token: string; user: User } | null> {
    try {
      // Busca o usuário pelo email
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        return null;
      }

      // Verifica se o usuário está ativo
      if (!user.active) {
        return null;
      }

      // Gera um token aleatório
      const token = crypto.randomBytes(32).toString('hex');
      const key = this.getKey(token);

      // Armazena o token no Redis com o ID do usuário como valor
      await this.client.set(key, user.id, {
        EX: this.tokenExpires,
      });

      // Registra a geração do token
      logger.info('Token de recuperação de senha gerado', { userId: user.id });

      return { token, user };
    } catch (error) {
      logger.error('Erro ao gerar token de recuperação de senha', { error, email });
      throw new Error(`Erro ao gerar token de recuperação de senha: ${(error as Error).message}`);
    }
  }

  /**
   * Valida um token de recuperação de senha e retorna o usuário associado
   */
  public async validateToken(token: string): Promise<User | null> {
    try {
      const key = this.getKey(token);
      
      // Busca o ID do usuário associado ao token
      const userId = await this.client.get(key);
      if (!userId) {
        return null;
      }

      // Busca o usuário pelo ID
      return this.userRepository.findById(userId);
    } catch (error) {
      logger.error('Erro ao validar token de recuperação de senha', { error, token });
      throw new Error(`Erro ao validar token de recuperação de senha: ${(error as Error).message}`);
    }
  }

  /**
   * Redefine a senha do usuário usando o token de recuperação
   */
  public async resetPassword(token: string, newPassword: string): Promise<User | null> {
    try {
      // Valida o token e obtém o usuário
      const user = await this.validateToken(token);
      if (!user) {
        return null;
      }

      // Alterar a senha do usuário
      await user.changePassword(null, newPassword, true); // O true indica que estamos ignorando a senha atual
      const updatedUser = await this.userRepository.save(user);

      // Invalidar o token após uso
      await this.invalidateToken(token);

      logger.info('Senha redefinida com sucesso', { userId: user.id });
      return updatedUser;
    } catch (error) {
      logger.error('Erro ao redefinir senha', { error, token });
      throw new Error(`Erro ao redefinir senha: ${(error as Error).message}`);
    }
  }

  /**
   * Invalida um token de recuperação de senha
   */
  private async invalidateToken(token: string): Promise<void> {
    try {
      const key = this.getKey(token);
      await this.client.del(key);
    } catch (error) {
      logger.error('Erro ao invalidar token de recuperação de senha', { error, token });
      throw new Error(`Erro ao invalidar token de recuperação de senha: ${(error as Error).message}`);
    }
  }

  /**
   * Gera a chave completa para armazenamento no Redis
   */
  private getKey(token: string): string {
    return `${this.keyPrefix}${token}`;
  }
} 