'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('acopio_needs');

    if (!tableDescription.need_type) {
      await queryInterface.addColumn('acopio_needs', 'need_type', {
        type: Sequelize.ENUM('product', 'money'),
        allowNull: false,
        defaultValue: 'product',
      });
    }

    if (!tableDescription.icon_key) {
      await queryInterface.addColumn('acopio_needs', 'icon_key', {
        type: Sequelize.STRING(40),
        allowNull: false,
        defaultValue: 'otro',
      });
    }

    if (!tableDescription.qr_path) {
      await queryInterface.addColumn('acopio_needs', 'qr_path', {
        type: Sequelize.STRING(500),
        allowNull: true,
      });
    }

    if (!tableDescription.bank_name) {
      await queryInterface.addColumn('acopio_needs', 'bank_name', {
        type: Sequelize.STRING(180),
        allowNull: true,
      });
    }

    if (!tableDescription.account_number) {
      await queryInterface.addColumn('acopio_needs', 'account_number', {
        type: Sequelize.STRING(80),
        allowNull: true,
      });
    }

    if (!tableDescription.account_holder) {
      await queryInterface.addColumn('acopio_needs', 'account_holder', {
        type: Sequelize.STRING(180),
        allowNull: true,
      });
    }

    if (!tableDescription.document_type) {
      await queryInterface.addColumn('acopio_needs', 'document_type', {
        type: Sequelize.ENUM('cc', 'ce', 'nit', 'passport', 'ti'),
        allowNull: true,
      });
    }

    if (!tableDescription.document_number) {
      await queryInterface.addColumn('acopio_needs', 'document_number', {
        type: Sequelize.STRING(40),
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('acopio_needs', 'document_number');
    await queryInterface.removeColumn('acopio_needs', 'document_type');
    await queryInterface.removeColumn('acopio_needs', 'account_holder');
    await queryInterface.removeColumn('acopio_needs', 'account_number');
    await queryInterface.removeColumn('acopio_needs', 'bank_name');
    await queryInterface.removeColumn('acopio_needs', 'qr_path');
    await queryInterface.removeColumn('acopio_needs', 'icon_key');
    await queryInterface.removeColumn('acopio_needs', 'need_type');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_acopio_needs_need_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_acopio_needs_document_type";');
  },
};
