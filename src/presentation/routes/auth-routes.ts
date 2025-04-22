import { Router } from "express";
import passport from "passport";
import { AuthController } from "../controllers/auth-controller.js";
import { AuthMiddleware } from "../middlewares/auth-middleware.js";
import {
	loginRateLimiter,
	passwordResetRateLimiter,
} from "../middlewares/rate-limit-middleware.js";
import { asAuthHandler } from "../middlewares/express-utils.js";

/**
 * Configura as rotas de autenticação
 */
export const setupAuthRoutes = (
	router: Router,
	authController: AuthController,
	authMiddleware: AuthMiddleware,
): Router => {
	/**
	 * @swagger
	 * /api/auth/login:
	 *   post:
	 *     summary: Realiza o login do usuário
	 *     tags: [Auth]
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/LoginRequest'
	 *     responses:
	 *       200:
	 *         description: Login realizado com sucesso
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/LoginResponse'
	 *       400:
	 *         description: Dados inválidos na requisição
	 *       401:
	 *         description: Credenciais inválidas
	 *       403:
	 *         description: Usuário inativo
	 *       429:
	 *         description: Muitas tentativas de login. Tente novamente mais tarde
	 *       500:
	 *         description: Erro interno do servidor
	 */
	router.post("/login", loginRateLimiter, authController.login);

	/**
	 * @swagger
	 * /api/auth/refresh-token:
	 *   post:
	 *     summary: Atualiza o token de acesso usando um refresh token
	 *     tags: [Auth]
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/RefreshTokenRequest'
	 *     responses:
	 *       200:
	 *         description: Token atualizado com sucesso
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 tokens:
	 *                   type: object
	 *                   properties:
	 *                     accessToken:
	 *                       type: string
	 *                       example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
	 *                     refreshToken:
	 *                       type: string
	 *                       example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
	 *       400:
	 *         description: Refresh token não fornecido
	 *       401:
	 *         description: Token inválido, expirado ou na blacklist
	 *       403:
	 *         description: Usuário inativo
	 *       500:
	 *         description: Erro interno do servidor
	 */
	router.post("/refresh-token", authController.refreshToken);

	/**
	 * @swagger
	 * /api/auth/forgot-password:
	 *   post:
	 *     summary: Solicita recuperação de senha
	 *     tags: [Auth]
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/PasswordResetRequestEmail'
	 *     responses:
	 *       200:
	 *         description: Se o email estiver cadastrado, instruções para redefinir a senha serão enviadas
	 *       400:
	 *         description: Email não fornecido
	 *       429:
	 *         description: Muitas solicitações. Tente novamente mais tarde
	 *       500:
	 *         description: Erro interno do servidor
	 */
	router.post("/forgot-password", passwordResetRateLimiter, authController.forgotPassword);

	/**
	 * @swagger
	 * /api/auth/reset-password:
	 *   post:
	 *     summary: Redefine a senha usando um token de recuperação
	 *     tags: [Auth]
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/PasswordResetConfirm'
	 *     responses:
	 *       200:
	 *         description: Senha redefinida com sucesso
	 *       400:
	 *         description: Token inválido, expirado ou senha inválida
	 *       429:
	 *         description: Muitas solicitações. Tente novamente mais tarde
	 *       500:
	 *         description: Erro interno do servidor
	 */
	router.post("/reset-password", passwordResetRateLimiter, authController.resetPassword);

	/**
	 * @swagger
	 * /api/auth/google:
	 *   get:
	 *     summary: Inicia o fluxo de autenticação com Google OAuth
	 *     tags: [Auth]
	 *     responses:
	 *       302:
	 *         description: Redirecionamento para autenticação do Google
	 */
	router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

	/**
	 * @swagger
	 * /api/auth/google/callback:
	 *   get:
	 *     summary: Callback para autenticação com Google OAuth
	 *     tags: [Auth]
	 *     responses:
	 *       200:
	 *         description: Autenticação bem-sucedida, retorna tokens JWT
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/LoginResponse'
	 *       302:
	 *         description: Redirecionamento em caso de falha
	 *       500:
	 *         description: Erro interno do servidor
	 */
	router.get(
		"/google/callback",
		passport.authenticate("google", { failureRedirect: "/login" }),
		authController.oauthCallback,
	);

	/**
	 * @swagger
	 * /api/auth/logout:
	 *   post:
	 *     summary: Realiza o logout do usuário (invalidando tokens)
	 *     tags: [Auth]
	 *     security:
	 *       - bearerAuth: []
	 *     requestBody:
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             properties:
	 *               refreshToken:
	 *                 type: string
	 *                 description: Token de atualização a ser invalidado (opcional)
	 *     responses:
	 *       200:
	 *         description: Logout realizado com sucesso
	 *       401:
	 *         description: Não autorizado ou token não fornecido
	 *       500:
	 *         description: Erro interno do servidor
	 */
	router.post(
		"/logout",
		asAuthHandler(authMiddleware.authenticate),
		asAuthHandler(authController.logout),
	);

	/**
	 * @swagger
	 * /api/auth/profile:
	 *   get:
	 *     summary: Obtém o perfil do usuário autenticado
	 *     tags: [Auth]
	 *     security:
	 *       - bearerAuth: []
	 *     responses:
	 *       200:
	 *         description: Perfil do usuário
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 user:
	 *                   $ref: '#/components/schemas/User'
	 *       401:
	 *         description: Não autorizado
	 *       500:
	 *         description: Erro interno do servidor
	 */
	router.get(
		"/profile",
		asAuthHandler(authMiddleware.authenticate),
		asAuthHandler(authController.getProfile),
	);

	/**
	 * @swagger
	 * /api/auth/change-password:
	 *   post:
	 *     summary: Altera a senha do usuário autenticado
	 *     tags: [Auth]
	 *     security:
	 *       - bearerAuth: []
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/ChangePasswordRequest'
	 *     responses:
	 *       200:
	 *         description: Senha alterada com sucesso
	 *       400:
	 *         description: Dados inválidos ou senha atual incorreta
	 *       401:
	 *         description: Não autorizado
	 *       500:
	 *         description: Erro interno do servidor
	 */
	router.post(
		"/change-password",
		asAuthHandler(authMiddleware.authenticate),
		asAuthHandler(authController.changePassword),
	);

	/**
	 * @swagger
	 * /api/auth/login-history:
	 *   get:
	 *     summary: Obtém o histórico de login do usuário autenticado
	 *     tags: [Auth]
	 *     security:
	 *       - bearerAuth: []
	 *     responses:
	 *       200:
	 *         description: Histórico de login
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: array
	 *               items:
	 *                 $ref: '#/components/schemas/LoginHistory'
	 *       401:
	 *         description: Não autorizado
	 *       500:
	 *         description: Erro interno do servidor
	 */
	router.get(
		"/login-history",
		asAuthHandler(authMiddleware.authenticate),
		asAuthHandler(authController.getLoginHistory),
	);

	return router;
};
