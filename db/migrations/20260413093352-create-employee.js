"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Employees", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      firstName: { type: Sequelize.STRING, allowNull: false },
      lastName: { type: Sequelize.STRING, allowNull: false },
      phoneNumber: { type: Sequelize.STRING, allowNull: false },
      isVerified: { type: Sequelize.BOOLEAN, defaultValue: false },
      orgId: {
        type: Sequelize.INTEGER,
        references: { model: "Organizations", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      password: { type: Sequelize.STRING, allowNull: false },
      profileImage: { type: Sequelize.STRING, allowNull: true },
      role: {
        type: Sequelize.ENUM("sales", "employee"),
        defaultValue: "employee",
        allowNull: false,
      },
       refreshToken: {
        type: Sequelize.TEXT,
      },
      googleRefreshToken : {
         type : Sequelize.STRING,
         allowNull : true
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Employees");
  },
};
