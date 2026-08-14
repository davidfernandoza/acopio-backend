'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const [existingRows] = await queryInterface.sequelize.query(
      `SELECT id FROM need_categories WHERE category_key = :categoryKey LIMIT 1`,
      { replacements: { categoryKey: 'transporte' } }
    );

    if (!existingRows.length) {
      await queryInterface.bulkInsert('need_categories', [
        {
          category_key: 'transporte',
          name: 'Transporte',
          is_default: false,
          sort_order: 7,
          created_at: now,
          updated_at: now,
        },
      ]);
    }

    await queryInterface.bulkUpdate(
      'need_categories',
      { sort_order: 7, updated_at: now },
      { category_key: 'transporte' }
    );
    await queryInterface.bulkUpdate(
      'need_categories',
      { sort_order: 8, updated_at: now },
      { category_key: 'sin_categoria' }
    );
  },

  async down(queryInterface) {
    const now = new Date();
    await queryInterface.bulkDelete('need_categories', { category_key: 'transporte' });
    await queryInterface.bulkUpdate(
      'need_categories',
      { sort_order: 7, updated_at: now },
      { category_key: 'sin_categoria' }
    );
  },
};
