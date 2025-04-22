import { Router, Request, Response, NextFunction, RequestHandler } from "express";
import { CustomerNotificationController } from "../controllers/customer-notification-controller.js";
import { AuthMiddleware, AuthenticatedRequest } from "../middlewares/auth-middleware.js";

/**
 * Adaptador para o middleware de autenticação
 * Resolve problemas de tipagem entre o middleware e o Express
 */
function authMiddlewareAdapter(
	middleware: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler {
	return (req: Request, res: Response, next: NextFunction) => {
		return middleware(req as AuthenticatedRequest, res, next);
	};
}

/**
 * Adaptador para o middleware de verificação de papel
 */
function roleMiddlewareAdapter(
	roleMiddleware: (
		role: string,
	) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void,
): (role: string) => RequestHandler {
	return (role: string) => {
		const middleware = roleMiddleware(role);
		return (req: Request, res: Response, next: NextFunction) => {
			return middleware(req as AuthenticatedRequest, res, next);
		};
	};
}

/**
 * Configura as rotas para notificações de clientes e pets
 * @param router Router do Express
 * @param customerNotificationController Controlador de notificações de cliente
 * @param authMiddleware Middleware de autenticação
 */
export function setupCustomerNotificationRoutes(
	router: Router,
	customerNotificationController: CustomerNotificationController,
	authMiddleware: AuthMiddleware,
): void {
	// Adaptar middlewares de autenticação
	const authenticate = authMiddlewareAdapter(authMiddleware.authenticate.bind(authMiddleware));
	const hasRole = roleMiddlewareAdapter(authMiddleware.hasRole.bind(authMiddleware));

	// Rota para enviar notificação de boas-vindas
	/**
	 * @swagger
	 * /api/customer-notifications/welcome:
	 *   post:
	 *     summary: Envia uma notificação de boas-vindas para um cliente
	 *     tags: [Notificações de Cliente]
	 *     security:
	 *       - bearerAuth: []
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             required:
	 *               - customerId
	 *             properties:
	 *               customerId:
	 *                 type: string
	 *                 format: uuid
	 *                 description: ID do cliente que receberá a notificação
	 *               template:
	 *                 type: string
	 *                 enum: [default, premium, promotional]
	 *                 default: default
	 *                 description: Tipo de template a ser usado
	 *     responses:
	 *       200:
	 *         description: Notificação de boas-vindas enviada com sucesso
	 *       400:
	 *         description: Dados inválidos na requisição
	 *       401:
	 *         description: Não autorizado
	 *       404:
	 *         description: Cliente não encontrado
	 *       500:
	 *         description: Erro interno do servidor
	 */
	router.post(
		"/welcome",
		authenticate,
		customerNotificationController.sendWelcomeNotification.bind(customerNotificationController),
	);

	// Rota para enviar lembrete de checkup para pet
	/**
	 * @swagger
	 * /api/customer-notifications/pet-checkup:
	 *   post:
	 *     summary: Envia um lembrete de checkup para um pet
	 *     tags: [Notificações de Cliente]
	 *     security:
	 *       - bearerAuth: []
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             required:
	 *               - petId
	 *               - checkupType
	 *               - dueDate
	 *             properties:
	 *               petId:
	 *                 type: string
	 *                 format: uuid
	 *                 description: ID do pet
	 *               checkupType:
	 *                 type: string
	 *                 description: Tipo de checkup (vacina, vermífugo, etc.)
	 *                 example: vacina
	 *               dueDate:
	 *                 type: string
	 *                 format: date
	 *                 description: Data prevista para o checkup
	 *               additionalInfo:
	 *                 type: string
	 *                 description: Informações adicionais sobre o checkup
	 *     responses:
	 *       200:
	 *         description: Lembrete de checkup enviado com sucesso
	 *       400:
	 *         description: Dados inválidos na requisição
	 *       401:
	 *         description: Não autorizado
	 *       404:
	 *         description: Pet não encontrado
	 *       500:
	 *         description: Erro interno do servidor
	 */
	router.post(
		"/pet-checkup",
		authenticate,
		customerNotificationController.sendPetCheckupReminder.bind(customerNotificationController),
	);

	// Rota para enviar lembretes de checkup pendentes (job administrativo)
	/**
	 * @swagger
	 * /api/customer-notifications/pending-checkups:
	 *   post:
	 *     summary: Envia lembretes para checkups pendentes de pets
	 *     tags: [Notificações de Cliente]
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: query
	 *         name: days
	 *         schema:
	 *           type: integer
	 *           default: 7
	 *         description: Quantidade de dias à frente para buscar checkups
	 *       - in: query
	 *         name: types
	 *         schema:
	 *           type: string
	 *         description: Tipos de checkup separados por vírgula (vacina,vermifugo,exame)
	 *     responses:
	 *       200:
	 *         description: Lembretes de checkup processados com sucesso
	 *       401:
	 *         description: Não autorizado
	 *       403:
	 *         description: Acesso proibido (requer função de administrador)
	 *       500:
	 *         description: Erro interno do servidor
	 */
	router.post(
		"/pending-checkups",
		authenticate,
		hasRole("admin"),
		customerNotificationController.sendPendingCheckupReminders.bind(customerNotificationController),
	);
}
