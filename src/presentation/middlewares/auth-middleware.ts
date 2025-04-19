import { Request, Response, NextFunction } from 'express';
import { AuthService, InvalidTokenError, TokenBlacklistedError, UserInactiveError, UserNotFoundError } from '../../domain/services/auth/auth-service.js';
import { TokenService } from '../../domain/services/auth/token-service.js';

/**
 * Interface estendida do Express Request para incluir o usuário autenticado
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

/**
 * Middleware para autenticação de rotas
 */
export class AuthMiddleware {
  private readonly authService: AuthService;
  private readonly tokenService: TokenService;

  constructor(authService: AuthService, tokenService: TokenService) {
    this.authService = authService;
    this.tokenService = tokenService;
  }

  /**
   * Middleware que verifica se o usuário está autenticado
   */
  authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extrai o token do header Authorization
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).json({ message: 'Token de autenticação não fornecido' });
        return;
      }

      try {
        // Extrai o token do header
        const token = this.tokenService.extractTokenFromHeader(authHeader);
        
        // Valida o token
        const payload = await this.authService.validateToken(token);
        
        // Adiciona o usuário ao request
        req.user = {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          role: payload.role,
        };
        
        next();
      } catch (error) {
        if (error instanceof InvalidTokenError) {
          res.status(401).json({ message: 'Token inválido' });
        } else if (error instanceof TokenBlacklistedError) {
          res.status(401).json({ message: 'Token revogado' });
        } else if (error instanceof UserNotFoundError) {
          res.status(401).json({ message: 'Usuário não encontrado' });
        } else if (error instanceof UserInactiveError) {
          res.status(403).json({ message: 'Usuário inativo' });
        } else {
          res.status(401).json({ message: 'Não autorizado' });
        }
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * Middleware que verifica se o usuário tem o papel especificado
   */
  hasRole = (role: string) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({ message: 'Não autenticado' });
        return;
      }

      if (req.user.role !== role) {
        res.status(403).json({ message: 'Permissão negada' });
        return;
      }

      next();
    };
  };

  /**
   * Middleware que verifica se o usuário tem permissão para realizar uma ação
   */
  hasPermission = (action: string) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user) {
          res.status(401).json({ message: 'Não autenticado' });
          return;
        }

        const hasPermission = await this.authService.hasPermission(req.user.id, action);
        if (!hasPermission) {
          res.status(403).json({ message: 'Permissão negada' });
          return;
        }

        next();
      } catch (error) {
        if (error instanceof UserNotFoundError) {
          res.status(401).json({ message: 'Usuário não encontrado' });
        } else if (error instanceof UserInactiveError) {
          res.status(403).json({ message: 'Usuário inativo' });
        } else {
          next(error);
        }
      }
    };
  };
} 