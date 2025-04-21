import { User, UserRole } from '../../entities/user.js';
import { TokenService, TokenPair, TokenPayload } from './token-service.js';
import { TokenBlacklistService } from './token-blacklist-service.js';
import { LoginHistory } from '../../entities/login-history.js';
import { LoginHistoryRepository } from '../../repositories/login-history-repository.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Interface para o repositório de usuários (será implementado na camada de infraestrutura)
 */
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
  create(user: User, hashedPassword: string): Promise<User>;
}

/**
 * DTO para login
 */
export interface LoginDTO {
  email: string;
  password: string;
  ipAddress: string;
  userAgent: string;
}

/**
 * DTO para resultado do login
 */
export interface LoginResultDTO {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
  tokens: TokenPair;
}

/**
 * DTO para resultado do refresh token
 */
export interface RefreshTokenResultDTO {
  tokens: TokenPair;
}

/**
 * Erro base para erros de autenticação
 */
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Erro para credenciais inválidas
 */
export class InvalidCredentialsError extends AuthenticationError {
  constructor() {
    super('Credenciais inválidas');
    this.name = 'InvalidCredentialsError';
  }
}

/**
 * Erro para usuário não encontrado
 */
export class UserNotFoundError extends AuthenticationError {
  constructor() {
    super('Usuário não encontrado');
    this.name = 'UserNotFoundError';
  }
}

/**
 * Erro para usuário inativo
 */
export class UserInactiveError extends AuthenticationError {
  constructor() {
    super('Usuário inativo');
    this.name = 'UserInactiveError';
  }
}

/**
 * Erro para token inválido
 */
export class InvalidTokenError extends AuthenticationError {
  constructor(message: string = 'Token inválido') {
    super(message);
    this.name = 'InvalidTokenError';
  }
}

/**
 * Erro para token na lista negra
 */
export class TokenBlacklistedError extends AuthenticationError {
  constructor() {
    super('Token está na lista negra');
    this.name = 'TokenBlacklistedError';
  }
}

/**
 * Serviço para autenticação de usuários
 */
export class AuthService {
  private readonly userRepository: IUserRepository;
  private readonly tokenService: TokenService;
  private readonly tokenBlacklistService: TokenBlacklistService;
  private readonly loginHistoryRepository?: LoginHistoryRepository;

  constructor(
    userRepository: IUserRepository,
    tokenService: TokenService,
    tokenBlacklistService: TokenBlacklistService,
    loginHistoryRepository?: LoginHistoryRepository,
  ) {
    this.userRepository = userRepository;
    this.tokenService = tokenService;
    this.tokenBlacklistService = tokenBlacklistService;
    this.loginHistoryRepository = loginHistoryRepository;
  }

