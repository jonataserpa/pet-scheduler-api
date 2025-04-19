import { createClient, RedisClientType } from 'redis';

/**
 * Serviço para gerenciar a blacklist de tokens usando Redis
 */
export class TokenBlacklistService {
  private readonly client: RedisClientType;
  private readonly keyPrefix: string;
  private readonly defaultTtl: number; // em segundos

  constructor(
    redisUrl: string,
    keyPrefix: string = 'token:blacklist:',
    defaultTtl: number = 86400 * 7, // 7 dias em segundos
  ) {
    this.client = createClient({ url: redisUrl });
    this.keyPrefix = keyPrefix;
    this.defaultTtl = defaultTtl;
  }

  /**
   * Inicializa a conexão com o Redis
   */
  public async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (error) {
      throw new Error(`TokenBlacklistService: Erro ao conectar ao Redis: ${(error as Error).message}`);
    }
  }

  /**
   * Encerra a conexão com o Redis
   */
  public async disconnect(): Promise<void> {
    try {
      await this.client.disconnect();
    } catch (error) {
      throw new Error(`TokenBlacklistService: Erro ao desconectar do Redis: ${(error as Error).message}`);
    }
  }

  /**
   * Adiciona um token à blacklist
   * @param token O token a ser adicionado à blacklist
   * @param reason Razão para o blacklisting (opcional)
   * @param ttl Tempo de vida em segundos (opcional, padrão é o definido no construtor)
   */
  public async addToBlacklist(token: string, reason: string = 'logged-out', ttl?: number): Promise<void> {
    try {
      const key = this.getKey(token);
      await this.client.set(key, reason, {
        EX: ttl || this.defaultTtl,
      });
    } catch (error) {
      throw new Error(`TokenBlacklistService: Erro ao adicionar token à blacklist: ${(error as Error).message}`);
    }
  }

  /**
   * Verifica se um token está na blacklist
   * @param token O token a ser verificado
   * @returns true se o token estiver na blacklist, false caso contrário
   */
  public async isBlacklisted(token: string): Promise<boolean> {
    try {
      const key = this.getKey(token);
      const value = await this.client.get(key);
      return value !== null;
    } catch (error) {
      throw new Error(`TokenBlacklistService: Erro ao verificar token na blacklist: ${(error as Error).message}`);
    }
  }

  /**
   * Remove um token da blacklist
   * @param token O token a ser removido da blacklist
   */
  public async removeFromBlacklist(token: string): Promise<void> {
    try {
      const key = this.getKey(token);
      await this.client.del(key);
    } catch (error) {
      throw new Error(`TokenBlacklistService: Erro ao remover token da blacklist: ${(error as Error).message}`);
    }
  }

  /**
   * Obtém a razão pela qual um token foi adicionado à blacklist
   * @param token O token a ser verificado
   * @returns A razão ou null se o token não estiver na blacklist
   */
  public async getBlacklistReason(token: string): Promise<string | null> {
    try {
      const key = this.getKey(token);
      return await this.client.get(key);
    } catch (error) {
      throw new Error(`TokenBlacklistService: Erro ao obter razão do token na blacklist: ${(error as Error).message}`);
    }
  }

  /**
   * Adiciona vários tokens à blacklist de uma só vez
   * @param tokens Array de tokens a serem adicionados à blacklist
   * @param reason Razão para o blacklisting
   * @param ttl Tempo de vida em segundos
   */
  public async addMultipleToBlacklist(
    tokens: string[],
    reason: string = 'logged-out',
    ttl?: number,
  ): Promise<void> {
    try {
      const multi = this.client.multi();
      
      for (const token of tokens) {
        const key = this.getKey(token);
        multi.set(key, reason, {
          EX: ttl || this.defaultTtl,
        });
      }
      
      await multi.exec();
    } catch (error) {
      throw new Error(`TokenBlacklistService: Erro ao adicionar múltiplos tokens à blacklist: ${(error as Error).message}`);
    }
  }

  /**
   * Gera a chave completa para armazenamento no Redis
   * @param token O token para o qual gerar a chave
   * @returns A chave Redis completa
   */
  private getKey(token: string): string {
    // Usar um hash do token como chave para evitar tokens muito longos como chaves no Redis
    const hash = require('crypto').createHash('sha256').update(token).digest('hex');
    return `${this.keyPrefix}${hash}`;
  }
} 