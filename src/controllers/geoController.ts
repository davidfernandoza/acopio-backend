import { Request, Response, NextFunction } from 'express';
import * as geoService from '../services/geoService';

export async function getCountries(
  _request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const countries = await geoService.listCountries();
    response.status(200).json(countries);
  } catch (error) {
    next(error);
  }
}

export async function getDepartments(
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const departments = await geoService.listDepartmentsByCountry(
      Number(request.params.idCountry)
    );
    response.status(200).json(departments);
  } catch (error) {
    next(error);
  }
}

export async function getCities(
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const cities = await geoService.listCitiesByDepartment(
      Number(request.params.idDepartment)
    );
    response.status(200).json(cities);
  } catch (error) {
    next(error);
  }
}

export async function getCity(
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const city = await geoService.getCityById(Number(request.params.idCity));
    response.status(200).json(city);
  } catch (error) {
    next(error);
  }
}
