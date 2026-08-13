'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('acopio_offers');

    if (!tableDescription.icon_key) {
      await queryInterface.addColumn('acopio_offers', 'icon_key', {
        type: Sequelize.STRING(40),
        allowNull: false,
        defaultValue: 'otro',
      });
    }
  },

  async down(queryInterface) {
    const tableDescription = await queryInterface.describeTable('acopio_offers');
    if (tableDescription.icon_key) {
      await queryInterface.removeColumn('acopio_offers', 'icon_key');
    }
  },
};
