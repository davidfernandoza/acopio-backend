import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

type ValidationTarget = 'body' | 'params';

export function validateRequest(schema: Joi.ObjectSchema, target: ValidationTarget = 'body') {
  return (request: Request, response: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(request[target], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      response.status(400).json({
        message: 'Validation error',
        details: error.details.map((detail) => detail.message),
      });
      return;
    }

    request[target] = value;
    next();
  };
}
