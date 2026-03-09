'use strict';

const bcrypt = require("bcrypt")

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Manually hash passwords for seeding since bulkInsert bypasses hooks
    
    return queryInterface.bulkInsert('Tenants', [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '+91-9876543210',
        password: bcrypt.hashSync("Password@123" , 12),
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phoneNumber: '+1-1234567890',
        password: bcrypt.hashSync("Password@123" , 12),
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Tenants', null, {});
  }
};
