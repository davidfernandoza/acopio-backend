'use strict';

const needCategories = [
  {
    category_key: 'cuidado_bienestar',
    name: 'Cuidado y bienestar',
    is_default: false,
    sort_order: 1,
  },
  {
    category_key: 'mascotas',
    name: 'Mascotas',
    is_default: false,
    sort_order: 2,
  },
  {
    category_key: 'movilidad',
    name: 'Movilidad',
    is_default: false,
    sort_order: 3,
  },
  {
    category_key: 'medicamentos',
    name: 'Medicamentos',
    is_default: false,
    sort_order: 4,
  },
  {
    category_key: 'alimentacion_hidratacion',
    name: 'Alimentación e hidratación',
    is_default: false,
    sort_order: 5,
  },
  {
    category_key: 'construccion',
    name: 'Construcción',
    is_default: false,
    sort_order: 6,
  },
  {
    category_key: 'transporte',
    name: 'Transporte',
    is_default: false,
    sort_order: 7,
  },
  {
    category_key: 'sin_categoria',
    name: 'Sin categoría',
    is_default: true,
    sort_order: 8,
  },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    for (const category of needCategories) {
      const [existingRows] = await queryInterface.sequelize.query(
        `SELECT id FROM need_categories WHERE category_key = :categoryKey LIMIT 1`,
        { replacements: { categoryKey: category.category_key } }
      );

      if (existingRows.length) {
        await queryInterface.bulkUpdate(
          'need_categories',
          {
            name: category.name,
            is_default: category.is_default,
            sort_order: category.sort_order,
            updated_at: now,
          },
          { category_key: category.category_key }
        );
        continue;
      }

      await queryInterface.bulkInsert('need_categories', [
        {
          ...category,
          created_at: now,
          updated_at: now,
        },
      ]);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete(
      'need_categories',
      {
        category_key: needCategories.map((category) => category.category_key),
      },
      {}
    );
  },
};
