import { Router } from 'express';
import { NotificationController } from '../controllers/notification-controller.js';
import { EmailNotificationController } from '../controllers/email-notification-controller.js';
import { SmsNotificationController } from '../controllers/sms-notification-controller.js';
import { WhatsAppNotificationController } from '../controllers/whatsapp-notification-controller.js';
import { AuthMiddleware } from '../middlewares/auth-middleware.js';

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
  // Rotas genéricas de notificação
  router.post(
    '/',
    authMiddleware.authenticate.bind(authMiddleware),
    notificationController.sendNotification.bind(notificationController),
  );

  router.get(
    '/by-scheduling/:schedulingId',
    authMiddleware.authenticate.bind(authMiddleware),
    notificationController.getNotificationsByScheduling.bind(notificationController),
  );

  router.post(
    '/resend/:id',
    authMiddleware.authenticate.bind(authMiddleware),
    notificationController.resendNotification.bind(notificationController),
  );

  router.post(
    '/process-pending',
    authMiddleware.authenticate.bind(authMiddleware),
    authMiddleware.requireAdminRole.bind(authMiddleware),
    notificationController.processPendingNotifications.bind(notificationController),
  );

  // Rotas de notificação por email
  router.post(
    '/email/scheduling-confirmation',
    authMiddleware.authenticate.bind(authMiddleware),
    emailNotificationController.sendSchedulingConfirmation.bind(emailNotificationController),
  );

  router.post(
    '/email/scheduling-reminder',
    authMiddleware.authenticate.bind(authMiddleware),
    emailNotificationController.sendSchedulingReminder.bind(emailNotificationController),
  );

  router.post(
    '/email/scheduling-cancellation',
    authMiddleware.authenticate.bind(authMiddleware),
    emailNotificationController.sendSchedulingCancellation.bind(emailNotificationController),
  );

  router.post(
    '/email/scheduling-rescheduled',
    authMiddleware.authenticate.bind(authMiddleware),
    emailNotificationController.sendSchedulingRescheduled.bind(emailNotificationController),
  );

  // Rotas de notificação por SMS
  router.post(
    '/sms/scheduling-confirmation',
    authMiddleware.authenticate.bind(authMiddleware),
    smsNotificationController.sendSchedulingConfirmation.bind(smsNotificationController),
  );

  router.post(
    '/sms/scheduling-reminder',
    authMiddleware.authenticate.bind(authMiddleware),
    smsNotificationController.sendSchedulingReminder.bind(smsNotificationController),
  );

  router.post(
    '/sms/scheduling-cancellation',
    authMiddleware.authenticate.bind(authMiddleware),
    smsNotificationController.sendSchedulingCancellation.bind(smsNotificationController),
  );

  // Rotas de notificação por WhatsApp
  router.post(
    '/whatsapp/scheduling-confirmation',
    authMiddleware.authenticate.bind(authMiddleware),
    whatsAppNotificationController.sendSchedulingConfirmation.bind(whatsAppNotificationController),
  );

  router.post(
    '/whatsapp/scheduling-reminder',
    authMiddleware.authenticate.bind(authMiddleware),
    whatsAppNotificationController.sendSchedulingReminder.bind(whatsAppNotificationController),
  );

  router.post(
    '/whatsapp/scheduling-cancellation',
    authMiddleware.authenticate.bind(authMiddleware),
    whatsAppNotificationController.sendSchedulingCancellation.bind(whatsAppNotificationController),
  );

  router.post(
    '/whatsapp/scheduling-rescheduled',
    authMiddleware.authenticate.bind(authMiddleware),
    whatsAppNotificationController.sendSchedulingRescheduled.bind(whatsAppNotificationController),
  );
} 