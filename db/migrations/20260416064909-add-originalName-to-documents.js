"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Documents", "originalName", {
      type: Sequelize.STRING,
      allowNull: true, // Set to true initially if you have existing data
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Documents", "originalName");
  },
};
