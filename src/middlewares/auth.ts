import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { appConfig } from '../config/appConfig';
import { HttpError } from './errorHandler';
import { Acopio, AcopioManager } from '../models';

export interface AuthUserPayload {
  id: number;
  email: string;
  name: string;
}

export interface AuthenticatedRequest extends Request {
  authUser?: AuthUserPayload;
}

export function requireAuth(
  request: AuthenticatedRequest,
  _response: Response,
  next: NextFunction
): void {
  try {
    const authorizationHeader = request.headers.authorization;
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw new HttpError(401, 'Authentication required');
    }

    const token = authorizationHeader.slice('Bearer '.length);
    const decodedToken = jwt.verify(token, appConfig.jwtSecret) as AuthUserPayload;
    request.authUser = decodedToken;
    next();
  } catch (error) {
    if (error instanceof HttpError) {
      next(error);
      return;
    }
    next(new HttpError(401, 'Invalid or expired token'));
  }
}

export async function requireAcopioManager(
  request: AuthenticatedRequest,
  _response: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!request.authUser) {
      throw new HttpError(401, 'Authentication required');
    }

    const idAcopio = Number(request.params.idAcopio);
    if (!Number.isInteger(idAcopio) || idAcopio <= 0) {
      throw new HttpError(400, 'Invalid acopio id');
    }

    const acopio = await Acopio.findByPk(idAcopio);
    if (!acopio) {
      throw new HttpError(404, 'Acopio not found');
    }

    if (acopio.idOwner === request.authUser.id) {
      next();
      return;
    }

    const manager = await AcopioManager.findOne({
      where: {
        idAcopio,
        idUser: request.authUser.id,
      },
    });

    if (!manager) {
      throw new HttpError(403, 'You are not allowed to manage this acopio');
    }

    next();
  } catch (error) {
    next(error);
  }
}

export async function requireAcopioOwner(
  request: AuthenticatedRequest,
  _response: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!request.authUser) {
      throw new HttpError(401, 'Authentication required');
    }

    const idAcopio = Number(request.params.idAcopio);
    if (!Number.isInteger(idAcopio) || idAcopio <= 0) {
      throw new HttpError(400, 'Invalid acopio id');
    }

    const acopio = await Acopio.findByPk(idAcopio);
    if (!acopio) {
      throw new HttpError(404, 'Acopio not found');
    }

    if (acopio.idOwner !== request.authUser.id) {
      throw new HttpError(403, 'Only the acopio owner can manage users');
    }

    next();
  } catch (error) {
    next(error);
  }
}
