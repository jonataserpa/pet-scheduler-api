import { Request, Response } from 'express';
import { AuthService, InvalidCredentialsError, TokenBlacklistedError, UserInactiveError, UserNotFoundError } from '../../domain/services/auth/auth-service.js';
import { TokenService, TokenPayload } from '../../domain/services/auth/token-service.js';
import { PasswordResetService } from '../../domain/services/auth/password-reset-service.js';
import { EmailService } from '../../infrastructure/services/email-service.js';
import { logger } from '../../shared/utils/logger.js';
import { AuthenticatedRequest } from '../middlewares/auth-middleware.js';
import { User } from '../../domain/entities/user.js';
import { LoginHistoryRepository } from '../../domain/repositories/login-history-repository.js';

/**
 * Controlador para autenticação
 */
export class AuthController {
  private readonly authService: AuthService;
  private readonly tokenService: TokenService;
  private readonly passwordResetService: PasswordResetService;
  private readonly emailService: EmailService;
  private readonly loginHistoryRepository?: LoginHistoryRepository;

  constructor(
    authService: AuthService, 
    tokenService: TokenService,
    passwordResetService: PasswordResetService,
    emailService: EmailService,
    loginHistoryRepository?: LoginHistoryRepository
  ) {
    this.authService = authService;
    this.tokenService = tokenService;
    this.passwordResetService = passwordResetService;
    this.emailService = emailService;
    this.loginHistoryRepository = loginHistoryRepository;
  }

  /**
   * Login de usuário
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ message: 'Email e senha são obrigatórios' });
        return;
      }

      // Obter o IP do cliente, considerando proxies
      const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || 
                        req.socket.remoteAddress || 
                        'unknown';
                        
      // Obter o user-agent
      const userAgent = req.headers['user-agent'] || 'unknown';

      const result = await this.authService.login({
        email,
        password,
        ipAddress,
        userAgent
      });

      res.status(200).json(result);
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        res.status(401).json({ message: error.message });
        return;
      }

      if (error instanceof UserInactiveError) {
        res.status(403).json({ message: error.message });
        return;
      }

      res.status(500).json({ message: 'Erro ao realizar login' });
    }
  };

  /**
   * Logout de usuário
   */
  logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      const refreshToken = req.body.refreshToken; // Opcional

      if (!authHeader) {
        res.status(401).json({ message: 'Token de autenticação não fornecido' });
        return;
      }

      // Extrai o token do header
      const accessToken = this.tokenService.extractTokenFromHeader(authHeader);

      // Adiciona os tokens à blacklist
      await this.authService.logout(accessToken, refreshToken);

