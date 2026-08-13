'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(180),
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      google_id: {
        type: Sequelize.STRING(120),
        allowNull: true,
        unique: true,
      },
      name: {
        type: Sequelize.STRING(180),
        allowNull: false,
      },
      auth_provider: {
        type: Sequelize.ENUM('google', 'local'),
        allowNull: false,
      },
      invitation_status: {
        type: Sequelize.ENUM('pending', 'active'),
        allowNull: false,
        defaultValue: 'active',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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
    await queryInterface.dropTable('users');
  },
};
