import { Router } from 'express';
import passport from 'passport';
import { AuthController } from '../controllers/auth-controller.js';
import { AuthMiddleware } from '../middlewares/auth-middleware.js';
import { loginRateLimiter, passwordResetRateLimiter } from '../middlewares/rate-limit-middleware.js';
import { asAuthHandler } from '../middlewares/express-utils.js';

/**
 * Configura as rotas de autenticação
 */
export const setupAuthRoutes = (
  router: Router,
  authController: AuthController,
  authMiddleware: AuthMiddleware,
): Router => {
  // Rotas públicas com proteção de rate limiting
  router.post('/login', loginRateLimiter, authController.login);
  router.post('/refresh-token', authController.refreshToken);
  router.post('/forgot-password', passwordResetRateLimiter, authController.forgotPassword);
  router.post('/reset-password', passwordResetRateLimiter, authController.resetPassword);

  // Rotas de autenticação OAuth
  router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );
  
  router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    authController.oauthCallback
  );

  // Rotas protegidas
  router.post('/logout', asAuthHandler(authMiddleware.authenticate), asAuthHandler(authController.logout));
  router.get('/profile', asAuthHandler(authMiddleware.authenticate), asAuthHandler(authController.getProfile));
  router.post('/change-password', asAuthHandler(authMiddleware.authenticate), asAuthHandler(authController.changePassword));
  router.get('/login-history', asAuthHandler(authMiddleware.authenticate), asAuthHandler(authController.getLoginHistory));
  
  return router;
}; 