'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'must_change_password', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.sequelize.query(`
      UPDATE users
      SET must_change_password = true
      WHERE invitation_status = 'pending'
    `);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'must_change_password');
  },
};
