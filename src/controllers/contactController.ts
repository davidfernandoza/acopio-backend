import { Request, Response, NextFunction } from 'express';
import { sendContactSupportEmail } from '../services/mailService';

export async function sendContactMessage(
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    await sendContactSupportEmail({
      name: request.body.name,
      email: request.body.email,
      message: request.body.message,
    });
    response.status(200).json({ message: 'Mensaje enviado' });
  } catch (error) {
    next(error);
  }
}
