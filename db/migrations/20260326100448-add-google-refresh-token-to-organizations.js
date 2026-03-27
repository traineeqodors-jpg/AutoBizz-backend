"use strict";
 
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Organizations", "googleRefreshToken", {
      type: Sequelize.STRING,
      allowNull: true, // Set to false if it's mandatory
    });
  },
 
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Organizations", "googleRefreshToken");
  },
};
 