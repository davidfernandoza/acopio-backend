import { Router } from 'express';
import * as contactController from '../controllers/contactController';
import { validateRequest } from '../middlewares/validateRequest';
import { contactBodySchema } from '../requests/schemas';

const contactRouter = Router();

contactRouter.post(
  '/',
  validateRequest(contactBodySchema, 'body'),
  contactController.sendContactMessage
);

export default contactRouter;
