'use strict';

/**
 * Seed geo:
 * - Colombia: DIVIPOLA (data/divipola.xls)
 * - Venezuela: data/ve.csv
 * Regenerar JSON: npm run geo:build
 */
const geoData = require('../data/geo-colombia-venezuela.json');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const sequelize = queryInterface.sequelize;

    for (const countryData of geoData.countries) {
      await queryInterface.bulkInsert('countries', [
        {
          name: countryData.name,
          code: countryData.code,
          phone_code: countryData.phoneCode,
          created_at: now,
          updated_at: now,
        },
      ]);

      const [countryRows] = await sequelize.query(
        `SELECT id FROM countries WHERE code = :countryCode LIMIT 1`,
        { replacements: { countryCode: countryData.code } }
      );
      const insertedCountryId = countryRows[0].id;

      for (const departmentData of countryData.departments) {
        await queryInterface.bulkInsert('departments', [
          {
            id_country: insertedCountryId,
            name: departmentData.name,
            code: departmentData.code,
            created_at: now,
            updated_at: now,
          },
        ]);

        const [departmentRows] = await sequelize.query(
          `SELECT id FROM departments
           WHERE id_country = :idCountry AND name = :departmentName
           ORDER BY id DESC LIMIT 1`,
          {
            replacements: {
              idCountry: insertedCountryId,
              departmentName: departmentData.name,
            },
          }
        );
        const insertedDepartmentId = departmentRows[0].id;

        const cityRows = departmentData.cities.map((cityData) => ({
          id_department: insertedDepartmentId,
          name: cityData.name,
          latitude: cityData.latitude,
          longitude: cityData.longitude,
          created_at: now,
          updated_at: now,
        }));

        if (cityRows.length > 0) {
          await queryInterface.bulkInsert('cities', cityRows);
        }
      }
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('cities', null, {});
    await queryInterface.bulkDelete('departments', null, {});
    await queryInterface.bulkDelete('countries', null, {});
  },
};
