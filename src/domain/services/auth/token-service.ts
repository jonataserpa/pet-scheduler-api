import jwt, { SignOptions } from 'jsonwebtoken';

/**
 * Interface que define a estrutura de um payload JWT
 */
export interface TokenPayload {
  sub: string; // subject (user ID)
  email: string;
  name: string;
  role: string;
  iat?: number; // issued at
  exp?: number; // expiration time
}

/**
 * Interface que define a estrutura de um token JWT
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Serviço para geração e validação de tokens JWT
 */
export class TokenService {
  private readonly jwtSecret: string;
  private readonly jwtRefreshSecret: string;
  private readonly accessTokenExpiresIn: string;
  private readonly refreshTokenExpiresIn: string;

  constructor(
    jwtSecret: string,
    jwtRefreshSecret: string,
    accessTokenExpiresIn: string = '1h',
    refreshTokenExpiresIn: string = '7d',
  ) {
    if (!jwtSecret || jwtSecret.length < 10) {
      throw new Error('TokenService: jwtSecret inválido ou muito curto');
    }

    if (!jwtRefreshSecret || jwtRefreshSecret.length < 10) {
      throw new Error('TokenService: jwtRefreshSecret inválido ou muito curto');
    }

    this.jwtSecret = jwtSecret;
    this.jwtRefreshSecret = jwtRefreshSecret;
    this.accessTokenExpiresIn = accessTokenExpiresIn;
    this.refreshTokenExpiresIn = refreshTokenExpiresIn;
  }

  /**
   * Gera um par de tokens (access e refresh) para um usuário
   */
  public generateTokens(payload: Omit<TokenPayload, 'iat' | 'exp'>): TokenPair {
    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.accessTokenExpiresIn,
    } as SignOptions);

    const refreshToken = jwt.sign({ sub: payload.sub }, this.jwtRefreshSecret, {
      expiresIn: this.refreshTokenExpiresIn,
    } as SignOptions);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Verifica e decodifica um access token
   */
  public verifyAccessToken(token: string): TokenPayload {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as TokenPayload;
      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('TokenService: Token expirado');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('TokenService: Token inválido');
      }
      throw new Error(`TokenService: Erro ao verificar token: ${(error as Error).message}`);
    }
  }

  /**
   * Verifica e decodifica um refresh token
   */
  public verifyRefreshToken(token: string): { sub: string } {
    try {
      const payload = jwt.verify(token, this.jwtRefreshSecret) as { sub: string };
      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('TokenService: Refresh token expirado');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('TokenService: Refresh token inválido');
      }
      throw new Error(`TokenService: Erro ao verificar refresh token: ${(error as Error).message}`);
    }
  }

  /**
   * Gera um novo par de tokens a partir de um refresh token válido
   */
  public refreshTokens(refreshToken: string, payload: Omit<TokenPayload, 'iat' | 'exp'>): TokenPair {
    // Verifica se o refresh token é válido
    const { sub } = this.verifyRefreshToken(refreshToken);

    // Verifica se o sub do refresh token corresponde ao usuário do payload
    if (sub !== payload.sub) {
      throw new Error('TokenService: Refresh token não pertence ao usuário');
    }

    // Gera novos tokens
    return this.generateTokens(payload);
  }

  /**
   * Extrai o token de autorização do header de autorização
   */
  public extractTokenFromHeader(authorizationHeader?: string): string {
    if (!authorizationHeader) {
      throw new Error('TokenService: Header de autorização não fornecido');
    }

    const parts = authorizationHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new Error('TokenService: Formato de token inválido. Uso esperado: Bearer [token]');
    }

    return parts[1];
  }
} 