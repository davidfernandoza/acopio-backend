import { City, Country, Department } from '../models';
import { HttpError } from '../middlewares/errorHandler';

export async function listCountries() {
  return Country.findAll({ order: [['name', 'ASC']] });
}

export async function listDepartmentsByCountry(idCountry: number) {
  const country = await Country.findByPk(idCountry);
  if (!country) {
    throw new HttpError(404, 'Country not found');
  }

  return Department.findAll({
    where: { idCountry },
    order: [['name', 'ASC']],
  });
}

export async function listCitiesByDepartment(idDepartment: number) {
  const department = await Department.findByPk(idDepartment);
  if (!department) {
    throw new HttpError(404, 'Department not found');
  }

  return City.findAll({
    where: { idDepartment },
    order: [['name', 'ASC']],
  });
}

export async function getCityById(idCity: number) {
  const city = await City.findByPk(idCity, {
    include: [
      {
        model: Department,
        as: 'department',
        include: [{ model: Country, as: 'country' }],
      },
    ],
  });

  if (!city) {
    throw new HttpError(404, 'City not found');
  }

  return city;
}
