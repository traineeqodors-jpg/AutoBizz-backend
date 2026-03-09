"use strict";
const bcrypt = require("bcrypt");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Organizations", [
      {
        
        firstName: "Demo",
        lastName: "User",
        businessName: "Demo Solutions",
        businessSize: 50,
        country: "India",
        email: "admin@demo.com",
        phoneNumber: "+91-9875654321",
        password: bcrypt.hashSync("Password@123", 12), 
        role: "user",
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    
    await queryInterface.bulkDelete("Organizations", { email: "admin@autobizz.com" }, {});
  },
};
