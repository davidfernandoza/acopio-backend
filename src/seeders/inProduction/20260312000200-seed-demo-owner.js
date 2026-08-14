'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const passwordHash = await bcrypt.hash('Acopio123!', 10);

    await queryInterface.bulkInsert('users', [
      {
        email: 'demo@acopio.local',
        password_hash: passwordHash,
        google_id: null,
        name: 'Demo Owner',
        auth_provider: 'local',
        invitation_status: 'active',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { email: 'demo@acopio.local' }, {});
  },
};
