'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('acopio_contacts', {
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
      type: {
        type: Sequelize.ENUM('whatsapp', 'email'),
        allowNull: false,
      },
      value: {
        type: Sequelize.STRING(180),
        allowNull: false,
      },
      id_country: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'countries', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      label: {
        type: Sequelize.STRING(120),
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
    await queryInterface.dropTable('acopio_contacts');
  },
};
