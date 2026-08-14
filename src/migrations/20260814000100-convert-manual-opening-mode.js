'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `UPDATE acopios SET opening_mode = 'indefinite' WHERE opening_mode = 'manual'`
    );
  },

  async down() {
    // Values previously stored as manual cannot be restored.
  },
};
