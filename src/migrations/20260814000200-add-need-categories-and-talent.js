'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('need_categories', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      category_key: {
        type: Sequelize.STRING(80),
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      is_default: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    const now = new Date();
    await queryInterface.bulkInsert('need_categories', [
      {
        category_key: 'cuidado_bienestar',
        name: 'Cuidado y bienestar',
        is_default: false,
        sort_order: 1,
        created_at: now,
        updated_at: now,
      },
      {
        category_key: 'movilidad',
        name: 'Movilidad',
        is_default: false,
        sort_order: 2,
        created_at: now,
        updated_at: now,
      },
      {
        category_key: 'medicamentos',
        name: 'Medicamentos',
        is_default: false,
        sort_order: 3,
        created_at: now,
        updated_at: now,
      },
      {
        category_key: 'alimentacion_hidratacion',
        name: 'Alimentación e hidratación',
        is_default: false,
        sort_order: 4,
        created_at: now,
        updated_at: now,
      },
      {
        category_key: 'construccion',
        name: 'Construcción',
        is_default: false,
        sort_order: 5,
        created_at: now,
        updated_at: now,
      },
      {
        category_key: 'sin_categoria',
        name: 'Sin categoría',
        is_default: true,
        sort_order: 6,
        created_at: now,
        updated_at: now,
      },
    ]);

    await queryInterface.addColumn('acopio_needs', 'id_category', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'need_categories', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.sequelize.query(`
      UPDATE acopio_needs AS needs
      SET id_category = categories.id
      FROM need_categories AS categories
      WHERE needs.need_type = 'product'
        AND categories.category_key = 'sin_categoria'
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE acopio_needs
      ALTER COLUMN need_type TYPE VARCHAR(40)
    `);
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_acopio_needs_need_type"
    `);
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_acopio_needs_need_type" AS ENUM ('product', 'money', 'talent')
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE acopio_needs
      ALTER COLUMN need_type TYPE "enum_acopio_needs_need_type"
      USING need_type::"enum_acopio_needs_need_type"
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE acopio_needs
      ALTER COLUMN need_type TYPE VARCHAR(40)
    `);
    await queryInterface.sequelize.query(`
      UPDATE acopio_needs
      SET need_type = 'product'
      WHERE need_type = 'talent'
    `);
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_acopio_needs_need_type"
    `);
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_acopio_needs_need_type" AS ENUM ('product', 'money')
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE acopio_needs
      ALTER COLUMN need_type TYPE "enum_acopio_needs_need_type"
      USING need_type::"enum_acopio_needs_need_type"
    `);

    await queryInterface.removeColumn('acopio_needs', 'id_category');
    await queryInterface.dropTable('need_categories');
  },
};
