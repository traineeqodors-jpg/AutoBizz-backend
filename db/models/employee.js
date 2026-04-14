"use strict";
const { Model } = require("sequelize");
const { hashPassword, comparePassword } = require("../../src/utils/authHelper");
const jwt = require("jsonwebtoken");

module.exports = (sequelize, DataTypes) => {
  class Employee extends Model {
    static associate(models) {
      Employee.belongsTo(models.Organization, {
        foreignKey: "orgId",
        as: "organization",
      });
    }

    async validPassword(password) {
      return await comparePassword(password, this.password);
    }
  }

  Employee.init(
    {
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: { msg: "First name is required" } },
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: { msg: "Last name is required" } },
      },
      phoneNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      orgId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
       googleRefreshToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      refreshToken: DataTypes.TEXT,
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: { msg: "Invalid email address" } },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          is: {
            args: /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/,
            msg: "Password must be at least 8 characters long, including one number and one special character",
          },
        },
      },
      profileImage: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      role: {
        type: DataTypes.ENUM("sales", "employee"),
        defaultValue: "employee",
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Employee",
      tableName: "Employees",
      hooks: {
        beforeSave: async (employee) => {
          if (employee.changed("password")) {
            employee.password = await hashPassword(employee.password);
          }
        },
      },
    }
  );

  Employee.prototype.generateAccessToken = function () {
    return jwt.sign(
      {
        id: this.id,
        orgId: this.orgId,
        email: this.email,
        role: this.role,
        type : "employee"
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
  };

  Employee.prototype.generateRefreshToken = function () {
  return jwt.sign(
    { id: this.id  , type : "employee"},
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

  return Employee;
};
