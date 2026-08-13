import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import * as authService from '../services/authService';
import * as acopioService from '../services/acopioService';

export async function googleLogin(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await authService.loginWithGoogle(request.body.idToken);
    response.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function passwordLogin(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await authService.loginWithPassword(
      request.body.email,
      request.body.password
    );
    response.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function me(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await authService.getCurrentUser(request.authUser!.id);
    response.status(200).json(user);
  } catch (error) {
    next(error);
  }
}

export async function updateCredentials(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await authService.updateCredentials(
      request.authUser!.id,
      request.body
    );
    response.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function recoverPassword(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await authService.recoverManagerPassword(request.body.email);
    response.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function markWelcomeSeen(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await authService.markWelcomeSeen(request.authUser!.id);
    response.status(200).json(user);
  } catch (error) {
    next(error);
  }
}

export async function listMyAcopios(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const acopios = await acopioService.listMyAcopios(request.authUser!.id);
    response.status(200).json(acopios);
  } catch (error) {
    next(error);
  }
}
