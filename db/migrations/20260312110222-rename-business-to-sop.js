"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn(
      "OrganizationDetails",
      "businessSummary",
      "sop",
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn(
      "OrganizationDetails",
      "sop",
      "businessSummary",
    );
  },
};
