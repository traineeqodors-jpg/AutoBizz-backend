"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Employees", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      orgId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Organizations", // Name of the target table
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      firstName: { type: Sequelize.STRING, allowNull: false },
      lastName: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, unique: true, allowNull: false },
      password: { type: Sequelize.STRING, allowNull: false },
      phone: { type: Sequelize.STRING },
      role: {
        type: Sequelize.ENUM("emp", "sales", "manager"),
        defaultValue: "emp",
      },
      profileImage: { type: Sequelize.STRING },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Employees");
    // For Postgres, you may also need to drop the ENUM type manually
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_Employees_role";',
    );
  },
};
