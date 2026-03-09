"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("OrganizationDetails", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },

      orgCategory: {
        type: Sequelize.STRING,
      },

      description: {
        type: Sequelize.TEXT("long"),
      },
      startedInYear: {
        type: Sequelize.DATEONLY, 
        allowNull: true,
      },
      businessSummary: {
        type: Sequelize.TEXT("long"), 
      },
      orgId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true, 
        references: {
          model: "Organizations",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
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
    await queryInterface.dropTable("OrganizationDetails");
  },
};