      res.status(200).json({ message: 'Logout realizado com sucesso' });
    } catch (error) {
      logger.error('Erro no logout:', error);
      res.status(500).json({ message: 'Erro ao realizar logout' });
    }
  };

  /**
   * Atualização do token de acesso usando refresh token
   */
  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({ message: 'Refresh token é obrigatório' });
        return;
      }

      // Tenta atualizar o token
      const result = await this.authService.refreshToken(refreshToken);

      res.status(200).json({
        tokens: {
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
        },
      });
    } catch (error) {
      logger.error('Erro ao atualizar token:', error);

      if (error instanceof TokenBlacklistedError) {
        res.status(401).json({ message: error.message });
      } else if (error instanceof UserNotFoundError) {
        res.status(401).json({ message: error.message });
      } else if (error instanceof UserInactiveError) {
        res.status(403).json({ message: error.message });
      } else {
        res.status(401).json({ message: 'Token inválido ou expirado' });
      }
    }
  };

  /**
   * Obtém o perfil do usuário atual
   */
  getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Não autenticado' });
        return;
      }

      res.status(200).json({
        user: req.user,
      });
    } catch (error) {
      logger.error('Erro ao obter perfil:', error);
      res.status(500).json({ message: 'Erro ao obter perfil do usuário' });
    }
  };

  /**
   * Inicia o processo de recuperação de senha
   */
  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ message: 'Email é obrigatório' });
        return;
      }

      // Gera o token de recuperação
      const result = await this.passwordResetService.generateToken(email);
      
      // Se o usuário existe e está ativo, envia o email
      if (result) {
        // Envia o email com o token
        await this.emailService.sendPasswordResetEmail(
          email, 
          result.token, 
          result.user.name
        );
      }

      // Mesmo que o usuário não exista, retornamos sucesso para não revelar 
      // quais emails estão cadastrados (segurança)
      res.status(200).json({
        message: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.',
      });
    } catch (error) {
      logger.error('Erro ao solicitar recuperação de senha:', error);
      res.status(500).json({ message: 'Erro ao processar solicitação de recuperação de senha' });
    }
  };

  /**
   * Redefine a senha usando um token de recuperação
   */
  resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        res.status(400).json({ message: 'Token e nova senha são obrigatórios' });
        return;
      }

      // Validação básica da senha
      if (newPassword.length < 8) {
        res.status(400).json({ message: 'A nova senha deve ter pelo menos 8 caracteres' });
        return;
      }

      // Redefine a senha
      const user = await this.passwordResetService.resetPassword(token, newPassword);

      if (!user) {
        res.status(400).json({ message: 'Token inválido ou expirado' });
        return;
      }

      // Notifica o usuário sobre a alteração de senha
      await this.emailService.sendPasswordChangedEmail(user.email, user.name);

      res.status(200).json({ message: 'Senha redefinida com sucesso' });
    } catch (error) {
      logger.error('Erro ao redefinir senha:', error);
      res.status(500).json({ message: 'Erro ao redefinir senha' });
    }
  };

  /**
   * Altera a senha do usuário logado
   */
  changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Não autenticado' });
        return;
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res.status(400).json({ message: 'Senha atual e nova senha são obrigatórias' });
        return;
      }

      // Validação básica da nova senha
      if (newPassword.length < 8) {
        res.status(400).json({ message: 'A nova senha deve ter pelo menos 8 caracteres' });
        return;
      }

      // Busca o usuário pelo ID
      const user = await this.authService.changePassword(req.user.id, currentPassword, newPassword);

      // Notifica o usuário sobre a alteração de senha
      await this.emailService.sendPasswordChangedEmail(user.email, user.name);

      res.status(200).json({ message: 'Senha alterada com sucesso' });
    } catch (error) {
      logger.error('Erro ao alterar senha:', error);

      if (error instanceof Error && error.message === 'Senha atual incorreta') {
        res.status(400).json({ message: error.message });
      } else if (error instanceof UserNotFoundError) {
        res.status(404).json({ message: error.message });
      } else if (error instanceof UserInactiveError) {
        res.status(403).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Erro ao alterar senha' });
      }
    }
  };

  /**
   * Callback para autenticação OAuth
   */
  oauthCallback = async (req: Request, res: Response): Promise<void> => {
    try {
      // O Passport já adicionou o usuário ao request
      if (!req.user) {
        res.redirect('/login?error=authentication_failed');
        return;
      }

      // O user aqui é a instância User retornada pelo passport strategy
      const user = req.user as User;

      // Gera tokens JWT para o usuário autenticado via OAuth
      const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };

      const tokens = this.tokenService.generateTokens(payload);

      // Redireciona para a página inicial com o token como query parameter
      // Em uma aplicação real, essa lógica seria mais robusta para garantir segurança
      res.redirect(`/auth-success?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`);
    } catch (error) {
      logger.error('Erro no callback OAuth:', error);
      res.redirect('/login?error=authentication_failed');
    }
  };

  /**
   * Obtém o histórico de login do usuário autenticado
   */
  getLoginHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ message: 'Usuário não autenticado' });
        return;
      }

      if (!this.loginHistoryRepository) {
        res.status(500).json({ message: 'Serviço de histórico de login não disponível' });
        return;
      }

      // Parâmetro limit opcional (padrão 10)
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      
      // Obtém o histórico para o usuário autenticado
      const loginHistory = await this.loginHistoryRepository.findRecentByUserId(req.user.id, limit);

      res.status(200).json({
        loginHistory: loginHistory.map(history => ({
          id: history.id,
          timestamp: history.timestamp,
          status: history.status,
          ipAddress: history.ipAddress,
          userAgent: history.userAgent,
          authMethod: history.authMethod,
          location: history.location,
        }))
      });
    } catch (error) {
      logger.error('Erro ao obter histórico de login', { error, userId: req.user?.id });
      res.status(500).json({ message: 'Erro ao obter histórico de login' });
    }
  };
} 