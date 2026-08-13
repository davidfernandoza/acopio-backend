'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('acopio_managers', {
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
      id_user: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      id_invited_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      role: {
        type: Sequelize.ENUM('manager'),
        allowNull: false,
        defaultValue: 'manager',
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

    await queryInterface.addIndex('acopio_managers', ['id_acopio', 'id_user'], {
      unique: true,
      name: 'acopio_managers_acopio_user_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('acopio_managers');
  },
};
