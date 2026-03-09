"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Organizations", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false, 
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false, 
      },
      businessName: {
        type: Sequelize.STRING,
        allowNull: false, 
      },
      businessSize: {
        type: Sequelize.STRING,
      },
      country: {
        type: Sequelize.STRING,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true, 
      },
      phoneNumber: {
        type: Sequelize.STRING,
        unique : true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false, 
      },
      refreshToken: {
        type: Sequelize.TEXT,
      },
      role: {
        type: Sequelize.ENUM("admin", "owner", "user"),
        defaultValue: "user",
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Organizations");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_Organizations_role";'
    );
  },
};
