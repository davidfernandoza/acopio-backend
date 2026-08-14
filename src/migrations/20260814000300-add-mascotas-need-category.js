'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const [existingRows] = await queryInterface.sequelize.query(
      `SELECT id FROM need_categories WHERE category_key = :categoryKey LIMIT 1`,
      { replacements: { categoryKey: 'mascotas' } }
    );

    if (!existingRows.length) {
      await queryInterface.bulkInsert('need_categories', [
        {
          category_key: 'mascotas',
          name: 'Mascotas',
          is_default: false,
          sort_order: 2,
          created_at: now,
          updated_at: now,
        },
      ]);
    }

    await queryInterface.bulkUpdate(
      'need_categories',
      { sort_order: 2, updated_at: now },
      { category_key: 'mascotas' }
    );
    await queryInterface.bulkUpdate(
      'need_categories',
      { sort_order: 3, updated_at: now },
      { category_key: 'movilidad' }
    );
    await queryInterface.bulkUpdate(
      'need_categories',
      { sort_order: 4, updated_at: now },
      { category_key: 'medicamentos' }
    );
    await queryInterface.bulkUpdate(
      'need_categories',
      { sort_order: 5, updated_at: now },
      { category_key: 'alimentacion_hidratacion' }
    );
    await queryInterface.bulkUpdate(
      'need_categories',
      { sort_order: 6, updated_at: now },
      { category_key: 'construccion' }
    );
    await queryInterface.bulkUpdate(
      'need_categories',
      { sort_order: 7, updated_at: now },
      { category_key: 'sin_categoria' }
    );
  },

  async down(queryInterface) {
    const now = new Date();
    await queryInterface.bulkDelete('need_categories', { category_key: 'mascotas' });
    await queryInterface.bulkUpdate(
      'need_categories',
      { sort_order: 2, updated_at: now },
      { category_key: 'movilidad' }
    );
    await queryInterface.bulkUpdate(
      'need_categories',
      { sort_order: 3, updated_at: now },
      { category_key: 'medicamentos' }
    );
    await queryInterface.bulkUpdate(
      'need_categories',
      { sort_order: 4, updated_at: now },
      { category_key: 'alimentacion_hidratacion' }
    );
    await queryInterface.bulkUpdate(
      'need_categories',
      { sort_order: 5, updated_at: now },
      { category_key: 'construccion' }
    );
    await queryInterface.bulkUpdate(
      'need_categories',
      { sort_order: 6, updated_at: now },
      { category_key: 'sin_categoria' }
    );
  },
};
