import { Router } from 'express';
import * as geoController from '../controllers/geoController';
import { validateRequest } from '../middlewares/validateRequest';
import {
  idCityParamsSchema,
  idCountryParamsSchema,
  idDepartmentParamsSchema,
} from '../requests/schemas';

const geoRouter = Router();

geoRouter.get('/countries', geoController.getCountries);

geoRouter.get(
  '/countries/:idCountry/departments',
  validateRequest(idCountryParamsSchema, 'params'),
  geoController.getDepartments
);

geoRouter.get(
  '/departments/:idDepartment/cities',
  validateRequest(idDepartmentParamsSchema, 'params'),
  geoController.getCities
);

geoRouter.get(
  '/cities/:idCity',
  validateRequest(idCityParamsSchema, 'params'),
  geoController.getCity
);

export default geoRouter;
