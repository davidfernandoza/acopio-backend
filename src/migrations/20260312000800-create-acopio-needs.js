'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('acopio_needs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      id_acopio: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'acopios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      need_type: {
        type: Sequelize.ENUM('product', 'money'),
        allowNull: false,
      },
      icon_key: {
        type: Sequelize.STRING(40),
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(180),
        allowNull: false,
      },
      unit: {
        type: Sequelize.STRING(40),
        allowNull: true,
      },
      has_limit: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      target_quantity: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      },
      received_quantity: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      qr_path: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      bank_name: {
        type: Sequelize.STRING(180),
        allowNull: true,
      },
      account_number: {
        type: Sequelize.STRING(80),
        allowNull: true,
      },
      account_holder: {
        type: Sequelize.STRING(180),
        allowNull: true,
      },
      document_type: {
        type: Sequelize.ENUM('cc', 'ce', 'nit', 'passport', 'ti'),
        allowNull: true,
      },
      document_number: {
        type: Sequelize.STRING(40),
        allowNull: true,
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable('acopio_needs');
  },
};
