'use strict';

/**
 * Regenera geo-colombia-venezuela.json
 * - Colombia: municipios/cabeceras desde data/divipola.xls (DIVIPOLA DANE)
 * - Venezuela: ciudades desde data/ve.csv
 *
 * Uso: npm run geo:build
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const dataDirectory = path.join(__dirname, '..', 'data');
const outputFilePath = path.join(dataDirectory, 'geo-colombia-venezuela.json');
const divipolaFilePath = path.join(dataDirectory, 'divipola.xls');
const venezuelaCsvFilePath = path.join(dataDirectory, 've.csv');

function toTitleCase(text) {
  return String(text)
    .toLowerCase()
    .replace(/(^|[\s'.-/])(\S)/g, (_match, separator, character) => {
      return separator + character.toUpperCase();
    });
}

function normalizeKey(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function parseCsv(content) {
  const lines = content.replace(/^\uFEFF/, '').trim().split(/\r?\n/);
  const headers = lines[0].split(',').map((header) => header.trim());
  const records = [];

  for (const line of lines.slice(1)) {
    if (!line.trim()) {
      continue;
    }
    const values = line.split(',');
    if (values.length < headers.length) {
      continue;
    }
    const record = {};
    headers.forEach((header, index) => {
      record[header] = values[index] !== undefined ? values[index].trim() : '';
    });
    records.push(record);
  }

  return records;
}

function buildColombiaFromDivipola(existingColombia) {
  const knownCoordinates = new Map();
  if (existingColombia) {
    for (const department of existingColombia.departments || []) {
      for (const city of department.cities || []) {
        if (city.latitude === 4.570868 && city.longitude === -74.297333) {
          continue;
        }
        knownCoordinates.set(normalizeKey(city.name), {
          latitude: city.latitude,
          longitude: city.longitude,
        });
      }
    }
  }

  knownCoordinates.set(normalizeKey('Bogotá, D.C.'), {
    latitude: 4.711,
    longitude: -74.0721,
  });
  knownCoordinates.set(normalizeKey('Bogotá'), {
    latitude: 4.711,
    longitude: -74.0721,
  });

  const workbook = XLSX.readFile(divipolaFilePath);
  const sheet = workbook.Sheets['Listado Vigentes'];
  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
    raw: false,
  });
  const headerIndex = rows.findIndex(
    (row) => row && String(row[0] || '').includes('Código Departamento')
  );

  if (headerIndex < 0) {
    throw new Error('No se encontró el encabezado DIVIPOLA');
  }

  const dataRows = rows
    .slice(headerIndex + 1)
    .filter((row) => row && row[0] && row[3] && row[4]);

  const departmentsMap = new Map();

  for (const row of dataRows) {
    const departmentCode = String(row[0]).padStart(2, '0');
    const municipalityCode = String(row[1]).padStart(5, '0');
    const populatedCenterCode = String(row[2] || '');
    const departmentNameRaw = String(row[3]).trim();
    const municipalityNameRaw = String(row[4]).trim();
    const typeCode = String(row[6] || '').trim();

    const isMunicipalSeat =
      typeCode === 'CM' || populatedCenterCode.endsWith('000');
    if (!isMunicipalSeat) {
      continue;
    }

    if (!departmentsMap.has(departmentCode)) {
      departmentsMap.set(departmentCode, {
        name: toTitleCase(departmentNameRaw),
        code: departmentCode,
        citiesMap: new Map(),
      });
    }

    const department = departmentsMap.get(departmentCode);
    if (!department.citiesMap.has(municipalityCode)) {
      const cityName = toTitleCase(municipalityNameRaw);
      const knownCoordinate = knownCoordinates.get(normalizeKey(cityName));
      department.citiesMap.set(municipalityCode, {
        name: cityName,
        code: municipalityCode,
        latitude: knownCoordinate ? knownCoordinate.latitude : 4.570868,
        longitude: knownCoordinate ? knownCoordinate.longitude : -74.297333,
      });
    }
  }

  return [...departmentsMap.values()]
    .sort((left, right) => left.name.localeCompare(right.name, 'es'))
    .map((department) => ({
      name: department.name,
      code: department.code,
      cities: [...department.citiesMap.values()].sort((left, right) =>
        left.name.localeCompare(right.name, 'es')
      ),
    }));
}

function buildVenezuelaFromCsv() {
  if (!fs.existsSync(venezuelaCsvFilePath)) {
    throw new Error(`No existe ${venezuelaCsvFilePath}`);
  }

  const records = parseCsv(fs.readFileSync(venezuelaCsvFilePath, 'utf8'));
  const departmentsMap = new Map();

  for (const record of records) {
    const cityName = String(record.city || '').trim();
    const adminName = String(record.admin_name || '').trim();
    const latitude = Number(record.lat);
    const longitude = Number(record.lng);

    if (!cityName || !adminName || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      continue;
    }

    if (!departmentsMap.has(adminName)) {
      departmentsMap.set(adminName, {
        name: adminName,
        code: normalizeKey(adminName).slice(0, 12).toUpperCase() || adminName.slice(0, 3).toUpperCase(),
        citiesMap: new Map(),
      });
    }

    const department = departmentsMap.get(adminName);
    const cityKey = normalizeKey(cityName);
    if (!department.citiesMap.has(cityKey)) {
      department.citiesMap.set(cityKey, {
        name: cityName,
        latitude,
        longitude,
      });
    }
  }

  return [...departmentsMap.values()]
    .sort((left, right) => left.name.localeCompare(right.name, 'es'))
    .map((department) => ({
      name: department.name,
      code: department.code,
      cities: [...department.citiesMap.values()].sort((left, right) =>
        left.name.localeCompare(right.name, 'es')
      ),
    }));
}

const existingGeoData = fs.existsSync(outputFilePath)
  ? JSON.parse(fs.readFileSync(outputFilePath, 'utf8'))
  : { countries: [] };
const existingColombia = existingGeoData.countries.find(
  (country) => country.code === 'CO'
);

const colombiaDepartments = buildColombiaFromDivipola(existingColombia);
const venezuelaDepartments = buildVenezuelaFromCsv();

const output = {
  countries: [
    {
      code: 'CO',
      name: 'Colombia',
      phoneCode: '+57',
      departments: colombiaDepartments,
    },
    {
      code: 'VE',
      name: 'Venezuela',
      phoneCode: '+58',
      departments: venezuelaDepartments,
    },
  ],
};

fs.writeFileSync(outputFilePath, `${JSON.stringify(output, null, 2)}\n`);

const colombiaCityCount = colombiaDepartments.reduce(
  (total, department) => total + department.cities.length,
  0
);
const venezuelaCityCount = venezuelaDepartments.reduce(
  (total, department) => total + department.cities.length,
  0
);

console.log(
  `Colombia DIVIPOLA: ${colombiaDepartments.length} departamentos, ${colombiaCityCount} municipios`
);
console.log(
  `Venezuela CSV: ${venezuelaDepartments.length} estados, ${venezuelaCityCount} ciudades`
);
