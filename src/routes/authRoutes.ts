import { Router } from 'express';
import * as authController from '../controllers/authController';
import { requireAuth } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validateRequest';
import {
  emptyBodySchema,
  googleAuthBodySchema,
  loginBodySchema,
  recoverPasswordBodySchema,
  updateCredentialsBodySchema,
} from '../requests/schemas';

const authRouter = Router();

authRouter.post(
  '/google',
  validateRequest(googleAuthBodySchema, 'body'),
  authController.googleLogin
);

authRouter.post(
  '/login',
  validateRequest(loginBodySchema, 'body'),
  authController.passwordLogin
);

authRouter.post(
  '/recover-password',
  validateRequest(recoverPasswordBodySchema, 'body'),
  authController.recoverPassword
);

authRouter.get('/me', requireAuth, authController.me);

authRouter.post(
  '/welcome-seen',
  requireAuth,
  validateRequest(emptyBodySchema, 'body'),
  authController.markWelcomeSeen
);

authRouter.put(
  '/credentials',
  requireAuth,
  validateRequest(updateCredentialsBodySchema, 'body'),
  authController.updateCredentials
);

authRouter.get('/my-acopios', requireAuth, authController.listMyAcopios);

export default authRouter;
