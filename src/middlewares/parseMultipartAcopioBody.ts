import { NextFunction, Request, Response } from 'express';
import { HttpError } from './errorHandler';

function parseJsonField(rawValue: unknown, fieldName: string) {
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return undefined;
  }
  if (typeof rawValue === 'object') {
    return rawValue;
  }
  if (typeof rawValue !== 'string') {
    throw new HttpError(400, `Invalid ${fieldName}`);
  }
  try {
    return JSON.parse(rawValue);
  } catch {
    throw new HttpError(400, `Invalid JSON in ${fieldName}`);
  }
}

export function parseMultipartAcopioBody(
  request: Request,
  _response: Response,
  next: NextFunction
): void {
  try {
    const body = request.body || {};

    if (body.address !== undefined) {
      body.address = parseJsonField(body.address, 'address');
    }
    if (body.contacts !== undefined) {
      body.contacts = parseJsonField(body.contacts, 'contacts');
    }
    if (body.needs !== undefined) {
      body.needs = parseJsonField(body.needs, 'needs');
    }
    if (body.offers !== undefined) {
      body.offers = parseJsonField(body.offers, 'offers');
    }
    if (body.managers !== undefined) {
      body.managers = parseJsonField(body.managers, 'managers');
    }
    if (body.startsAt === '') {
      body.startsAt = null;
    }
    if (body.endsAt === '') {
      body.endsAt = null;
    }
    if (body.description === '') {
      body.description = null;
    }

    request.body = body;
    next();
  } catch (error) {
    next(error);
  }
}
