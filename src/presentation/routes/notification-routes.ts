import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { NotificationController } from '../controllers/notification-controller.js';
import { EmailNotificationController } from '../controllers/email-notification-controller.js';
import { SmsNotificationController } from '../controllers/sms-notification-controller.js';
import { WhatsAppNotificationController } from '../controllers/whatsapp-notification-controller.js';
import { AuthMiddleware, AuthenticatedRequest } from '../middlewares/auth-middleware.js';

/**
 * Adaptador para o middleware de autenticação
 * Resolve problemas de tipagem entre o middleware e o Express
 */
function authMiddlewareAdapter(middleware: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    return middleware(req as AuthenticatedRequest, res, next);
  };
}

/**
 * Adaptador para o middleware de verificação de papel
 */
function roleMiddlewareAdapter(roleMiddleware: (role: string) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void): (role: string) => RequestHandler {
  return (role: string) => {
    const middleware = roleMiddleware(role);
    return (req: Request, res: Response, next: NextFunction) => {
      return middleware(req as AuthenticatedRequest, res, next);
    };
  };
}

/**
 * Configura as rotas para notificações
 * @param router Router do Express
 * @param notificationController Controlador de notificações
 * @param emailNotificationController Controlador de notificações por email
 * @param smsNotificationController Controlador de notificações por SMS
 * @param whatsAppNotificationController Controlador de notificações por WhatsApp
 * @param authMiddleware Middleware de autenticação
 */
export function setupNotificationRoutes(
  router: Router,
  notificationController: NotificationController,
  emailNotificationController: EmailNotificationController,
  smsNotificationController: SmsNotificationController,
  whatsAppNotificationController: WhatsAppNotificationController,
  authMiddleware: AuthMiddleware,
): void {
  // Adaptar middlewares de autenticação
  const authenticate = authMiddlewareAdapter(authMiddleware.authenticate.bind(authMiddleware));
  const hasRole = roleMiddlewareAdapter(authMiddleware.hasRole.bind(authMiddleware));
  
  // Rotas genéricas de notificação
  
  /**
   * @swagger
   * /api/notifications:
   *   post:
   *     summary: Envia uma notificação genérica
   *     tags: [Notificações]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - type
   *               - templateCode
   *               - schedulingId
   *             properties:
   *               type:
   *                 type: string
   *                 enum: [email, sms, whatsapp]
   *                 example: email
   *               templateCode:
   *                 type: string
   *                 example: scheduling_confirmation
   *               templateData:
   *                 type: object
   *                 example: { "customerName": "João Silva", "petName": "Rex" }
   *               schedulingId:
   *                 type: string
   *                 format: uuid
   *     responses:
   *       201:
   *         description: Notificação criada e enviada com sucesso
   *       400:
   *         description: Dados inválidos na requisição
   *       401:
   *         description: Não autorizado
   *       500:
   *         description: Erro interno do servidor
   */
  router.post(
    '/',
    authenticate,
    notificationController.sendNotification.bind(notificationController),
  );

  /**
   * @swagger
   * /api/notifications/by-scheduling/{schedulingId}:
   *   get:
   *     summary: Obtém todas as notificações de um agendamento
   *     tags: [Notificações]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: schedulingId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do agendamento
   *     responses:
   *       200:
   *         description: Lista de notificações recuperada com sucesso
   *       400:
   *         description: ID de agendamento inválido
   *       401:
   *         description: Não autorizado
   *       500:
   *         description: Erro interno do servidor
   */
  router.get(
    '/by-scheduling/:schedulingId',
    authenticate,
    notificationController.getNotificationsByScheduling.bind(notificationController),
  );

  /**
   * @swagger
   * /api/notifications/resend/{id}:
   *   post:
   *     summary: Reenvia uma notificação específica
   *     tags: [Notificações]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID da notificação
   *     responses:
   *       200:
   *         description: Notificação reenviada com sucesso
   *       400:
   *         description: ID de notificação inválido
   *       401:
   *         description: Não autorizado
   *       404:
   *         description: Notificação não encontrada
   *       500:
   *         description: Erro interno do servidor
   */
  router.post(
    '/resend/:id',
    authenticate,
    notificationController.resendNotification.bind(notificationController),
  );

  /**
   * @swagger
   * /api/notifications/process-pending:
   *   post:
   *     summary: Processa notificações pendentes
   *     tags: [Notificações]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *         description: Número máximo de notificações a processar
   *     responses:
   *       200:
   *         description: Notificações processadas com sucesso
   *       401:
   *         description: Não autorizado
   *       403:
   *         description: Acesso proibido (requer função de administrador)
   *       500:
   *         description: Erro interno do servidor
   */
  router.post(
    '/process-pending',
    authenticate,
    hasRole('admin'),
    notificationController.processPendingNotifications.bind(notificationController),
  );

  // Rotas de notificação por email
  
  /**
   * @swagger
   * /api/notifications/email/scheduling-confirmation:
   *   post:
   *     summary: Envia uma notificação de confirmação de agendamento por email
   *     tags: [Notificações por Email]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - schedulingId
   *             properties:
   *               schedulingId:
   *                 type: string
   *                 format: uuid
   *               additionalInfo:
   *                 type: string
   *     responses:
   *       200:
   *         description: Email de confirmação enviado com sucesso
   *       400:
   *         description: Dados inválidos na requisição
   *       401:
   *         description: Não autorizado
   *       500:
   *         description: Erro interno do servidor
   */
  router.post(
    '/email/scheduling-confirmation',
    authenticate,
    emailNotificationController.sendSchedulingConfirmation.bind(emailNotificationController),
  );

  router.post(
    '/email/scheduling-reminder',
    authenticate,
    emailNotificationController.sendSchedulingReminder.bind(emailNotificationController),
  );

  router.post(
    '/email/scheduling-cancellation',
    authenticate,
    emailNotificationController.sendSchedulingCancellation.bind(emailNotificationController),
  );

  router.post(
    '/email/scheduling-rescheduled',
    authenticate,
    emailNotificationController.sendSchedulingRescheduled.bind(emailNotificationController),
  );

  // Rotas de notificação por SMS
  router.post(
    '/sms/scheduling-confirmation',
    authenticate,
    smsNotificationController.sendSchedulingConfirmation.bind(smsNotificationController),
  );

  router.post(
    '/sms/scheduling-reminder',
    authenticate,
    smsNotificationController.sendSchedulingReminder.bind(smsNotificationController),
  );

  router.post(
    '/sms/scheduling-cancellation',
    authenticate,
    smsNotificationController.sendSchedulingCancellation.bind(smsNotificationController),
  );

  // Rotas de notificação por WhatsApp
  router.post(
    '/whatsapp/scheduling-confirmation',
    authenticate,
    whatsAppNotificationController.sendSchedulingConfirmation.bind(whatsAppNotificationController),
  );

  router.post(
    '/whatsapp/scheduling-reminder',
    authenticate,
    whatsAppNotificationController.sendSchedulingReminder.bind(whatsAppNotificationController),
  );

  router.post(
    '/whatsapp/scheduling-cancellation',
    authenticate,
    whatsAppNotificationController.sendSchedulingCancellation.bind(whatsAppNotificationController),
  );

  router.post(
    '/whatsapp/scheduling-rescheduled',
    authenticate,
    whatsAppNotificationController.sendSchedulingRescheduled.bind(whatsAppNotificationController),
  );
} 