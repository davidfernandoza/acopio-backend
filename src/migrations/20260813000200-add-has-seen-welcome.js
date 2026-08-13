'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'has_seen_welcome', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.sequelize.query(`
      UPDATE users
      SET has_seen_welcome = true
      WHERE invitation_status = 'active'
    `);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'has_seen_welcome');
  },
};