  /**
   * Realiza o login de um usuário
   */
  public async login(loginDto: LoginDTO): Promise<LoginResultDTO> {
    try {
      // Busca usuário pelo email
      const user = await this.userRepository.findByEmail(loginDto.email);
      if (!user) {
        await this.registerFailedLogin(
          loginDto.email, 
          loginDto.ipAddress, 
          loginDto.userAgent, 
          'Usuário não encontrado'
        );
        throw new InvalidCredentialsError();
      }

      // Verifica se o usuário está ativo
      if (!user.active) {
        await this.registerFailedLogin(
          loginDto.email, 
          loginDto.ipAddress, 
          loginDto.userAgent, 
          'Usuário inativo', 
          user.id
        );
        throw new UserInactiveError();
      }

      // Valida a senha
      const isPasswordValid = await user.validatePassword(loginDto.password);
      if (!isPasswordValid) {
        await this.registerFailedLogin(
          loginDto.email, 
          loginDto.ipAddress, 
          loginDto.userAgent, 
          'Senha inválida', 
          user.id
        );
        throw new InvalidCredentialsError();
      }

      // Registra o login
      user.registerLogin();
      await this.userRepository.save(user);

      // Registra o histórico de login bem-sucedido
      await this.registerSuccessLogin(
        user.id,
        user.email,
        loginDto.ipAddress,
        loginDto.userAgent
      );

      // Gera tokens
      const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };

      const tokens = this.tokenService.generateTokens(payload);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        tokens,
      };
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      throw new AuthenticationError('Erro ao realizar login');
    }
  }

  /**
   * Realiza o logout de um usuário
   */
  public async logout(accessToken: string, refreshToken?: string): Promise<void> {
    try {
      // Adiciona o token de acesso à lista negra
      await this.tokenBlacklistService.addToBlacklist(accessToken, 'logout');

      // Se fornecido, adiciona o refresh token à lista negra também
      if (refreshToken) {
        await this.tokenBlacklistService.addToBlacklist(refreshToken, 'logout');
      }
    } catch (error) {
      throw new AuthenticationError('Erro ao realizar logout');
    }
  }

  /**
   * Atualiza os tokens com um refresh token
   */
  public async refreshToken(refreshToken: string): Promise<RefreshTokenResultDTO> {
    try {
      // Verifica se o token está na lista negra
      const isBlacklisted = await this.tokenBlacklistService.isBlacklisted(refreshToken);
      if (isBlacklisted) {
        throw new TokenBlacklistedError();
      }

      // Valida o refresh token
      const payload = this.tokenService.verifyRefreshToken(refreshToken);
      if (!payload || !payload.sub) {
        throw new InvalidTokenError('Refresh token inválido');
      }

      // Busca o usuário
      const user = await this.userRepository.findById(payload.sub);
      if (!user) {
        throw new UserNotFoundError();
      }

      // Verifica se o usuário está ativo
      if (!user.active) {
        throw new UserInactiveError();
      }

      // Gera novos tokens
      const newPayload: Omit<TokenPayload, 'iat' | 'exp'> = {
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };

      // Adiciona o refresh token antigo à lista negra
      await this.tokenBlacklistService.addToBlacklist(refreshToken, 'refreshed');

      // Gera novos tokens
      const tokens = this.tokenService.generateTokens(newPayload);

      return { tokens };
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      throw new InvalidTokenError('Erro ao atualizar token');
    }
  }

  /**
   * Valida um token de acesso
   */
  public async validateToken(accessToken: string): Promise<TokenPayload> {
    try {
      // Verifica se o token está na lista negra
      const isBlacklisted = await this.tokenBlacklistService.isBlacklisted(accessToken);
      if (isBlacklisted) {
        throw new TokenBlacklistedError();
      }

      // Valida o token de acesso
      let payload: TokenPayload;
      try {
        payload = this.tokenService.verifyAccessToken(accessToken);
      } catch (tokenError) {
        if (tokenError instanceof Error) {
          if (tokenError.message.includes('expirado')) {
            throw new InvalidTokenError('Token expirado');
          } else if (tokenError.message.includes('inválido')) {
            throw new InvalidTokenError('Token inválido');
          }
        }
        throw new InvalidTokenError('Erro na validação do token');
      }

      // Busca o usuário
      const user = await this.userRepository.findById(payload.sub);
      if (!user) {
        throw new UserNotFoundError();
      }

      // Verifica se o usuário está ativo
      if (!user.active) {
        throw new UserInactiveError();
      }

      return payload;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      throw new InvalidTokenError(error instanceof Error ? error.message : 'Token inválido ou expirado');
    }
  }

  /**
   * Verifica se um usuário tem permissão para uma ação
   */
  public async hasPermission(userId: string, action: string): Promise<boolean> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return false;
      }

      return user.can(action);
    } catch (error) {
      return false;
    }
  }

  /**
   * Altera a senha de um usuário
   */
  public async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<User> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new UserNotFoundError();
      }

      await user.changePassword(currentPassword, newPassword);
      return await this.userRepository.save(user);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      throw new AuthenticationError('Erro ao alterar senha');
    }
  }

  /**
   * Registra um login bem-sucedido
   */
  private async registerSuccessLogin(
    userId: string,
    email: string,
    ipAddress: string,
    userAgent: string,
    authMethod: 'password' | 'google' | 'facebook' | 'github' | 'token' | 'recovery' = 'password'
  ): Promise<void> {
    if (!this.loginHistoryRepository) return;

    try {
      const loginHistory = LoginHistory.createSuccessLogin(
        uuidv4(),
        userId,
        email,
        ipAddress,
        userAgent,
        authMethod
      );

      await this.loginHistoryRepository.save(loginHistory);
    } catch (error) {
      // Apenas loga o erro, não interrompe o fluxo
      console.error('Erro ao registrar login bem-sucedido:', error);
    }
  }

  /**
   * Registra uma tentativa de login falha
   */
  private async registerFailedLogin(
    email: string,
    ipAddress: string,
    userAgent: string,
    reason: string,
    userId?: string
  ): Promise<void> {
    if (!this.loginHistoryRepository) return;

    try {
      // Criar o registro de login falho
      // Nota: A classe LoginHistory.createFailedLogin não aceita userId diretamente
      // Precisamos criar manualmente o LoginHistory para incluir o userId
      let loginHistory;
      
      if (userId) {
        // Se temos um userId, criamos diretamente um LoginHistory com esse userId
        loginHistory = LoginHistory.create(
          uuidv4(),
          userId,  // Passamos o userId aqui
          email,
          'failed',
          new Date(),
          ipAddress,
          userAgent,
          null, // location
          'password',
          { reason } // details
        );
      } else {
        // Se não temos um userId, usamos o método padrão
        loginHistory = LoginHistory.createFailedLogin(
          uuidv4(),
          email,
          ipAddress,
          userAgent,
          reason
        );
      }

      await this.loginHistoryRepository.save(loginHistory);

      // Verifica se há muitas tentativas falhas para este email
      const failedAttempts = await this.loginHistoryRepository.countFailedAttempts(email, 30); // 30 minutos
      if (failedAttempts >= 5) {
        // Registrar tentativa suspeita - usando o mesmo padrão para incluir userId
        let suspiciousLogin;
        const suspiciousReason = `Muitas tentativas falhas (${failedAttempts}) nos últimos 30 minutos`;
        
        if (userId) {
          suspiciousLogin = LoginHistory.create(
            uuidv4(),
            userId,
            email,
            'suspicious',
            new Date(),
            ipAddress,
            userAgent,
            null, // location
            'password',
            { reason: suspiciousReason }
          );
        } else {
          suspiciousLogin = LoginHistory.createSuspiciousLogin(
            uuidv4(),
            email,
            ipAddress,
            userAgent,
            suspiciousReason
          );
        }
        
        await this.loginHistoryRepository.save(suspiciousLogin);
      }

      // Verifica se o IP está sendo usado em muitas tentativas falhas
      const isSuspiciousIP = await this.loginHistoryRepository.isSuspiciousIpActivity(ipAddress, 60, 10); // 60 minutos, 10 tentativas
      if (isSuspiciousIP) {
        // Registrar IP suspeito - usando o mesmo padrão para incluir userId
        let suspiciousLogin;
        const suspiciousReason = 'IP com muitas tentativas falhas de login';
        
        if (userId) {
          suspiciousLogin = LoginHistory.create(
            uuidv4(),
            userId,
            email,
            'suspicious',
            new Date(),
            ipAddress,
            userAgent,
            null, // location
            'password',
            { reason: suspiciousReason }
          );
        } else {
          suspiciousLogin = LoginHistory.createSuspiciousLogin(
            uuidv4(),
            email,
            ipAddress,
            userAgent,
            suspiciousReason
          );
        }
        
        await this.loginHistoryRepository.save(suspiciousLogin);
      }
    } catch (error) {
      // Apenas loga o erro, não interrompe o fluxo
      console.error('Erro ao registrar tentativa de login falha:', error);
    }
  }
} 