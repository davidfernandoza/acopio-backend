'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('acopios');

    if (!tableDescription.avatar_path) {
      await queryInterface.addColumn('acopios', 'avatar_path', {
        type: Sequelize.STRING(500),
        allowNull: true,
      });
    }

    if (!tableDescription.avatar_url) {
      await queryInterface.addColumn('acopios', 'avatar_url', {
        type: Sequelize.STRING(500),
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const tableDescription = await queryInterface.describeTable('acopios');

    if (tableDescription.avatar_url) {
      await queryInterface.removeColumn('acopios', 'avatar_url');
    }

    if (tableDescription.avatar_path) {
      await queryInterface.removeColumn('acopios', 'avatar_path');
    }
  },
};
