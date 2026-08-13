'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('acopio_images', {
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
      file_path: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
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

    await queryInterface.addIndex('acopio_images', ['id_acopio', 'sort_order'], {
      unique: true,
      name: 'acopio_images_acopio_sort_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('acopio_images');
  },
};
