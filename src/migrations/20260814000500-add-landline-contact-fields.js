'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('acopio_contacts');

    if (!tableDescription.local_prefix) {
      await queryInterface.addColumn('acopio_contacts', 'local_prefix', {
        type: Sequelize.STRING(10),
        allowNull: true,
      });
    }

    if (!tableDescription.extension) {
      await queryInterface.addColumn('acopio_contacts', 'extension', {
        type: Sequelize.STRING(20),
        allowNull: true,
      });
    }

    await queryInterface.sequelize.query(`
      ALTER TABLE acopio_contacts
      ALTER COLUMN type TYPE VARCHAR(40)
    `);
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_acopio_contacts_type"
    `);
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_acopio_contacts_type" AS ENUM ('whatsapp', 'email', 'landline')
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE acopio_contacts
      ALTER COLUMN type TYPE "enum_acopio_contacts_type"
      USING type::"enum_acopio_contacts_type"
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE acopio_contacts
      ALTER COLUMN type TYPE VARCHAR(40)
    `);
    await queryInterface.sequelize.query(`
      UPDATE acopio_contacts
      SET type = 'whatsapp'
      WHERE type = 'landline'
    `);
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_acopio_contacts_type"
    `);
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_acopio_contacts_type" AS ENUM ('whatsapp', 'email')
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE acopio_contacts
      ALTER COLUMN type TYPE "enum_acopio_contacts_type"
      USING type::"enum_acopio_contacts_type"
    `);

    await queryInterface.removeColumn('acopio_contacts', 'extension');
    await queryInterface.removeColumn('acopio_contacts', 'local_prefix');
  },
};
