"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Organizations", "onboarding", {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {
        dashboard: { status: "pending", lastStep: 0 },
        myDocuments: { status: "pending", lastStep: 0 },
        sop: { status: "pending", lastStep: 0 },
        leads: { status: "pending", lastStep: 0 },
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Organizations", "onboarding");
  },
};
